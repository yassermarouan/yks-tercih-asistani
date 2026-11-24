import os
import re
from typing import Dict, List, Optional, Any
from backend.data_loader import DataLoader, normalize_turkish

try:
    from dotenv import load_dotenv
    load_dotenv()
    if not os.environ.get("OPENAI_API_KEY") and os.path.exists(".env.example"):
        load_dotenv(".env.example")
except ImportError:
    pass


def parse_turkish_rank(rank_str: Any) -> Optional[int]:
    """Parse rank input, supporting Turkish dot thousand separators like 120.000 or 120000."""
    if rank_str is None:
        return None
    cleaned = str(rank_str).replace(".", "").replace(",", "").replace(" ", "").strip()
    try:
        val = int(cleaned)
        return val if val > 0 else None
    except ValueError:
        return None


class AdvisorService:
    def __init__(self, data_loader: DataLoader):
        self.data_loader = data_loader
        self.openai_model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
        self._init_metadata()

    def _init_metadata(self):
        # Extract unique program names and clean them for autocomplete
        prog_name_set = set()
        for p in self.data_loader.program_list:
            raw_name = p.get("program_name", "")
            # Clean parentheses if they are just language or scholarship for root name
            clean_name = re.sub(r"\s*\([^)]*\)", "", raw_name).strip()
            if clean_name:
                prog_name_set.add(clean_name)
        self.available_programs = sorted(list(prog_name_set))

        # Extract unique cities from catalog
        city_set = set()
        for p in self.data_loader.program_list:
            c = p.get("city")
            if c and str(c).strip() and str(c).lower() != "nan":
                city_set.add(str(c).strip())
        self.available_cities = sorted(list(city_set))

        # Latest year in dataset
        all_years = set()
        for p in self.data_loader.program_list:
            for h in p.get("history", []):
                all_years.add(h.get("year"))
        self.latest_year = max(all_years) if all_years else 2025

    def get_metadata(self) -> Dict[str, Any]:
        return {
            "score_types": [
                {"id": "SAY", "label": "Sayısal (SAY)"},
                {"id": "EA", "label": "Eşit Ağırlık (EA)"},
                {"id": "SÖZ", "label": "Sözel (SÖZ)"},
                {"id": "DİL", "label": "Dil (DİL)"},
            ],
            "popular_programs": self.available_programs,
            "cities": self.available_cities,
            "university_types": [
                {"id": "all", "label": "Fark Etmez (Tümü)"},
                {"id": "public", "label": "Devlet Üniversitesi"},
                {"id": "private", "label": "Vakıf Üniversitesi"},
            ],
            "teaching_languages": [
                {"id": "all", "label": "Fark Etmez (Tümü)"},
                {"id": "Turkish", "label": "Türkçe"},
                {"id": "English", "label": "İngilizce"},
                {"id": "other", "label": "Diğer Yabancı Diller"},
            ],
            "scholarships": [
                {"id": "all", "label": "Fark Etmez (Tümü)"},
                {"id": "free_or_full", "label": "Ücretsiz / %100 Burslu"},
                {"id": "discounted", "label": "%50 veya %25 İndirimli"},
                {"id": "paid", "label": "Ücretli"},
            ],
            "priorities": [
                {"id": "rank", "label": "Sıralama Uyumu (Hedefime en yakın bölümler)"},
                {"id": "location", "label": "Konum / Şehir Tercihi"},
                {"id": "language", "label": "Öğretim Dili"},
                {"id": "cost", "label": "Maliyet / Burs Durumu"},
            ],
            "latest_dataset_year": self.latest_year,
            "tuition_data_verified": False,
        }

    def recommend(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        score_type = str(payload.get("score_type", "SAY")).strip().upper()
        raw_rank = payload.get("rank")
        student_rank = parse_turkish_rank(raw_rank)

        if not student_rank:
            return {
                "status": "error",
                "message": "Geçerli bir YKS başarı sırası girmelisiniz (örneğin: 120.000 veya 120000).",
            }

        target_programs = payload.get("target_programs", [])
        if not target_programs:
            return {
                "status": "error",
                "message": "En az bir bölüm tercihi seçmelisiniz (örneğin: Bilgisayar Mühendisliği, Mimarlık).",
            }

        # Optional criteria & strictness
        preferred_cities = [str(c).strip() for c in payload.get("preferred_cities", []) if str(c).strip()]
        cities_strict = bool(payload.get("cities_strict", False))

        university_type = payload.get("university_type", "all")
        university_type_strict = bool(payload.get("university_type_strict", False))

        teaching_language = payload.get("teaching_language", "all")
        language_strict = bool(payload.get("language_strict", False))

        scholarship = payload.get("scholarship", "all")
        scholarship_strict = bool(payload.get("scholarship_strict", False))

        max_tuition = payload.get("max_tuition")
        tuition_strict = bool(payload.get("tuition_strict", False))

        priority = payload.get("priority", "rank")

        # Step 1: Base pool matching score type and target programs
        norm_target_progs = [normalize_turkish(tp) for tp in target_programs]
        base_pool = []
        for p in self.data_loader.program_list:
            if p["score_type"] != score_type:
                continue
            norm_pname = normalize_turkish(p["program_name"])
            # Match if any selected target program is contained in or equal to program name
            if any(ntp in norm_pname for ntp in norm_target_progs):
                base_pool.append(p)

        if not base_pool:
            return {
                "status": "no_matches",
                "message": f"'{score_type}' puan türünde seçtiğiniz bölümlere ({', '.join(target_programs)}) ait lisans programı bulunamadı.",
                "relaxation_suggestions": [],
                "items": [],
                "total_matched": 0,
            }

        # Step 2: Track eliminations for hard requirements ("Şart")
        eliminated_by_cities = []
        eliminated_by_uni_type = []
        eliminated_by_language = []
        eliminated_by_scholarship = []
        eliminated_by_tuition = []

        filtered_pool = []
        for p in base_pool:
            # Check cities
            if cities_strict and preferred_cities:
                p_city = p.get("city")
                if not p_city or p_city not in preferred_cities:
                    eliminated_by_cities.append(p)
                    continue

            # Check university type
            if university_type_strict and university_type != "all":
                # In universities.csv: 'public' or 'private'
                # In admissions_history: university_name often contains '(Devlet Üniversitesi)' or '(Vakıf Üniversitesi)'
                u_name = p.get("university_name", "")
                is_pub = "Devlet" in u_name
                is_priv = "Vakıf" in u_name
                if university_type == "public" and not is_pub:
                    eliminated_by_uni_type.append(p)
                    continue
                if university_type == "private" and not is_priv:
                    eliminated_by_uni_type.append(p)
                    continue

            # Check teaching language
            if language_strict and teaching_language != "all":
                p_lang = p.get("teaching_language")
                p_name = p.get("program_name", "")
                is_eng = (p_lang == "English") or ("İngilizce" in p_name)
                is_tur = (p_lang == "Turkish") or ("Türkçe" in p_name) or (p_lang is None and not is_eng)

                if teaching_language == "English" and not is_eng:
                    eliminated_by_language.append(p)
                    continue
                if teaching_language == "Turkish" and not is_tur:
                    eliminated_by_language.append(p)
                    continue

            # Check scholarship
            if scholarship_strict and scholarship != "all":
                p_schol = p.get("scholarship")
                u_name = p.get("university_name", "")
                p_name = p.get("program_name", "")
                is_state = "Devlet" in u_name
                is_free = is_state or (p_schol == "Burslu") or ("Burslu" in p_name) or ("Ücretsiz" in p_name)
                is_disc = (p_schol in ["%50 İndirimli", "%25 İndirimli"]) or ("%50" in p_name) or ("%25" in p_name)
                is_paid = (p_schol == "Ücretli") or ("Ücretli" in p_name)

                if scholarship == "free_or_full" and not is_free:
                    eliminated_by_scholarship.append(p)
                    continue
                if scholarship == "discounted" and not is_disc:
                    eliminated_by_scholarship.append(p)
                    continue
                if scholarship == "paid" and not is_paid:
                    eliminated_by_scholarship.append(p)
                    continue

            # Check tuition
            if tuition_strict and max_tuition is not None:
                # Verified annual tuition is unavailable in dataset
                # Since an unverified value cannot satisfy a hard requirement, all are eliminated
                eliminated_by_tuition.append(p)
                continue

            filtered_pool.append(p)

        # Step 3: If 0 matches, formulate relaxation suggestions
        if not filtered_pool:
            suggestions = []
            if tuition_strict and eliminated_by_tuition:
                suggestions.append({
                    "criteria_key": "tuition_strict",
                    "label": "Maksimum Yıllık Ücret Şartı",
                    "reason": "Veri setinde üniversitelerin güncel yıllık ücret bilgileri henüz doğrulanmadığı için bu şart sonuçları eledi.",
                    "action_text": "Ücret şartını kaldır veya tercihe dönüştür",
                    "eliminated_count": len(eliminated_by_tuition),
                })
            if cities_strict and eliminated_by_cities:
                suggestions.append({
                    "criteria_key": "cities_strict",
                    "label": f"Şehir Şartı ({', '.join(preferred_cities)})",
                    "reason": f"Seçtiğiniz {len(preferred_cities)} şehirde bu bölümler için kontenjan bulunamadı.",
                    "action_text": "Şehir filtresini 'Tercih' olarak esnet",
                    "eliminated_count": len(eliminated_by_cities),
                })
            if language_strict and eliminated_by_language:
                suggestions.append({
                    "criteria_key": "language_strict",
                    "label": f"Öğretim Dili Şartı ({teaching_language})",
                    "reason": f"Seçilen bölümlerde {teaching_language} eğitim veren program bulunamadı.",
                    "action_text": "Dil şartını kaldır veya esnet",
                    "eliminated_count": len(eliminated_by_language),
                })
            if university_type_strict and eliminated_by_uni_type:
                suggestions.append({
                    "criteria_key": "university_type_strict",
                    "label": "Üniversite Türü Şartı",
                    "reason": f"Yalnızca seçtiğiniz üniversite türünde arama yapıldığından program bulunamadı.",
                    "action_text": "Üniversite türü şartını kaldır",
                    "eliminated_count": len(eliminated_by_uni_type),
                })
            if scholarship_strict and eliminated_by_scholarship:
                suggestions.append({
                    "criteria_key": "scholarship_strict",
                    "label": "Burs Durumu Şartı",
                    "reason": "Seçtiğiniz burs/indirim kategorisinde program bulunamadı.",
                    "action_text": "Burs şartını esnet",
                    "eliminated_count": len(eliminated_by_scholarship),
                })

            return {
                "status": "no_matches",
                "message": "Belirttiğiniz 'Şart' kriterlerinin tümünü aynı anda sağlayan bir program bulunamadı.",
                "relaxation_suggestions": suggestions,
                "items": [],
                "total_matched": 0,
            }

        # Step 4: Scoring & Categorization for each matching program
        evaluated_items = []
        for p in filtered_pool:
            history = p.get("history", [])
            # Sort history descending by year
            sorted_hist = sorted(history, key=lambda x: x["year"], reverse=True)

            # Find latest year with non-null closing rank
            rec_with_rank = next((h for h in sorted_hist if h.get("closing_rank") and h["closing_rank"] > 0), None)
            latest_rec = sorted_hist[0] if sorted_hist else None

            benchmark_year = rec_with_rank["year"] if rec_with_rank else (latest_rec["year"] if latest_rec else 2025)
            benchmark_rank = rec_with_rank["closing_rank"] if rec_with_rank else None
            benchmark_quota = latest_rec.get("published_quota") if latest_rec else None

            # Categorization based on documented thresholds
            # Lower number = more competitive
            if benchmark_rank is None or benchmark_rank <= 0:
                category = "insufficient_data"
                category_label = "Veri Yetersiz"
                category_description = "Programın geçmiş yıllara ait taban sıralaması henüz oluşmamış veya açıklanmamıştır."
                rank_distance = None
            else:
                rank_distance = int(student_rank - benchmark_rank)
                # student_rank < benchmark_rank means student is ahead (e.g. 120k vs 150k -> distance -30k)
                if benchmark_rank < student_rank * 0.85:
                    category = "reach"
                    category_label = "Daha Rekabetçi"
                    category_description = "Geçmiş taban sırası senin sıralamandan belirgin ölçüde önde (%15'ten fazla). Tercih listende üst sıralara yazılabilir."
                elif student_rank * 0.85 <= benchmark_rank <= student_rank * 1.25:
                    category = "target"
                    category_label = "Sıralamana Yakın"
                    category_description = "Geçmiş taban sırası senin sıralamana çok yakın (%15-25 bandında). Tercih listesinin omurgasını oluşturmalıdır."
                else:
                    category = "safe"
                    category_label = "Geçmiş Verilere Göre Daha Ulaşılabilir"
                    category_description = "Geçmiş taban sırası senin sıralamandan geride. Tercih listende güvenli bir yerleşme sigortası görevi görebilir."

            # Compute Preference Fit Score (0 to 100)
            pref_score = 0
            trade_offs = []
            matches_notes = []

            # City match
            p_city = p.get("city")
            if preferred_cities:
                if p_city and p_city in preferred_cities:
                    pref_score += 35
                    matches_notes.append(f"Tercih ettiğin şehirlerden {p_city}'de yer alıyor.")
                else:
                    trade_offs.append(f"Tercih ettiğin şehirlerin ({', '.join(preferred_cities)}) dışında ({p_city or 'Şehir belirtilmemiş'}) yer alıyor.")
            else:
                pref_score += 25

            # Language match
            p_lang = p.get("teaching_language")
            p_name = p.get("program_name", "")
            is_eng = (p_lang == "English") or ("İngilizce" in p_name)
            if teaching_language == "English":
                if is_eng:
                    pref_score += 25
                    matches_notes.append("Eğitim dili İngilizce.")
                else:
                    trade_offs.append("Eğitim dili İngilizce değil (Türkçe).")
            elif teaching_language == "Turkish":
                if not is_eng:
                    pref_score += 25
                    matches_notes.append("Eğitim dili Türkçe.")
                else:
                    trade_offs.append("Eğitim dili İngilizce.")
            else:
                pref_score += 20

            # University type match
            u_name = p.get("university_name", "")
            is_pub = "Devlet" in u_name
            if university_type == "public":
                if is_pub:
                    pref_score += 25
                    matches_notes.append("Devlet üniversitesi.")
                else:
                    trade_offs.append("Vakıf üniversitesi.")
            elif university_type == "private":
                if not is_pub:
                    pref_score += 25
                    matches_notes.append("Vakıf üniversitesi.")
                else:
                    trade_offs.append("Devlet üniversitesi.")
            else:
                pref_score += 20

            # Scholarship match
            p_schol = p.get("scholarship")
            if p_schol:
                matches_notes.append(f"Burs durumu: {p_schol}")
            elif is_pub:
                matches_notes.append("Devlet üniversitesi (Ücretsiz)")

            # Tuition status note
            tuition_note = "Yıllık ücret bilgisi doğrulanmadı / belirtilmedi."

            # Compute Rank Fit Score (0 to 100)
            if benchmark_rank:
                # Proximity score peaks when program is within target range
                ratio = benchmark_rank / student_rank
                if 0.9 <= ratio <= 1.15:
                    rank_score = 100
                elif 0.8 <= ratio <= 1.3:
                    rank_score = 80
                elif 0.7 <= ratio <= 1.5:
                    rank_score = 60
                elif ratio < 0.7:
                    rank_score = 40
                else:
                    rank_score = 30
            else:
                rank_score = 40

            # Combine based on student priority
            if priority == "location":
                total_score = (pref_score * 0.6) + (rank_score * 0.4)
            elif priority == "language":
                total_score = (pref_score * 0.6) + (rank_score * 0.4)
            elif priority == "cost":
                total_score = (pref_score * 0.6) + (rank_score * 0.4)
            else:  # 'rank'
                total_score = (rank_score * 0.6) + (pref_score * 0.4)

            # Generate natural Turkish explanation
            explanation = self._build_natural_explanation(
                p=p,
                student_rank=student_rank,
                benchmark_year=benchmark_year,
                benchmark_rank=benchmark_rank,
                matches_notes=matches_notes,
                trade_offs=trade_offs,
                tuition_note=tuition_note,
            )

            if category == "reach":
                strategic_tier = "1 – 6. Sıralar (Üst Tercih)"
            elif category == "target":
                strategic_tier = "7 – 18. Sıralar (Ana Tercih)"
            elif category == "safe":
                strategic_tier = "19 – 24. Sıralar (Güvence)"
            else:
                strategic_tier = "Değerlendirme Bekliyor"

            evaluated_items.append({
                "program_code": p["program_code"],
                "university_name": p["university_name"],
                "program_name": p["program_name"],
                "score_type": p["score_type"],
                "city": p.get("city"),
                "faculty": p.get("faculty"),
                "teaching_language": p.get("teaching_language") or ("İngilizce" if "İngilizce" in p["program_name"] else "Türkçe"),
                "scholarship": p.get("scholarship") or ("Devlet / Ücretsiz" if is_pub else "Belirtilmemiş"),
                "education_type": p.get("education_type") or "Örgün Öğretim",
                "official_url": p.get("official_url"),
                "latest_quota": benchmark_quota,
                "latest_rank": benchmark_rank,
                "latest_rank_year": benchmark_year,
                "history": p.get("history", []),
                "rank_distance": rank_distance,
                "category": category,
                "category_label": category_label,
                "category_description": category_description,
                "strategic_tier": strategic_tier,
                "preference_fit_score": round(pref_score, 1),
                "rank_fit_score": round(rank_score, 1),
                "total_score": round(total_score, 1),
                "matches_notes": matches_notes,
                "trade_offs": trade_offs,
                "explanation": explanation,
            })

        # Step 5: Stable deterministic ordering
        evaluated_items.sort(
            key=lambda x: (
                -x["total_score"],
                abs(x["rank_distance"]) if x["rank_distance"] is not None else 9999999,
                x["latest_rank"] if x["latest_rank"] is not None else 9999999,
                x["program_code"],
            )
        )

        return {
            "status": "success",
            "total_matched": len(evaluated_items),
            "student_rank": student_rank,
            "score_type": score_type,
            "target_programs": target_programs,
            "priority": priority,
            "items": evaluated_items[:60],  # Shortlist of top recommendations
        }

    def _build_natural_explanation(
        self,
        p: Dict[str, Any],
        student_rank: int,
        benchmark_year: int,
        benchmark_rank: Optional[float],
        matches_notes: List[str],
        trade_offs: List[str],
        tuition_note: str,
    ) -> str:
        parts = []

        # Part 1: Fit and location/language
        p_name = p.get("program_name", "")
        lang_str = "İngilizce" if ("İngilizce" in p_name or p.get("teaching_language") == "English") else "Türkçe"
        city_str = p.get("city")

        if city_str:
            parts.append(f"Bu program {lang_str} eğitim vermekte ve {city_str} şehrinde yer almaktadır.")
        else:
            parts.append(f"Bu program {lang_str} eğitim vermektedir.")

        # Part 2: Rank comparison with exact numbers
        if benchmark_rank:
            formatted_bench = f"{int(benchmark_rank):,}".replace(",", ".")
            formatted_student = f"{student_rank:,}".replace(",", ".")
            diff = abs(int(student_rank - benchmark_rank))
            formatted_diff = f"{diff:,}".replace(",", ".")

            if student_rank < benchmark_rank:
                parts.append(
                    f"{benchmark_year} yılında {formatted_bench} taban başarı sırası ile kapandı. "
                    f"{formatted_student} olan başarı sıran, o yılın taban sırasından {formatted_diff} sıra daha önde."
                )
            elif student_rank > benchmark_rank:
                parts.append(
                    f"{benchmark_year} yılında {formatted_bench} taban başarı sırası ile kapandı. "
                    f"{formatted_student} olan başarı sıran, o yılın taban sırasının {formatted_diff} sıra gerisinde."
                )
            else:
                parts.append(
                    f"{benchmark_year} yılında {formatted_bench} taban sırası ile kapandı; başarı sıran ile birebir örtüşüyor."
                )
        else:
            parts.append(f"{benchmark_year} yılı için geçmiş taban başarı sırası bilgisi henüz bulunmuyor.")

        # Part 3: Trade-off if any
        if trade_offs:
            parts.append(f"Önemli not: {trade_offs[0]}")

        # Part 4: Tuition note
        parts.append(tuition_note)

        return " ".join(parts)
