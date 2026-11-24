import os
import re
from typing import Dict, List, Optional, Any
from backend.data_loader import DataLoader, normalize_turkish
from backend.model_service import ModelService
from backend.advisor_service import AdvisorService, parse_turkish_rank
from backend.analytics_service import AnalyticsService
from backend.explanation_service import ExplanationService

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
        explanation_service: Optional[ExplanationService] = None,
    ):
        self.data_loader = data_loader
        self.model_service = model_service
        self.advisor_service = advisor_service
        self.analytics_service = analytics_service
        self.explanation_service = explanation_service
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

    def _build_xai_program_info(self, prog: Dict[str, Any], student_rank: Optional[int]) -> Dict[str, Any]:
        """Compute LightGBM prediction, TreeSHAP values, confidence interval, and natural XAI explanation."""
        hist = prog.get("history", [])
        latest_rank = None
        latest_quota = None
        for h in sorted(hist, key=lambda x: -x["year"]):
            if h.get("closing_rank"):
                latest_rank = h["closing_rank"]
                latest_quota = h.get("published_quota")
                break

        # Compute Explainable AI prediction & SHAP via ModelService
        pred_res = self.model_service.get_prediction_and_shap(prog)
        if pred_res.get("status") == "success":
            preds = pred_res.get("predictions", {})
            pred_point = round(float(preds.get("predicted_closing_rank", latest_rank or 0)))
            interval = preds.get("prediction_interval", {})
            interval_lower = round(float(interval.get("lower", pred_point * 0.95)))
            interval_upper = round(float(interval.get("upper", pred_point * 1.05)))
            margin_pct = round(float(interval.get("margin_pct", 5.0)), 1)

            shap_data = pred_res.get("shap", {})
            dominant_feature = shap_data.get("dominant_feature", "previous_closing_rank")
            signed_contribs = shap_data.get("signed_contributions", {})

            dominant_label_map = {
                "previous_closing_rank": "Geçmiş Taban Sıralaması & Yerleşik Talep",
                "published_quota": "Kontenjan Hacmi",
                "quota_change_pct": "Kontenjan Değişim Oranı",
                "rank_momentum_ratio": "Son 3 Yıllık Sıralama İvmesi (Trend)",
            }
            dominant_factor_label = dominant_label_map.get(dominant_feature, "Yerleşik Taban Eğilimi")

            inputs = pred_res.get("inputs", {})
            quota_chg = inputs.get("quota_change_pct", 0)
            momentum = inputs.get("rank_momentum_ratio", 1.0)

            xai_parts = [
                f"LightGBM 2026 Tahmini: {pred_point:,.0f} taban sırası.",
                f"%80 Güvenli Tercih Koridoru: {interval_lower:,.0f} – {interval_upper:,.0f} (±%{margin_pct:.1f}).",
                f"TreeSHAP Karar Faktörü: En belirleyici ağırlık '{dominant_factor_label}' olarak hesaplandı.",
            ]
            if abs(quota_chg) >= 3:
                direction = "artışı" if quota_chg > 0 else "daralması"
                effect_dir = "sıralamayı geriye esnetici (kolaylaştırıcı)" if quota_chg > 0 else "rekabeti artırıcı (öne çekici)"
                xai_parts.append(f"Kontenjandaki %{abs(quota_chg):.1f} {direction}, {effect_dir} bir baskı oluşturmaktadır.")

            if abs(momentum - 1.0) >= 0.05:
                trend_dir = "yükseliş (popülerleşme / öne çekilme)" if momentum < 1.0 else "gevşeme (daha kolay giriş / fırsat)"
                xai_parts.append(f"Son 3 yıllık talep dinamiklerinde {trend_dir} ivmesi tespit edilmiştir.")

            xai_explanation = " ".join(xai_parts)
            eval_rank = pred_point
        else:
            pred_point = latest_rank
            interval_lower = None
            interval_upper = None
            margin_pct = None
            dominant_feature = "previous_closing_rank"
            dominant_factor_label = "2025 Resmi Taban Sırası"
            xai_explanation = f"Geçmiş yıl resmi taban sıralaması ({latest_rank:,.0f} sıra) referans alınmıştır." if latest_rank else "Resmi taban bilgisi bekleniyor."
            eval_rank = latest_rank

        # Categorize student relative to predicted rank
        category = "target"
        category_label = "İdeal Hedef"
        if eval_rank and student_rank:
            diff = student_rank - eval_rank
            if diff < -eval_rank * 0.15:
                category = "safe"
                category_label = "Güvenli Liman (Daha Ulaşılabilir)"
            elif diff > eval_rank * 0.15:
                category = "reach"
                category_label = "Üst Hedef (Risk / Hayal)"

        return {
            "program_code": prog["program_code"],
            "university_name": prog["university_name"],
            "program_name": prog["program_name"],
            "city": prog.get("city") or "Belirtilmemiş",
            "score_type": prog["score_type"],
            "latest_rank": latest_rank,
            "predicted_rank": pred_point,
            "interval_lower": interval_lower,
            "interval_upper": interval_upper,
            "margin_pct": margin_pct,
            "dominant_factor": dominant_feature,
            "dominant_factor_label": dominant_factor_label,
            "xai_explanation": xai_explanation,
            "category": category,
            "category_label": category_label,
        }

    def _find_relevant_programs(
        self,
        query: str,
        score_type: Optional[str] = None,
        rank: Optional[int] = None,
        max_items: int = 4,
    ) -> List[Dict[str, Any]]:
        """Search and evaluate programs with Explainable AI (XAI) predictions and SHAP decomposition."""
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
        seen_codes = set()

        if target_depts and rank and score_type:
            # Use advisor recommendation engine
            rec_res = self.advisor_service.recommend({
                "score_type": score_type,
                "rank": rank,
                "target_programs": target_depts,
            })
            if rec_res.get("status") == "success":
                for item in rec_res.get("items", [])[:max_items]:
                    p_code = item["program_code"]
                    if p_code in seen_codes:
                        continue
                    seen_codes.add(p_code)
                    full_prog = self.data_loader.get_program(p_code)
                    if full_prog:
                        xai_item = self._build_xai_program_info(full_prog, rank)
                        pool.append(xai_item)
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
                p_code = prog["program_code"]
                if p_code in seen_codes:
                    continue
                seen_codes.add(p_code)

                xai_item = self._build_xai_program_info(prog, rank)
                pool.append(xai_item)

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
        """High quality, explainable fallback counselor engine when LLM API is unavailable."""
        norm_msg = normalize_turkish(message).lower()
        parts = []

        # Greeting & acknowledgement
        greeting = "Merhaba! **Açıklanabilir Yapay Zeka (XAI) Destekli YKS Tercih Danışmanın** olarak buradayım. 🎓"
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

        # Default / Recommendations with explicit XAI breakdown
        else:
            if referenced_programs:
                parts.append("### 🧠 Açıklanabilir Yapay Zeka (XAI) ve Model Analizi")
                parts.append(
                    "Aşağıdaki programlar sadece geçmiş yıl verisiyle değil; **LightGBM regresyonu, kontenjan baskısı "
                    "ve TreeSHAP karar ağırlıkları** şeffaf biçimde incelenerek 2026 yılı için projeksiyonlandırılmıştır:\n"
                )
                for p in referenced_programs:
                    koridor = f"%80 Koridor: {p['interval_lower']:,.0f} – {p['interval_upper']:,.0f}" if p.get("interval_lower") else ""
                    pred_str = f"{p['predicted_rank']:,.0f}" if p.get("predicted_rank") else "—"
                    parts.append(
                        f"• **{p['university_name']} – {p['program_name']}** ({p['city']})\n"
                        f"  - **2026 Model Tahmini:** {pred_str} taban sırası ({koridor})\n"
                        f"  - **XAI Karar Faktörü (TreeSHAP):** {p.get('dominant_factor_label', 'Geçmiş Taban İstikrarı')}\n"
                        f"  - **Senin Sıralamana Göre Durum:** {p['category_label']}"
                    )
            else:
                parts.append(
                    "Sana en doğru önerileri sunabilmem için **YKS başarı sıranı (Örn: 45.000)**, **puan türünü (SAY, EA, SÖZ)** "
                    "ve aklındaki bölüm veya şehirleri belirtirsen, LightGBM modelimiz ve 13.581 programlık veri tabanımızla "
                    "birebir sana özel Açıklanabilir Yapay Zeka analizi çıkarabilirim!"
                )

        suggestions = [
            "24 tercihi nasıl dağıtmalıyım?",
            "Ölü tercih nedir, nelere dikkat etmeliyim?",
            "Öğrenci kenti olarak hangi şehirleri önerirsin?",
        ]
        if score_type == "SAY" or "sayisal" in norm_msg:
            suggestions = [
                "Bilgisayar ve Yazılım Mühendisliği için model tahminleri neler?",
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
        """Main chat endpoint handling OpenAI GPT-4o-mini with Explainable AI (XAI) grounding and resilient fallback."""
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

        # Retrieve relevant programs with Explainable AI predictions
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

        # Prepare rich Explainable AI (XAI) RAG context
        context_snippets = []
        if rank and score_type:
            context_snippets.append(f"- Öğrenci Profili: {score_type} puan türü, {rank:,.0f} YKS Başarı Sırası")
        elif rank:
            context_snippets.append(f"- Öğrenci Başarı Sırası: {rank:,.0f}")
        elif score_type:
            context_snippets.append(f"- Hedeflenen Puan Türü: {score_type}")

        if referenced_programs:
            context_snippets.append("### SİSTEMİN HESAPLADIĞI AÇIKLANABİLİR YAPAY ZEKA (XAI) VE MODEL VERİLERİ:")
            for p in referenced_programs:
                lr_str = f"{p['latest_rank']:,.0f}" if p.get("latest_rank") else "Bilinmiyor"
                pr_str = f"{p['predicted_rank']:,.0f}" if p.get("predicted_rank") else "Bilinmiyor"
                koridor_str = f"{p['interval_lower']:,.0f} – {p['interval_upper']:,.0f} (±%{p['margin_pct']})" if p.get("interval_lower") else "Mevcut Değil"
                dom_factor = p.get("dominant_factor_label", "Geçmiş Taban İstikrarı")
                xai_note = p.get("xai_explanation", "")

                context_snippets.append(
                    f"• [{p['program_code']}] {p['university_name']} - {p['program_name']} ({p['city']})\n"
                    f"  - 2025 Son Taban Sırası: {lr_str}\n"
                    f"  - LightGBM 2026 Model Tahmini: {pr_str}\n"
                    f"  - %80 Güvenli Tercih Koridoru: {koridor_str}\n"
                    f"  - TreeSHAP Belirleyici Karar Faktörü (XAI): {dom_factor}\n"
                    f"  - XAI Karar Özeti: {xai_note}\n"
                    f"  - Adayın Sıralamasına Göre Risk Konumu: {p['category_label']}"
                )

        rag_data_str = "\n".join(context_snippets) if context_snippets else "Öğrenci henüz özel profil belirtmedi."

        system_prompt = (
            "Sen üniversite adayları ve velileri için çalışan, **Açıklanabilir Yapay Zeka (Explainable AI - XAI)** "
            "ilkeleriyle hareket eden kıdemli, bilge, samimi ve son derece şeffaf bir YKS Tercih Rehber Öğretmenisin. "
            "Platformumuz Türkiye'deki 13.581 lisans programı, LightGBM regresyon modelleri, TreeSHAP karar analizleri, "
            "şehir yaşam maliyetleri ve 24'lük tercih listesi portföy dağıtım mantığı ile doğrudan entegredir.\n\n"
            "AÇIKLANABİLİR YAPAY ZEKA (XAI) KURALLARIN:\n"
            "1. ASLA KARA KUTU (BLACK BOX) GİBİ KONUŞMA: Sadece 'buraya yerleşirsin' veya 'sıralaması 40.000 olur' demek KESİNLİKLE YASAKTIR. "
            "Her tahminin ARKASINDAKİ NEDENLERİ şeffafça açıkla: Modelin 2026 tahminini, %80 güvenli tercih koridorunu ve TreeSHAP karar faktörlerini "
            "(Geçmiş yıl yerleşik taban sırasının ağırlığı, Kontenjan artış/azalışının yarattığı esneme/baskı ve Bölümün 3 yıllık talep ivmesi) "
            "öğrencinin anlayacağı sıcak, rehberlik odaklı bir dille metne dök.\n"
            "2. YKS SIRALAMA MATEMATİĞİ: Sıralamada sayı küçüldükçe başarının ve rekabetin ARTTIĞINI, sayı büyüdükçe "
            "sıralamanın gerilediğini ve kazanmanın kolaylaştığını unutma (Örn: 15.000, 35.000'den daha başarılıdır).\n"
            "3. 24 TERCİH STRATEJİSİ VE KORİDOR: Adayın başarı sırasını modelin %80 güvenli tercih koridoruyla karşılaştır. "
            "Programın adaya göre Üst Hedef (Risk), İdeal Hedef mi yoksa Güvenli Liman mı olduğunu belirt ve 24'lük listesinde nereye yazması gerektiğini söyle.\n"
            "4. BİÇİMLENDİRME: Cevabında net başlıklar kullan: 🎓 Rehberlik Değerlendirmesi, 🧠 LightGBM & XAI Karar Analizi (Neden Bu Tahmin?), 🎯 Tercih Stratejin.\n"
            "5. SOMUT VERİ KULLAN: Sistem verilerindeki gerçek üniversiteleri, kodları, 2025 ve 2026 tahmin sıralarını birebir kullan."
        )

        user_content = (
            f"[SİSTEM AÇIKLANABİLİR YAPAY ZEKA (XAI) VERİ BAĞLAMI]\n{rag_data_str}\n\n"
            f"[ÖĞRENCİ MESAJI]\n{message}"
        )

        # Build message history for OpenAI
        messages = [{"role": "system", "content": system_prompt}]
        for hist in conversation_history[-6:]:
            role = hist.get("role", "user")
            content = hist.get("content", "")
            if role in ["user", "assistant"] and content:
                messages.append({"role": role, "content": content})
        messages.append({"role": "user", "content": user_content})

        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key, timeout=15.0)
            completion = client.chat.completions.create(
                model=self.openai_model,
                messages=messages,
                temperature=0.4,
                max_tokens=950,
            )
            reply_text = completion.choices[0].message.content.strip()

            # Dynamic follow up suggestions
            suggestions = [
                "24 tercihi nasıl dağıtmalıyım?",
                "Bu programlarda kontenjan değişimi olursa ne olur?",
                "Öğrenci kenti olarak hangi şehirleri önerirsin?",
            ]
            if rank and score_type:
                suggestions = [
                    f"{score_type} {rank:,.0f} için en güvenli liman seçenekleri neler?",
                    "Ölü tercih riskini nasıl kontrol edebilirim?",
                    "Modelin karar faktörleri sıralamamı nasıl etkiledi?",
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
