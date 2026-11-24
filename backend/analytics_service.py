import re
import numpy as np
from typing import Dict, List, Any, Optional
from collections import defaultdict
from backend.data_loader import DataLoader

CITY_TO_REGION = {
    # Marmara
    "İstanbul": "Marmara", "Bursa": "Marmara", "Kocaeli": "Marmara", "Balıkesir": "Marmara",
    "Tekirdağ": "Marmara", "Çanakkale": "Marmara", "Sakarya": "Marmara", "Edirne": "Marmara",
    "Kırklareli": "Marmara", "Bilecik": "Marmara", "Yalova": "Marmara",
    # Ege
    "İzmir": "Ege", "Manisa": "Ege", "Aydın": "Ege", "Denizli": "Ege", "Muğla": "Ege",
    "Afyonkarahisar": "Ege", "Kütahya": "Ege", "Uşak": "Ege",
    # İç Anadolu
    "Ankara": "İç Anadolu", "Konya": "İç Anadolu", "Kayseri": "İç Anadolu", "Eskişehir": "İç Anadolu",
    "Sivas": "İç Anadolu", "Kırıkkale": "İç Anadolu", "Aksaray": "İç Anadolu", "Karaman": "İç Anadolu",
    "Kırşehir": "İç Anadolu", "Niğde": "İç Anadolu", "Nevşehir": "İç Anadolu", "Yozgat": "İç Anadolu",
    "Çankırı": "İç Anadolu",
    # Akdeniz
    "Antalya": "Akdeniz", "Adana": "Akdeniz", "Mersin": "Akdeniz", "Hatay": "Akdeniz",
    "Kahramanmaraş": "Akdeniz", "Isparta": "Akdeniz", "Osmaniye": "Akdeniz", "Burdur": "Akdeniz",
    # Karadeniz
    "Samsun": "Karadeniz", "Trabzon": "Karadeniz", "Ordu": "Karadeniz", "Tokat": "Karadeniz",
    "Zonguldak": "Karadeniz", "Çorum": "Karadeniz", "Giresun": "Karadeniz", "Kastamonu": "Karadeniz",
    "Rize": "Karadeniz", "Amasya": "Karadeniz", "Bolu": "Karadeniz", "Karabük": "Karadeniz",
    "Sinop": "Karadeniz", "Bartın": "Karadeniz", "Artvin": "Karadeniz", "Gümüşhane": "Karadeniz",
    "Bayburt": "Karadeniz", "Düzce": "Karadeniz",
    # Doğu Anadolu
    "Erzurum": "Doğu Anadolu", "Malatya": "Doğu Anadolu", "Van": "Doğu Anadolu", "Elazığ": "Doğu Anadolu",
    "Ağrı": "Doğu Anadolu", "Muş": "Doğu Anadolu", "Bitlis": "Doğu Anadolu", "Kars": "Doğu Anadolu",
    "Bingöl": "Doğu Anadolu", "Hakkari": "Doğu Anadolu", "Erzincan": "Doğu Anadolu", "Iğdır": "Doğu Anadolu",
    "Ardahan": "Doğu Anadolu", "Tunceli": "Doğu Anadolu",
    # Güneydoğu Anadolu
    "Gaziantep": "Güneydoğu Anadolu", "Şanlıurfa": "Güneydoğu Anadolu", "Diyarbakır": "Güneydoğu Anadolu",
    "Mardin": "Güneydoğu Anadolu", "Batman": "Güneydoğu Anadolu", "Adıyaman": "Güneydoğu Anadolu",
    "Şırnak": "Güneydoğu Anadolu", "Siirt": "Güneydoğu Anadolu", "Kilis": "Güneydoğu Anadolu",
    # KKTC
    "Lefkoşa": "KKTC", "Gazimağusa": "KKTC", "Girne": "KKTC", "Güzelyurt": "KKTC"
}

