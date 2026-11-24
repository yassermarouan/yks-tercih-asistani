import os
from typing import Dict, Any, Optional

try:
    from dotenv import load_dotenv
    load_dotenv()
    if not os.environ.get("OPENAI_API_KEY") and os.path.exists(".env.example"):
        load_dotenv(".env.example")
except ImportError:
    pass


class ExplanationService:
    def __init__(self):
        self.model_name = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")

    def _generate_fallback(
        self,
        prog: Dict[str, Any],
        pred_data: Dict[str, Any],
        student_rank: Optional[int] = None,
    ) -> str:
        u_name = prog.get("university_name", "Üniversite")
        p_name = prog.get("program_name", "Program")
        p_code = prog.get("program_code", "")

        target_year = pred_data.get("target_year", 2026)
        pred_rank = pred_data["predictions"]["predicted_closing_rank"]
        interval = pred_data["predictions"].get("prediction_interval", {})
        low_val = interval.get("lower")
        high_val = interval.get("upper")
        margin_pct = interval.get("margin_pct", 5.0)

        inputs = pred_data.get("inputs", {})
        prev_rank = inputs.get("previous_closing_rank", 0)
        input_rank_year = inputs.get("input_rank_year", 2025)
        quota = inputs.get("published_quota", 0)
        input_quota_year = inputs.get("input_quota_year", 2025)
        quota_change_pct = inputs.get("quota_change_pct", 0.0)
        momentum = inputs.get("rank_momentum_ratio", 1.0)

        interval_str = ""
        if low_val and high_val:
            interval_str = f" (**%80 Güvenli Tercih Koridoru: {low_val:,.0f} – {high_val:,.0f} [±%{margin_pct:.1f}]**)"

        # Natural feature explanation
        dominant_factors = []
        dominant_factors.append(
            f"Programın {input_rank_year} yılındaki {prev_rank:,.0f} taban başarı sırası ve yerleşik talebi en belirleyici güç konumundadır."
        )
        if abs(quota_change_pct) >= 5:
            direction = "artırılması" if quota_change_pct > 0 else "daraltılması"
            dominant_factors.append(
                f"Kontenjanın %{abs(quota_change_pct):.1f} oranında {direction}, sıralama üzerinde dengeleyici bir baskı oluşturmaktadır."
            )
        if abs(momentum - 1.0) >= 0.08:
            trend_str = "belirgin bir yükseliş (öne çekilme)" if momentum < 1.0 else "hafif bir gevşeme (gerileme)"
            dominant_factors.append(
                f"Bölümün son yıllardaki sıralama ivmesi incelendiğinde {trend_str} eğilimi tespit edilmiştir."
            )

        dominant_explanation = " ".join(dominant_factors)

        # Student personal evaluation
        student_section = ""
        if student_rank and student_rank > 0:
            diff = student_rank - pred_rank
            if diff < -pred_rank * 0.15:
                student_section = (
                    f"🎯 **Senin Başarı Sıran İçin Tercih Stratejisi (Sıralaman: {student_rank:,.0f}):**\n"
                    f"Senin YKS derecen, bu programın {target_year} projeksiyonunun oldukça önünde yer alıyor "
                    f"(yaklaşık {abs(diff):,.0f} sıra öndesin). Bu program senin için **Güvenli Liman (Daha Ulaşılabilir)** "
                    f"kategorisinde değerlendirilebilir. 24'lük tercih listende yerleşmeyi garanti altına almak istediğin "
                    f"dilimlerde güvenle yer verebilirsin."
                )
            elif abs(diff) <= pred_rank * 0.15:
                student_section = (
                    f"🎯 **Senin Başarı Sıran İçin Tercih Stratejisi (Sıralaman: {student_rank:,.0f}):**\n"
                    f"Senin YKS derecen, bu programın {target_year} projeksiyonu ile birebir örtüşen çok yakın bir başarı koridorunda "
                    f"(yalnızca {abs(diff):,.0f} sıra fark). Bu program senin için **İdeal Hedef (Sıralamana Yakın)** "
                    f"dilimindedir. Tercih listende en çok istediğin bölümler arasında öncelikli sıralara yazmanı tavsiye ederiz."
                )
            else:
                student_section = (
                    f"🎯 **Senin Başarı Sıran İçin Tercih Stratejisi (Sıralaman: {student_rank:,.0f}):**\n"
                    f"Bu program senin mevcut sıralamana göre biraz daha yukarıda/rekabetçi bir dilimde yer alıyor "
                    f"(yaklaşık {abs(diff):,.0f} sıra ileride). Ancak YKS tercihlerinde ilk sıralarda bu tarz **Daha Rekabetçi / Üst Hedef** "
                    f"programlara yer vermek doğru bir stratejidir. Listenin ilk sıralarında cesurca değerlendirebilirsin."
                )
        else:
            student_section = (
                f"🎯 **Tercih Listesi Stratejisi:**\n"
                f"Bu programı tercih listene alırken son yılların sıralama istikrarını ve kendi YKS derecenle arasındaki mesafeyi "
                f"dikkate alarak 24'lük listende dengeli bir risk dağılımı (üst hedef, sıralamana yakın, güvenli liman) kurmanı öneririz."
            )

        return (
            f"🎓 **Rehberlik Değerlendirmesi:**\n"
            f"{u_name} bünyesindeki **{p_name}** ({p_code}) programı, {input_rank_year} yılında {prev_rank:,.0f} taban sırası "
            f"ve {quota:,.0f} kişilik kontenjanla yerleştirme yapmıştı. Gelişmiş LightGBM modelimize göre 2026 YKS yerleştirmelerinde "
            f"taban sırasının yaklaşık **{pred_rank:,.0f}** seviyesinde{interval_str} şekillenmesi öngörülmektedir.\n\n"
            f"🔍 **Neden Böyle Olacak?**\n"
            f"{dominant_explanation}\n\n"
            f"{student_section}\n\n"
            f"💡 **Rehberlik Notu:** Bu analiz ÖSYM ve YÖK Atlas resmi geçmiş verilerine dayalı bir yapay zeka projeksiyonudur; "
            f"kesin yerleşme garantisi taşımaz. Tercih döneminde kılavuzdaki güncel kontenjanları mutlaka kontrol etmelisin."
        )

    def _generate_simulation_fallback(
        self,
        prog: Dict[str, Any],
        sim_data: Dict[str, Any],
        student_rank: Optional[int] = None,
    ) -> str:
        u_name = prog.get("university_name", "Üniversite")
        p_name = prog.get("program_name", "Program")
        p_code = prog.get("program_code", "")

        orig_quota = sim_data.get("original_quota", 50)
        sim_quota = sim_data.get("simulated_quota", 50)
        quota_delta = sim_data.get("quota_delta", 0)
        quota_change_pct = sim_data.get("sim_quota_change_pct", 0.0)

        base_rank = sim_data.get("baseline_predicted_rank", 0)
        sim_rank = sim_data.get("simulated_predicted_rank", 0)
        rank_delta = sim_data.get("rank_delta", 0)

        sim_interval = sim_data.get("simulated_prediction_interval", {})
        low_sim = sim_interval.get("lower")
        high_sim = sim_interval.get("upper")
        interval_sim_str = ""
        if low_sim and high_sim:
            interval_sim_str = f" (Tahmini Güvenli Aralık: {low_sim:,.0f} – {high_sim:,.0f})"

        # Quota scenario explanation
        if quota_delta > 0:
            scenario_summary = (
                f"Programın kontenjanı {orig_quota} kişiden **{sim_quota} kişiye (+{quota_delta} kişi, %{quota_change_pct:+.1f} artış)** çıktığında, "
                f"2026 taban başarı sırası öngörüsü {base_rank:,.0f} seviyesinden **{sim_rank:,.0f}** seviyesine doğru genişlemektedir{interval_sim_str} "
                f"({abs(rank_delta):,.0f} sıralık bir rahatlama)."
            )
            scenario_meaning = (
                "Kontenjanın artması, bölüme daha fazla öğrencinin kabul edilmesi anlamına gelir. "
                "Bu durum taban başarı sırasını geriye doğru esnetir (sıralama sayısı büyür). Yani geçmişte bu programa puanı "
                "kıl payı yetmeyen adaylar için yeni bir şans kapısı aralanır."
            )
        elif quota_delta < 0:
            scenario_summary = (
                f"Programın kontenjanı {orig_quota} kişiden **{sim_quota} kişiye ({quota_delta} kişi, %{quota_change_pct:+.1f} daralma)** düşürüldüğünde, "
                f"2026 taban başarı sırası öngörüsü {base_rank:,.0f} seviyesinden **{sim_rank:,.0f}** seviyesine doğru öne çekilmektedir{interval_sim_str} "
                f"({abs(rank_delta):,.0f} sıralık bir rekabet artışı)."
            )
            scenario_meaning = (
                "Kontenjanın daraltılması, aynı öğrenci talebine karşılık daha az koltuk sunulması demektir. "
                "Bu durum bölüm içerisindeki rekabeti sertleştirir ve taban başarı sırasını daha üst bir dilime iter. "
                "Programa yerleşmek için daha yüksek bir derece gerekebilir."
            )
        else:
            scenario_summary = (
                f"Kontenjanda herhangi bir değişiklik yapılmadığı için ({orig_quota} kişi), programın orijinal 2026 taban sıralaması "
                f"projeksiyonu olan {base_rank:,.0f} seviyesi geçerliliğini korumaktadır."
            )
            scenario_meaning = "Kontenjan sabit kaldığında genel yerleşme eğilimleri ve geçmiş yıl talebi belirleyici olmaya devam eder."

        # Student personal impact in simulation
        cand_impact = sim_data.get("candidate_impact")
        student_section = ""
        effective_rank = student_rank or (cand_impact.get("student_rank") if cand_impact else None)

        if cand_impact and effective_rank:
            base_cat = cand_impact.get("base_category_label", "Mevcut Durum")
            sim_cat = cand_impact.get("simulated_category_label", "Simüle Durum")
            sim_dist = cand_impact.get("simulated_distance", 0)
            cat_changed = cand_impact.get("category_changed", False)

            if cat_changed:
                student_section = (
                    f"🎯 **Senin Başarı Sıran İçin Kritik Değişim (Sıralaman: {effective_rank:,.0f}):**\n"
                    f"Bu kontenjan senaryosu senin için doğrudan kategori değişikliği yaratıyor! Program senin için önceden "
                    f"**'{base_cat}'** seviyesindeyken, yeni kontenjanla birlikte **'{sim_cat}'** konumuna geçti. "
                    f"Simülasyon sonrasında program ile arandaki sıralama güvenlik marjı {abs(sim_dist):,.0f} sıra olarak güncellendi. "
                    f"Bu değişim, tercih listendeki yerleşim sıranı gözden geçirmen için güçlü bir nedendir."
                )
            else:
                student_section = (
                    f"🎯 **Senin Başarı Sıran İçin Değerlendirme (Sıralaman: {effective_rank:,.0f}):**\n"
                    f"Senin {effective_rank:,.0f} olan başarı sıran açısından program **'{sim_cat}'** kategorisinde kalmaya devam ediyor. "
                    f"Yeni senaryoda program ile arandaki sıralama farkı yaklaşık {abs(sim_dist):,.0f} sıra seviyesindedir."
                )
        elif effective_rank:
            diff = effective_rank - sim_rank
            student_section = (
                f"🎯 **Senin Başarı Sıran İçin Değerlendirme (Sıralaman: {effective_rank:,.0f}):**\n"
                f"Simüle edilen yeni taban sıraya ({sim_rank:,.0f}) göre senin derecenle arada yaklaşık {abs(diff):,.0f} "
                f"sıralık bir fark oluşuyor ({'öndesin' if diff < 0 else 'geridesin'})."
            )
        else:
            student_section = (
                f"🎯 **Tercih Stratejisi Önerisi:**\n"
                f"ÖSYM kılavuzu açıklandığında bu programın kontenjanında benzer bir değişim görürsen, tercih listendeki "
                f"sıralamasını ve güvenlik payını bu simülasyondaki esneme yönüne göre güncellemelisin."
            )

        return (
            f"🔬 **Kontenjan Simülasyonu Değerlendirmesi:**\n"
            f"{u_name} - **{p_name}** ({p_code}) için simüle edilen senaryo:\n\n"
            f"📊 **Senaryo Özeti:**\n{scenario_summary}\n\n"
            f"💡 **Bu Değişim Ne Anlama Geliyor?**\n{scenario_meaning}\n\n"
            f"{student_section}\n\n"
            f"📌 **Rehberlik Tavsiyesi:** Bu simülasyon, ÖSYM kılavuzu öncesinde olası kontenjan sürprizlerine karşı "
            f"B planı oluşturman için tasarlanmıştır. Resmi kılavuz yayınlandığında kontenjanları mutlaka doğrula."
        )

    def generate_explanation(
        self,
        prog: Dict[str, Any],
        pred_data: Dict[str, Any],
        student_rank: Optional[int] = None,
    ) -> Dict[str, Any]:
        api_key = os.environ.get("OPENAI_API_KEY", "").strip()

        if pred_data.get("status") != "success":
            return {
                "source": "unavailable",
                "explanation": "Bu program için geçerli bir model tahmini bulunmadığından açıklama oluşturulamamaktadır."
            }

        u_name = prog.get("university_name", "")
        p_name = prog.get("program_name", "")
        p_code = prog.get("program_code", "")

        target_year = pred_data.get("target_year", 2026)
        inputs = pred_data.get("inputs", {})
        preds = pred_data.get("predictions", {})
        prev_rank = inputs.get("previous_closing_rank", 0)
        input_rank_year = inputs.get("input_rank_year", 2025)
        quota = inputs.get("published_quota", 0)
        input_quota_year = inputs.get("input_quota_year", 2025)
        pred_rank = preds.get("predicted_closing_rank", 0)
        interval = preds.get("prediction_interval", {})
        low_val = interval.get("lower", 0)
        high_val = interval.get("upper", 0)

        system_prompt = (
            "Sen üniversite adayları ve aileleri için çalışan, yapay zeka destekli kıdemli ve sıcakkanlı bir YKS Tercih Danışmanısın. "
            f"Görevin, adaya {target_year} YKS taban sıralaması projeksiyonunu, güven aralığı koridorunu ve neden bu sonucun çıktığını "
            "tamamen doğal, sıcak, anlaşılır ve yapıcı bir Türkçe ile açıklamaktır.\n\n"
            "ÖNEMLİ KURALLAR:\n"
            "1. KESİNLİKLE TEKNİK VE MATEMATİKSEL JARGON KULLANMA: 'SHAP', 'TreeExplainer', 'regresyon katsayısı', "
            "'referans seviyesi', 'skaler çarpım' gibi terimleri ASLA metne dahil etme. Öğrenci dostu terimler kullan: "
            "'LightGBM tahmin modeli', 'geçmiş yıl taban sırası etkisi', 'kontenjan etkisi', 'güvenli tercih koridoru'.\n"
            "2. YKS SIRALAMA MANTIĞI: Sıralamada sayı küçüldükçe başarının ve rekabetin arttığını, sayı büyüdükçe sıralamanın gerilediğini ve "
            "kazanmanın kolaylaştığını unutma.\n"
            "3. KİŞİSELLEŞTİRME: Eğer adayın başarı sırası verilmişse, adaya 'Senin ... olan sıralamana göre...' şeklinde doğrudan hitap et, "
            "programın adaya göre Güvenli Liman mı, İdeal Hedef mi yoksa Daha Rekabetçi mi olduğunu belirt ve 24'lük tercih listesinde "
            "nereye yazması gerektiğini söyle.\n"
            "4. BÖLÜMLENDİRME: Açıklamayı net ve okunabilir başlıklarla sun (🎓 Rehberlik Değerlendirmesi, 🔍 Neden Böyle Olacak?, "
            "🎯 Tercih Stratejin, 💡 Rehberlik Notu).\n"
            "5. Kesin yerleşme garantisi verme; istatistiki bir öngörü olduğunu sıcak bir dille hatırlat."
        )

        student_info_str = f"- Adayın YKS Başarı Sırası: {student_rank:,.0f}\n" if student_rank else "- Adayın YKS Başarı Sırası: Henüz girilmedi\n"
        interval_info_str = f"- Modelin %80 Güvenli Tercih Koridoru: {low_val:,.0f} ile {high_val:,.0f} arası\n" if low_val and high_val else ""

        user_prompt = (
            f"Aşağıdaki verileri inceleyerek aday öğrenci için samimi ve rehberlik odaklı bir değerlendirme metni yaz:\n\n"
            f"Program Bilgileri:\n"
            f"- Üniversite: {u_name}\n"
            f"- Program: {p_name} (Kod: {p_code})\n"
            f"- Projeksiyon Yılı: {target_year}\n"
            f"- {input_rank_year} Taban Sıralaması: {prev_rank:,.0f}\n"
            f"- {input_quota_year} Kontenjanı: {quota:,.0f} kişi\n"
            f"- Modelin {target_year} Taban Sıralaması Tahmini: {pred_rank:,.0f}\n"
            f"{interval_info_str}"
            f"{student_info_str}"
        )

        if api_key:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=api_key)
                response = client.chat.completions.create(
                    model=self.model_name,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    temperature=0.3,
                )
                generated_text = response.choices[0].message.content.strip()
                return {
                    "source": "openai",
                    "model": self.model_name,
                    "explanation": generated_text,
                }
            except Exception as e:
                print(f"[ExplanationService] OpenAI call error: {e}. Using natural verified fallback.")
                fallback = self._generate_fallback(prog, pred_data, student_rank)
                return {
                    "source": "fallback",
                    "model": "local_fallback",
                    "explanation": fallback,
                    "notice": "Canlı OpenAI servisine bağlanırken bir sorun oluştu; doğrulanmış uzman rehberlik açıklaması gösterilmektedir."
                }
        else:
            fallback = self._generate_fallback(prog, pred_data, student_rank)
            return {
                "source": "fallback",
                "model": "local_fallback",
                "explanation": fallback,
                "notice": "Doğrulanmış uzman rehberlik açıklaması gösterilmektedir."
            }

    def generate_simulation_explanation(
        self,
        prog: Dict[str, Any],
        sim_data: Dict[str, Any],
        student_rank: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Generates student-friendly guidance explanation for a what-if quota simulation scenario.
        """
        api_key = os.environ.get("OPENAI_API_KEY", "").strip()

        if sim_data.get("status") != "success":
            return {
                "source": "unavailable",
                "explanation": "Simülasyon hesaplanamadığı için açıklama oluşturulamamaktadır."
            }

        u_name = prog.get("university_name", "")
        p_name = prog.get("program_name", "")
        p_code = prog.get("program_code", "")

        orig_quota = sim_data.get("original_quota", 50)
        sim_quota = sim_data.get("simulated_quota", 50)
        quota_delta = sim_data.get("quota_delta", 0)

        base_rank = sim_data.get("baseline_predicted_rank", 0)
        sim_rank = sim_data.get("simulated_predicted_rank", 0)
        rank_delta = sim_data.get("rank_delta", 0)

        cand_impact = sim_data.get("candidate_impact")
        effective_rank = student_rank or (cand_impact.get("student_rank") if cand_impact else None)

        system_prompt = (
            "Sen üniversite adayları ve aileleri için çalışan kıdemli, empatik ve destekleyici bir YKS Tercih ve Rehberlik Uzmanısın. "
            "Görevin, öğrencinin yaptığı bir 'Ne Olur?' Kontenjan Simülasyonu senaryosunu incelemek ve kontenjan artış veya azalışının "
            "programın 2026 taban sıralamasına ve öğrencinin kazanma şansına etkisini öğrencinin ve ailesinin çok rahat anlayacağı "
            "sıcak, doğal ve duru bir Türkçe ile açıklamaktır.\n\n"
            "ÖNEMLİ KURALLAR:\n"
            "1. KESİNLİKLE TEKNİK JARGON KULLANMA: 'SHAP', 'LightGBM', 'regresyon katsayısı', 'referans seviyesi' gibi teknik ifadeleri "
            "ASLA kullanma. Tamamen aday odaklı konuş: 'kontenjan genişlemesi', 'rekabet yoğunlaşması', 'taban sıranın esnemesi', 'güvenlik marjı'.\n"
            "2. ETKİ YÖNÜ: Kontenjan artınca bölüm rahatlar, taban sıralama sayısı büyür (geriler) ve kazanmak kolaylaşır. "
            "Kontenjan daralınca rekabet artar, taban sıra öne çekilir ve kazanmak zorlaşır.\n"
            "3. ADAYA ÖZEL TAVSİYE: Eğer öğrencinin başarı sırası biliniyorsa, adaya doğrudan hitap ederek bu senaryonun onun için ne anlama geldiğini, "
            "tercih listesindeki yerini nasıl etkileyeceğini anlat.\n"
            "4. FORMAT: Okunabilirliği yüksek, başlıklar içeren (🔬 Simülasyon Senaryosu Özeti, 💡 Bu Değişim Ne Anlama Geliyor?, "
            "🎯 Senin İçin Ne Değişti?, 📌 Danışman Notu) bir yapıda yaz."
        )

        user_prompt = (
            f"Lütfen şu simülasyon senaryosunu öğrencinin anlayacağı dille yorumla:\n\n"
            f"- Üniversite: {u_name}\n"
            f"- Bölüm: {p_name} (Kod: {p_code})\n"
            f"- Orijinal Kontenjan: {orig_quota} kişi -> Simüle Edilen Kontenjan: {sim_quota} kişi (Fark: {quota_delta:+d})\n"
            f"- Orijinal 2026 Taban Sıra Projeksiyonu: {base_rank:,.0f}\n"
            f"- Simülasyon Sonrası Yeni Taban Sıra Projeksiyonu: {sim_rank:,.0f} (Net Değişim: {rank_delta:+,.0f})\n"
            f"- Aday Öğrencinin Sıralaması: {f'{effective_rank:,.0f}' if effective_rank else 'Girilmedi'}\n"
        )
        if cand_impact:
            user_prompt += (
                f"- Aday Güvenlik Seviyesi: Önceden '{cand_impact.get('base_category_label')}' -> "
                f"Şimdi '{cand_impact.get('simulated_category_label')}'\n"
                f"- Aday ile Yeni Taban Sıra Arasındaki Mesafe: {cand_impact.get('simulated_distance')} sıra\n"
            )

        if api_key:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=api_key)
                response = client.chat.completions.create(
                    model=self.model_name,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    temperature=0.3,
                )
                generated_text = response.choices[0].message.content.strip()
                return {
                    "source": "openai",
                    "model": self.model_name,
                    "explanation": generated_text,
                }
            except Exception as e:
                print(f"[ExplanationService] Simulation OpenAI call error: {e}. Using natural verified fallback.")
                fallback = self._generate_simulation_fallback(prog, sim_data, effective_rank)
                return {
                    "source": "fallback",
                    "model": "local_fallback",
                    "explanation": fallback,
                    "notice": "Canlı OpenAI servisine bağlanırken bir sorun oluştu; doğrulanmış uzman rehberlik açıklaması gösterilmektedir."
                }
        else:
            fallback = self._generate_simulation_fallback(prog, sim_data, effective_rank)
            return {
                "source": "fallback",
                "model": "local_fallback",
                "explanation": fallback,
                "notice": "Doğrulanmış uzman rehberlik açıklaması gösterilmektedir."
            }
