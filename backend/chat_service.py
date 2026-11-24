import os
import re
from typing import Dict, List, Optional, Any
from backend.data_loader import DataLoader, normalize_turkish
from backend.model_service import ModelService
from backend.advisor_service import AdvisorService, parse_turkish_rank
from backend.analytics_service import AnalyticsService

try:
    from dotenv import load_dotenv
    load_dotenv()
    if not os.environ.get("OPENAI_API_KEY") and os.path.exists(".env.example"):
        load_dotenv(".env.example")
except ImportError:
    pass


class ChatService:
    def __init__(
        self,
        data_loader: DataLoader,
        model_service: ModelService,
        advisor_service: AdvisorService,
        analytics_service: AnalyticsService,
    ):
        self.data_loader = data_loader
        self.model_service = model_service
        self.advisor_service = advisor_service
        self.analytics_service = analytics_service
        self.openai_model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")

    def _extract_rank_from_text(self, text: str) -> Optional[int]:
        """Extract rank like '45.000' or '45000' or '120 bin' from Turkish query."""
        if not text:
            return None

        # Check 'X bin' (e.g. 45 bin, 120 bin)
        bin_match = re.search(r"(\d{1,3})\s*(?:bin|k)\b", text, re.IGNORECASE)
        if bin_match:
            try:
                return int(bin_match.group(1)) * 1000
            except ValueError:
                pass

        # Check dot separated or raw numbers with rank context
        patterns = [
            r"(\d{1,3}(?:\.\d{3})+)",  # 45.000 or 120.000
            r"\b(\d{4,6})\b",          # 45000 or 125000
        ]
        for pat in patterns:
            matches = re.findall(pat, text)
            for m in matches:
                val = parse_turkish_rank(m)
                if val and 100 <= val <= 2500000:
                    return val
        return None

    def _extract_score_type_from_text(self, text: str) -> Optional[str]:
        """Extract score type like SAY, EA, SÖZ, DİL."""
        norm = normalize_turkish(text).upper()
        if re.search(r"\bSAYISAL\b|\bSAY\b", norm):
            return "SAY"
        if re.search(r"\bESIT AGIRLIK\b|\bEA\b|\bTM\b", norm):
            return "EA"
        if re.search(r"\bSOZEL\b|\bSOZ\b", norm):
            return "SÖZ"
        if re.search(r"\bDIL\b|\bYABANCI DIL\b", norm):
            return "DİL"
        return None

    def _find_relevant_programs(
        self,
        query: str,
        score_type: Optional[str] = None,
        rank: Optional[int] = None,
        max_items: int = 5,
    ) -> List[Dict[str, Any]]:
        """Search and evaluate programs relevant to user's chat query."""
        norm_q = normalize_turkish(query)

        # Detect department keywords
        common_depts = [
            ("bilgisayar", "Bilgisayar Mühendisliği"),
            ("yazilim", "Yazılım Mühendisliği"),
            ("yapay zeka", "Yapay Zeka Mühendisliği"),
            ("elektrik", "Elektrik-Elektronik Mühendisliği"),
            ("endustri", "Endüstri Mühendisliği"),
            ("makine", "Makine Mühendisliği"),
            ("tip", "Tıp"),
            ("dis hekimligi", "Diş Hekimliği"),
            ("eczacilik", "Eczacılık"),
            ("hukuk", "Hukuk"),
            ("psikoloji", "Psikoloji"),
            ("ybs", "Yönetim Bilişim Sistemleri"),
            ("yonetim bilisim", "Yönetim Bilişim Sistemleri"),
            ("hemsirelik", "Hemşirelik"),
            ("fizyoterapi", "Fizyoterapi ve Rehabilitasyon"),
            ("mimarlik", "Mimarlık"),
            ("iktisat", "İktisat"),
            ("isletme", "İşletme"),
            ("uluslararasi iliskiler", "Uluslararası İlişkiler"),
        ]

        target_depts = []
        for kw, dept_name in common_depts:
            if kw in norm_q:
                target_depts.append(dept_name)

        # Search candidates
        pool = []
        if target_depts and rank and score_type:
            # Use advisor recommendation engine
            rec_res = self.advisor_service.recommend({
                "score_type": score_type,
                "rank": rank,
                "target_programs": target_depts,
            })
            if rec_res.get("status") == "success":
                for item in rec_res.get("items", [])[:max_items]:
                    pool.append({
                        "program_code": item["program_code"],
                        "university_name": item["university_name"],
                        "program_name": item["program_name"],
                        "city": item.get("city") or "Belirtilmemiş",
                        "score_type": item["score_type"],
                        "latest_rank": item.get("latest_rank"),
                        "predicted_rank": item.get("latest_rank"),
                        "category": item.get("category", "target"),
                        "category_label": item.get("category_label", "İdeal Hedef"),
                    })
                return pool

        # General keyword search in DataLoader
        search_terms = target_depts if target_depts else [query[:30].strip()]
        for term in search_terms:
            res = self.data_loader.search_programs(
                query=term,
                score_type=score_type if score_type else "ALL",
                page=1,
                page_size=20,
            )
            for prog in res.get("items", []):
                # Get latest closing rank
                hist = prog.get("history", [])
                latest_rank = None
                latest_quota = None
                for h in sorted(hist, key=lambda x: -x["year"]):
                    if h.get("closing_rank"):
                        latest_rank = h["closing_rank"]
                        latest_quota = h.get("published_quota")
                        break

                # Get model prediction if supported
                pred_rank = latest_rank
                category = "target"
                category_label = "İdeal Hedef"
                if latest_rank and rank:
                    diff = rank - latest_rank
                    if diff < -latest_rank * 0.15:
                        category = "safe"
                        category_label = "Güvenli Liman"
                    elif diff > latest_rank * 0.15:
                        category = "reach"
                        category_label = "Üst Hedef / Risk"

                pool.append({
                    "program_code": prog["program_code"],
                    "university_name": prog["university_name"],
                    "program_name": prog["program_name"],
                    "city": prog.get("city") or "Belirtilmemiş",
                    "score_type": prog["score_type"],
                    "latest_rank": latest_rank,
                    "predicted_rank": pred_rank,
                    "category": category,
                    "category_label": category_label,
                })
                if len(pool) >= max_items:
                    break
            if len(pool) >= max_items:
                break

        return pool

    def _generate_rule_based_reply(
        self,
        message: str,
        student_rank: Optional[int],
        score_type: Optional[str],
        referenced_programs: List[Dict[str, Any]],
        context: Dict[str, Any],
    ) -> Dict[str, Any]:
        """High quality, grounded fallback counselor engine when LLM API is unavailable."""
        norm_msg = normalize_turkish(message).lower()
        parts = []

        # Greeting & acknowledgement
        greeting = "Merhaba! YKS Tercih Asistanı AI Danışmanın olarak buradayım. 🎓"
        parts.append(greeting)

        # Handle rank context
        if student_rank and score_type:
            parts.append(
                f"**Senin Profilin:** {score_type} puan türünde **{student_rank:,.0f}** başarı sırasına göre değerlendiriyorum."
            )
        elif student_rank:
            parts.append(f"**Senin Başarı Sıran:** **{student_rank:,.0f}** olarak dikkate alıyorum.")

        # Intent 1: Portfolio / 24 choice distribution strategy
        if any(w in norm_msg for w in ["24 tercih", "dagilim", "nasil dagit", "strateji", "portfoy", "kac tercih"]):
            parts.append(
                "### 📊 24 Tercih Altın Kuralı (Dengeli Portföy Stratejisi)\n\n"
                "ÖSYM'nin tanıdığı 24 tercih hakkını tek bir risk seviyesine yığmak açıkta kalma riskini artırır. "
                "En sağlıklı ve uzmanlarca önerilen tercih piramidi şöyledir:\n\n"
                "1. **1 – 6. Sıralar (Üst Hedef & Hayal Tercihler - %20-25):**\n"
                "   - Başarı sıranın %15 ila %30 önündeki, 'gelmesi zor ama gelirse çok mutlu olacağım' dediğin rüya bölümleri yaz.\n"
                "2. **7 – 18. Sıralar (İdeal Hedef & Gerçekçi Bölümler - %50):**\n"
                "   - Sıralamanın hemen önünde, birebir hizasında ve %15 gerisinde olan, kazanma olasılığı en kuvvetli ana gövde tercihlerindir.\n"
                "3. **19 – 24. Sıralar (Güvenli Liman & Garanti Tercihler - %25-30):**\n"
                "   - Sıralamanın %25 ila %50 gerisindeki, açıkta kalmanı kesinlikle önleyecek ve kaydolmaktan pişman olmayacağın bölümlerle listeni güvene al."
            )

        # Intent 2: Ölü Tercih
        elif any(w in norm_msg for w in ["olu tercih", "olu", "siralama hatasi"]):
            parts.append(
                "### ⚠️ Ölü Tercih Kuralı Nedir ve Nasıl Önlenir?\n\n"
                "YKS yerleştirmelerinde **ÖSYM yalnızca senin puanına/sıralamana bakar**, listenin sırasına bakmaz. "
                "Ancak genel kural olarak:\n"
                "- Taban sırası daha geride (daha kolay kazanılan) bir bölümü, taban sırası daha önde olan bir bölümün üzerine yazarsan, "
                "üstteki bölüm kazanıldığı an alttaki yüksek prestijli bölüme sistem bakmaz bile.\n"
                "- **İstisna:** Eğer bir bölümü diğerinden gerçekten ÇOK DAHA FAZLA istiyorsan, puanı biraz düşük olsa bile üste yazabilirsin. "
                "Önemli olan üniversiteye gittiğinde o bölümde mutlu olmandır."
            )

        # Intent 3: Living cost / City inquiry
        elif any(w in norm_msg for w in ["sehir", "kira", "yurt", "maliyet", "istanbul", "ankara", "izmir", "eskisehir"]):
            parts.append(
                "### 🏠 Öğrenci Yaşamı & Şehir Maliyetleri Rehberi\n\n"
                "- **Büyükşehirler (İstanbul, Ankara, İzmir, Antalya):** Sosyal olanaklar, staj ve networking açısından zengindir ancak "
                "kira ve barınma giderleri yüksektir. KYK veya üniversite yurt imkanlarını mutlaka önceden araştırmalısın.\n"
                "- **Öğrenci Dostu Dengeli Şehirler (Eskişehir, Bursa, Konya, Kocaeli, Trabzon):** Kampüs yaşamı canlı, ulaşım kolay "
                "ve öğrencilik maliyeti büyükşehirlere kıyasla daha dengelidir.\n"
                "- **Harita Modülü İpucu:** Sitemizdeki **'Türkiye Haritası'** sekmesine tıklayarak 81 ilin kira indeksini ve KYK kapasitesini görebilirsin!"
            )

        # Intent 4: Trends / Popularity
        elif any(w in norm_msg for w in ["trend", "populer", "yukselen", "borsa", "gelecek"]):
            parts.append(
                "### 📈 2026 YKS Trend & Popülarite Görünümü\n\n"
                "- **Yükselenler (Talep Patlaması):** Yapay Zeka Mühendisliği, Yazılım Mühendisliği ve Yönetim Bilişim Sistemleri (YBS) "
                "son 3 yılda sıralamalarını her yıl ortalama %15-%30 öne çekmektedir.\n"
                "- **Dengelenen / Fırsat Alanları:** Tıp ve Temel Mühendislik (Makine, İnşaat) programlarında taban sıralamalarında "
                "hafif bir gevşeme gözlenmekte, bu da adaylara köklü devlet üniversitelerinde fırsat pencereleri açmaktadır."
            )

        # Default / Recommendations
        else:
            if referenced_programs:
                parts.append(
                    f"Aramana ve kriterlerine uygun olarak YÖK Atlas veri tabanımızdan tespit ettiğim en güçlü lisans programları aşağıdadır:\n\n"
                    f"Bu programları kendi sıralamanla karşılaştırarak listene ekleyebilir, simülasyonunu test edebilirsin."
                )
            else:
                parts.append(
                    "Sana en doğru önerileri sunabilmem için **YKS başarı sıranı (Örn: 45.000)**, **puan türünü (SAY, EA, SÖZ)** "
                    "ve aklındaki bölüm veya şehirleri belirtirsen, LightGBM modelimiz ve 13.581 programlık veri tabanımızla "
                    "birebir sana özel bir liste çıkarabilirim!"
                )

        suggestions = [
            "24 tercihi nasıl dağıtmalıyım?",
            "Ölü tercih nedir, nelere dikkat etmeliyim?",
            "Öğrenci kenti olarak hangi şehirleri önerirsin?",
        ]
        if score_type == "SAY" or "sayisal" in norm_msg:
            suggestions = [
                "Bilgisayar ve Yazılım Mühendisliği için hangi üniversiteler gelir?",
                "Tıp Fakültesi mi Diş Hekimliği mi seçmeliyim?",
                "24 tercihi Risk - İdeal - Güvenli olarak nasıl dağıtmalıyım?",
            ]
        elif score_type == "EA" or "esit agirlik" in norm_msg:
            suggestions = [
                "Eşit Ağırlıkta Hukuk mu YBS mi daha avantajlı?",
                "İktisat ve İşletme için öne çıkan üniversiteler hangileri?",
                "24 tercih listesi stratejisi nasıl kurulur?",
            ]

        return {
            "status": "success",
            "reply": "\n\n".join(parts),
            "source": "verified_rule_engine",
            "referenced_programs": referenced_programs,
            "suggestions": suggestions,
        }

    def chat(
        self,
        message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        student_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Main chat endpoint handling OpenAI GPT-4o-mini with RAG grounding and resilient fallback."""
        if conversation_history is None:
            conversation_history = []
        if student_context is None:
            student_context = {}

        # Extract rank and score type from context or message
        rank = student_context.get("rank")
        if not rank:
            rank = self._extract_rank_from_text(message)

        score_type = student_context.get("score_type")
        if not score_type:
            score_type = self._extract_score_type_from_text(message)

        # Retrieve relevant programs
        referenced_programs = self._find_relevant_programs(
            query=message,
            score_type=score_type,
            rank=rank,
            max_items=4,
        )

        api_key = os.environ.get("OPENAI_API_KEY", "").strip()

        if not api_key:
            return self._generate_rule_based_reply(
                message=message,
                student_rank=rank,
                score_type=score_type,
                referenced_programs=referenced_programs,
                context=student_context,
            )

        # Prepare RAG prompt
        context_snippets = []
        if rank and score_type:
            context_snippets.append(f"- Öğrenci Profili: {score_type} puan türü, {rank:,.0f} YKS Başarı Sırası")
        elif rank:
            context_snippets.append(f"- Öğrenci Başarı Sırası: {rank:,.0f}")
        elif score_type:
            context_snippets.append(f"- Hedeflenen Puan Türü: {score_type}")

        if referenced_programs:
            context_snippets.append("- Sistemden Sorgulanan İlgili Lisans Programları:")
            for p in referenced_programs:
                lr_str = f"{p['latest_rank']:,.0f}" if p.get("latest_rank") else "Bilinmiyor"
                context_snippets.append(
                    f"  * [{p['program_code']}] {p['university_name']} - {p['program_name']} ({p['city']}) | "
                    f"Son Taban Sıra: {lr_str} | Kategori: {p['category_label']}"
                )

        rag_data_str = "\n".join(context_snippets) if context_snippets else "Öğrenci henüz özel profil belirtmedi."

        system_prompt = (
            "Sen üniversite adayları ve aileleri için çalışan, yapay zeka destekli kıdemli, bilge, samimi ve "
            "sıcakkanlı bir YKS Tercih Danışmanısın (Rehber Öğretmen). "
            "Platformumuz Türkiye'deki 13.581 lisans programı, LightGBM 2026 taban sıralaması tahmin modeli, "
            "şehir yaşam maliyetleri ve 24'lük tercih listesi stratejisi ile doğrudan entegredir.\n\n"
            "GÖREVLERİN VE KURALLARIN:\n"
            "1. YKS SIRALAMA MANTIĞI: Sıralamada sayı küçüldükçe başarının ve rekabetin ARTTIĞINI, sayı büyüdükçe "
            "sıralamanın gerilediğini ve kazanmanın kolaylaştığını ASLA unutma (Örn: 20.000, 50.000'den daha iyidir).\n"
            "2. 24 TERCİH STRATEJİSİ: Adaylara her zaman 24'lük listenin dengeli dağılımını tavsiye et: "
            "İlk %20-25 Üst Hedef (Hayal), %50 İdeal Hedef (Sıralamaya yakın), %25-30 Güvenli Liman (Garanti).\n"
            "3. VERİ ODAKLI VE SOMUT OL: Soruya göre sistem verilerinde listelenen gerçek üniversite ve programları "
            "isimleriyle, son taban sıralarıyla ve şehirleriyle an. Asla uydurma veri söyleme.\n"
            "4. SAMİMİ VE PEDAGOJİK DİL: Adaya 'sen' diye hitap et, moral verici, gerçekçi ve sakinleştirici ol.\n"
            "5. BİÇİMLENDİRME: Markdown başlıkları, madde imleri ve kalın vurgular kullanarak cevabı son derece "
            "okunaklı ve profesyonel kıl. Cevabın sonunda adayın düşünebileceği bir soru veya sonraki adım önerisi bırak.\n"
            "6. Kesin yerleşme taahhüdü verme; YÖK Atlas ve ÖSYM kılavuzunun nihai başvuru kaynağı olduğunu hatırlat."
        )

        user_content = (
            f"[SİSTEM VERİ BAĞLAMI]\n{rag_data_str}\n\n"
            f"[ÖĞRENCİ MESAJI]\n{message}"
        )

        # Build message history for OpenAI
        messages = [{"role": "system", "content": system_prompt}]
        # Keep last 6 history messages
        for hist in conversation_history[-6:]:
            role = hist.get("role", "user")
            content = hist.get("content", "")
            if role in ["user", "assistant"] and content:
                messages.append({"role": role, "content": content})
        messages.append({"role": "user", "content": user_content})

        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key, timeout=8.0)
            completion = client.chat.completions.create(
                model=self.openai_model,
                messages=messages,
                temperature=0.4,
                max_tokens=900,
            )
            reply_text = completion.choices[0].message.content.strip()

            # Dynamic follow up suggestions
            suggestions = [
                "24 tercihi nasıl dağıtmalıyım?",
                "Bu alanda en çok yükselen bölümler hangileri?",
                "Öğrenci kenti olarak hangi şehirleri önerirsin?",
            ]
            if rank and score_type:
                suggestions = [
                    f"{score_type} {rank:,.0f} için güvenli liman seçenekleri neler?",
                    "Ölü tercih riskini nasıl kontrol edebilirim?",
                    "Kontenjan değişimleri sıralamamı nasıl etkiler?",
                ]

            return {
                "status": "success",
                "reply": reply_text,
                "source": "openai",
                "model": self.openai_model,
                "referenced_programs": referenced_programs,
                "suggestions": suggestions,
            }
        except Exception as e:
            print(f"[ChatService] OpenAI call error: {e}. Falling back to rule engine.")
            fallback = self._generate_rule_based_reply(
                message=message,
                student_rank=rank,
                score_type=score_type,
                referenced_programs=referenced_programs,
                context=student_context,
            )
            fallback["source"] = "fallback"
            return fallback