CITY_LIVING_COST = {
    # High cost (Tier 1 Metropolises & Tourism Hubs)
    "İstanbul": {"tier": "high", "label": "Metropol (En Yüksek)", "rent_score": 5, "dorm": "Kısıtlı", "desc": "Özel yurt ve kira maliyetleri ülke ortalamasının çok üzerindedir. Geniş kariyer ve staj imkanları sunar."},
    "Ankara": {"tier": "high", "label": "Başkent (Yüksek / Dengeli)", "rent_score": 4, "dorm": "Orta", "desc": "Geniş kampüs olanakları ve KYK yurt kapasitesi yüksektir, metropol yaşam standardına sahiptir."},
    "İzmir": {"tier": "high", "label": "Büyükşehir (Yüksek)", "rent_score": 4, "dorm": "Orta", "desc": "Sosyal ve kültürel açıdan zengin öğrenci şehri, sahil ilçelerinde kira maliyetleri yüksektir."},
    "Antalya": {"tier": "high", "label": "Turizm & Büyükşehir (Yüksek)", "rent_score": 4, "dorm": "Kısıtlı", "desc": "Turizm sezonuna bağlı olarak ev kiralama maliyetleri yüksektir."},
    "Muğla": {"tier": "high", "label": "Öğrenci Kenti (Yüksek)", "rent_score": 4, "dorm": "Kısıtlı", "desc": "Turistik lokasyonu sebebiyle barınma maliyetleri yüksektir."},

    # Medium cost (Tier 2 Industrial & Academic Hubs)
    "Eskişehir": {"tier": "medium", "label": "Klasik Öğrenci Kenti (Dengeli)", "rent_score": 3, "dorm": "Yüksek", "desc": "Türkiye'nin en popüler öğrenci şehri. Sosyal hayat dinamik, ulaşım kolay ve yaşam maliyeti dengelidir."},
    "Bursa": {"tier": "medium", "label": "Sanayi Kenti (Orta)", "rent_score": 3, "dorm": "Yüksek", "desc": "Sanayi ve staj olanakları güçlü, ulaşımı kolay gelişmiş metropol."},
    "Kocaeli": {"tier": "medium", "label": "Marmara Sanayi Havzası (Orta)", "rent_score": 3, "dorm": "Orta", "desc": "İstanbul'a yakınlığı ve sanayi işbirlikleriyle öne çıkar."},
    "Sakarya": {"tier": "medium", "label": "Gelişmiş Üniversite Kenti (Orta)", "rent_score": 3, "dorm": "Yüksek", "desc": "Geniş KYK kapasitesi ve kampüs olanakları dengelidir."},
    "Çanakkale": {"tier": "medium", "label": "Huzurlu Öğrenci Şehri (Dengeli)", "rent_score": 3, "dorm": "Orta", "desc": "Huzurlu, güvenli ve öğrenci dostu sahil kenti."},
    "Adana": {"tier": "medium", "label": "Bölgesel Merkez (Dengeli)", "rent_score": 3, "dorm": "Yüksek", "desc": "Geniş kampüsler ve uygun gıda/yaşam maliyeti sunar."},
    "Mersin": {"tier": "medium", "label": "Akdeniz Liman Kenti (Dengeli)", "rent_score": 3, "dorm": "Yüksek", "desc": "Geniş barınma olanakları ve ılıman iklim."},
    "Trabzon": {"tier": "medium", "label": "Karadeniz Merkezi (Orta)", "rent_score": 3, "dorm": "Yüksek", "desc": "Köklü teknik üniversite geleneği ve zengin yurt olanakları."},
    "Samsun": {"tier": "medium", "label": "Gelişmiş Karadeniz Kenti (Dengeli)", "rent_score": 3, "dorm": "Yüksek", "desc": "Geniş tramvay ağı ve sahil kampüsleri ile dengeli yaşam."},
    "Konya": {"tier": "medium", "label": "Büyükşehir (Ekonomik)", "rent_score": 2, "dorm": "Çok Yüksek", "desc": "Geniş yurt kapasitesi ve çok uygun yaşam maliyeti."},
    "Kayseri": {"tier": "medium", "label": "Sanayi Kenti (Ekonomik)", "rent_score": 2, "dorm": "Yüksek", "desc": "Modern altyapı ve uygun yaşam giderleri."},
    "Gaziantep": {"tier": "medium", "label": "Bölgesel Metropol (Dengeli)", "rent_score": 3, "dorm": "Yüksek", "desc": "Gastronomi ve sanayi merkezi, dinamik öğrenci yaşamı."},
    "Lefkoşa": {"tier": "medium", "label": "KKTC Üniversiteler Bölgesi (Orta)", "rent_score": 3, "dorm": "Orta", "desc": "Uluslararası öğrenci kültürü, ada yaşam koşulları."},
    "Girne": {"tier": "medium", "label": "KKTC Sahil Kenti (Orta/Yüksek)", "rent_score": 4, "dorm": "Kısıtlı", "desc": "Turizm ve liman kenti."},
}

SECTOR_KEYWORDS = {
    "Yapay Zeka & Veri": ["yapay zeka", "veri bilimi", "veri mühendisliği", "artificial intelligence"],
    "Yazılım & Bilişim": ["yazılım", "bilgisayar", "software", "computer engineering"],
    "Yönetim Bilişim (YBS)": ["yönetim bilişim", "bilişim sistemleri", "management information"],
    "Tıp & Sağlık": ["tıp", "diş hekimliği", "eczacılık", "beslenme ve diyetetik", "fizyoterapi"],
    "Hukuk & Adalet": ["hukuk"],
    "Havacılık & Uzay": ["havacılık", "uzay", "uçak", "pilotaj", "aerospace"],
    "Elektrik & Elektronik": ["elektrik", "elektronik", "electronic"],
    "Makine & Mekatronik": ["makine", "mekatronik", "mechanical"],
    "Mimarlık & Tasarım": ["mimarlık", "iç mimarlık", "şehir ve bölge", "endüstriyel tasarım"],
    "İnşaat Mühendisliği": ["inşaat mühendisliği", "civil engineering"],
    "Psikoloji & Sosyal": ["psikoloji", "sosyoloji", "sosyal hizmet"],
    "Eğitim & Öğretmenlik": ["öğretmenliği", "öğretmenlik", "rehberlik ve psikolojik danışmanlık"],
}


class AnalyticsService:
    def __init__(self, data_loader: DataLoader):
        self.data_loader = data_loader
        self._cached_city_summary = None
        self._cached_trends = None

    def get_city_analytics(self) -> Dict[str, Any]:
        """Aggregates program statistics, university counts, and living costs across all cities."""
        if self._cached_city_summary:
            return self._cached_city_summary

        cities_data = defaultdict(lambda: {
            "program_codes": [],
            "universities": set(),
            "uni_types": defaultdict(int),
            "score_types": defaultdict(int),
            "ranks_2025": [],
            "quotas_2025": [],
        })

        for p in self.data_loader.programs_by_code.values():
            city = p.get("city")
            if not city:
                continue

            city_clean = city.strip()
            c_dict = cities_data[city_clean]
            c_dict["program_codes"].append(p["program_code"])
            c_dict["universities"].add(p["university_name"])

            u_name_upper = p["university_name"].upper()
            if "VAKIF" in u_name_upper:
                c_dict["uni_types"]["Vakıf"] += 1
            else:
                c_dict["uni_types"]["Devlet"] += 1

            st = p.get("score_type", "OTHER")
            c_dict["score_types"][st] += 1

            # Get 2025 closing rank
            for h in p.get("history", []):
                if h.get("year") == 2025 and h.get("closing_rank") and h["closing_rank"] > 0:
                    c_dict["ranks_2025"].append(float(h["closing_rank"]))
                if h.get("year") == 2025 and h.get("published_quota") and h["published_quota"] > 0:
                    c_dict["quotas_2025"].append(int(h["published_quota"]))

        result_cities = []
        for city_name, data in cities_data.items():
            if not data["program_codes"]:
                continue

            ranks = data["ranks_2025"]
            quotas = data["quotas_2025"]

            region = CITY_TO_REGION.get(city_name, "Diğer")
            cost_info = CITY_LIVING_COST.get(city_name, {
                "tier": "low",
                "label": "Öğrenci Dostu & Ekonomik (Düşük)",
                "rent_score": 2,
                "dorm": "Çok Yüksek",
                "desc": "KYK yurt kapasitesi geniştir, ev kiralama ve günlük gıda/ulaşım maliyetleri oldukça uygundur."
            })

            # Clean university list with program count
            unis_summary = []
            uni_prog_counts = defaultdict(int)
            for p_code in data["program_codes"]:
                prog = self.data_loader.programs_by_code[p_code]
                uni_prog_counts[prog["university_name"]] += 1

            for u_name, count in sorted(uni_prog_counts.items(), key=lambda x: -x[1]):
                is_vakif = "VAKIF" in u_name.upper()
                unis_summary.append({
                    "name": u_name,
                    "type": "Vakıf" if is_vakif else "Devlet",
                    "program_count": count,
                })

            result_cities.append({
                "city_name": city_name,
                "region": region,
                "university_count": len(data["universities"]),
                "program_count": len(data["program_codes"]),
                "cost_tier": cost_info["tier"],
                "cost_label": cost_info["label"],
                "rent_index_score": cost_info["rent_score"],
                "dorm_availability": cost_info["dorm"],
                "living_cost_description": cost_info["desc"],
                "median_closing_rank": float(np.median(ranks)) if ranks else None,
                "min_closing_rank": float(min(ranks)) if ranks else None,
                "total_quota_2025": sum(quotas) if quotas else 0,
                "score_types_count": dict(data["score_types"]),
                "uni_types_count": dict(data["uni_types"]),
                "top_universities": unis_summary[:10],
            })

        # Sort by program count descending
        result_cities.sort(key=lambda x: -x["program_count"])

        # Region summaries
        regions_summary = defaultdict(lambda: {"city_count": 0, "program_count": 0, "university_count": 0})
        for c in result_cities:
            reg = c["region"]
            regions_summary[reg]["city_count"] += 1
            regions_summary[reg]["program_count"] += c["program_count"]
            regions_summary[reg]["university_count"] += c["university_count"]

        response = {
            "status": "success",
            "total_cities": len(result_cities),
            "cities": result_cities,
            "regions_summary": dict(regions_summary),
        }
        self._cached_city_summary = response
        return response

    def get_trend_analytics(self, score_type: str = "ALL", limit: int = 15) -> Dict[str, Any]:
        """
        Computes 3-year market dynamics (2023 vs 2025 closing rank shifts):
        - Top gainers (tightening competition, popular surging departments)
        - Top decliners (softening competition, opportunity safety departments)
        - Sector momentum summaries and live ticker headlines
        """
        cache_key = f"{score_type}_{limit}"
        if self._cached_trends and cache_key in self._cached_trends:
            return self._cached_trends[cache_key]

        valid_programs = []
        for p in self.data_loader.programs_by_code.values():
            if score_type and score_type.upper() != "ALL":
                if p.get("score_type") != score_type.upper():
                    continue

            hist_by_year = {h["year"]: h for h in p.get("history", [])}
            rec_23 = hist_by_year.get(2023)
            rec_24 = hist_by_year.get(2024)
            rec_25 = hist_by_year.get(2025)

            if not (rec_23 and rec_25):
                continue

            r23 = rec_23.get("closing_rank")
            r25 = rec_25.get("closing_rank")
            q25 = rec_25.get("published_quota") or 0

            # Filter valid ranks and minimum quota 3 to filter extreme single-person noise
            if r23 and r25 and r23 > 0 and r25 > 0 and q25 >= 3:
                # In YKS ranking, if rank number becomes smaller (e.g. 50k -> 30k),
                # demand has surged (tightening).
                # tightening_pct = (rank_2023 - rank_2025) / rank_2023 * 100
                tightening_pct = ((r23 - r25) / r23) * 100
                r24_val = rec_24.get("closing_rank") if rec_24 else None

                valid_programs.append({
                    "program_code": p["program_code"],
                    "university_name": p["university_name"],
                    "program_name": p["program_name"],
                    "score_type": p["score_type"],
                    "city": p.get("city", "Belirtilmemiş"),
                    "rank_2023": float(r23),
                    "rank_2024": float(r24_val) if r24_val else None,
                    "rank_2025": float(r25),
                    "quota_2025": int(q25),
                    "rank_difference": float(r23 - r25),
                    "change_pct": float(np.clip(tightening_pct, -95, 95)),
                })

        # 1. Top gainers (highest positive percentage surge)
        # Exclude lower tier programs > 1.5M to keep meaningful results
        gainers_pool = [p for p in valid_programs if p["change_pct"] > 0 and p["rank_2023"] <= 800000]
        gainers_sorted = sorted(gainers_pool, key=lambda x: -x["change_pct"])[:limit]

        # 2. Top decliners (most relaxed / opportunity programs)
        decliners_pool = [p for p in valid_programs if p["change_pct"] < 0]
        decliners_sorted = sorted(decliners_pool, key=lambda x: x["change_pct"])[:limit]

        # 3. Sector aggregation across all valid programs
        sector_results = []
        for sector_name, keywords in SECTOR_KEYWORDS.items():
            matched_items = []
            for p in valid_programs:
                p_name_lower = p["program_name"].lower()
                if any(kw in p_name_lower for kw in keywords):
                    matched_items.append(p)

            if len(matched_items) >= 5:
                avg_pct = float(np.mean([m["change_pct"] for m in matched_items]))
                median_25 = float(np.median([m["rank_2025"] for m in matched_items]))
                direction = "up" if avg_pct > 2.0 else ("down" if avg_pct < -2.0 else "neutral")
                
                sector_results.append({
                    "sector_name": sector_name,
                    "program_count": len(matched_items),
                    "average_change_pct": round(avg_pct, 1),
                    "direction": direction,
                    "median_rank_2025": round(median_25),
                    "trend_label": (
                        f"Talep Artışı (+%{abs(avg_pct):.1f})"
                        if direction == "up"
                        else (f"Taban Gevşemesi (-%{abs(avg_pct):.1f})" if direction == "down" else "Dengeli Seyir (±%0)")
                    ),
                })

        sector_results.sort(key=lambda x: -x["average_change_pct"])

        # 4. Live Market Ticker Headlines
        ticker_items = []
        for s in sector_results[:6]:
            icon = "🟢" if s["direction"] == "up" else ("🔴" if s["direction"] == "down" else "⚪")
            sign = "+" if s["average_change_pct"] > 0 else ""
            ticker_items.append(f"{icon} {s['sector_name']}: {sign}%{s['average_change_pct']:.1f}")

        for g in gainers_sorted[:4]:
            ticker_items.append(f"🔥 {g['program_name'][:24]} ({g['university_name'][:18]}): +%{g['change_pct']:.1f}")

        payload = {
            "status": "success",
            "score_type": score_type,
            "sample_size": len(valid_programs),
            "ticker_headlines": ticker_items,
            "top_gainers": gainers_sorted,
            "top_decliners": decliners_sorted,
            "sector_trends": sector_results,
        }

        if not self._cached_trends:
            self._cached_trends = {}
        self._cached_trends[cache_key] = payload
        return payload
