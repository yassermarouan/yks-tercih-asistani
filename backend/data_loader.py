import os
import sys
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any

# Ensure UTF-8 output on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def normalize_turkish(text: str) -> str:
    """Normalize text for resilient case-insensitive Turkish search."""
    if not text:
        return ""
    mapping = {
        "İ": "i", "I": "ı", "ı": "i",
        "ş": "s", "Ş": "s",
        "ğ": "g", "Ğ": "g",
        "ç": "c", "Ç": "c",
        "ö": "o", "Ö": "o",
        "ü": "u", "Ü": "u",
    }
    return "".join(mapping.get(c, c.lower()) for c in str(text))
TURKISH_CITIES_SET = {
    "ADANA", "ADIYAMAN", "AFYONKARAHİSAR", "AĞRI", "AMASYA", "ANKARA", "ANTALYA", "ARTVİN", "AYDIN",
    "BALIKESİR", "BİLECİK", "BİNGÖL", "BİTLİS", "BOLU", "BURDUR", "BURSA", "ÇANAKKALE", "ÇANKIRI",
    "ÇORUM", "DENİZLİ", "DİYARBAKIR", "EDİRNE", "ELAZIĞ", "ERZİNCAN", "ERZURUM", "ESKİŞEHİR", "GAZİANTEP",
    "GİRESUN", "GÜMÜŞHANE", "HAKKARİ", "HATAY", "ISPARTA", "MERSİN", "İSTANBUL", "İZMİR", "KARS",
    "KASTAMONU", "KAYSERİ", "KIRKLARELİ", "KIRŞEHİR", "KOCAELİ", "KONYA", "KÜTAHYA", "MALATYA", "MANİSA",
    "KAHRAMANMARAŞ", "MARDİN", "MUĞLA", "MUŞ", "NEVŞEHİR", "NİĞDE", "ORDU", "RİZE", "SAKARYA",
    "SAMSUN", "SİİRT", "SİNOP", "SİVAS", "TEKİRDAĞ", "TOKAT", "TRABZON", "TUNCELİ", "ŞANLIURFA", "UŞAK",
    "VAN", "YOZGAT", "ZONGULDAK", "AKSARAY", "BAYBURT", "KARAMAN", "KIRIKKALE", "BATMAN", "ŞIRNAK",
    "BARTIN", "ARDAHAN", "IĞDIR", "YALOVA", "KARABÜK", "KİLİS", "OSMANİYE", "DÜZCE",
    "LEFKOŞA", "GAZİMAĞUSA", "GİRNE", "GÜZELYURT"
}

FAMOUS_UNI_CITY = {
    "ORTA DOĞU TEKNİK": "Ankara",
    "ODTÜ": "Ankara",
    "HACETTEPE": "Ankara",
    "ANKARA ÜNİVERSİTESİ": "Ankara",
    "GAZİ ÜNİVERSİTESİ": "Ankara",
    "BİLKENT": "Ankara",
    "TOBB": "Ankara",
    "ÇANKAYA": "Ankara",
    "TED": "Ankara",
    "BAŞKENT": "Ankara",
    "İSTANBUL TEKNİK": "İstanbul",
    "İTÜ": "İstanbul",
    "BOĞAZİÇİ": "İstanbul",
    "İSTANBUL ÜNİVERSİTESİ": "İstanbul",
    "YILDIZ TEKNİK": "İstanbul",
    "MARMARA": "İstanbul",
    "KOÇ": "İstanbul",
    "SABANCI": "İstanbul",
    "ÖZYEĞİN": "İstanbul",
    "BAHÇEŞEHİR": "İstanbul",
    "YEDİTEPE": "İstanbul",
    "KADİR HAS": "İstanbul",
    "BİLGİ": "İstanbul",
    "GALATASARAY": "İstanbul",
    "MİMAR SİNAN": "İstanbul",
    "EGE": "İzmir",
    "DOKUZ EYLÜL": "İzmir",
    "İZMİR YÜKSEK TEKNOLOJİ": "İzmir",
    "İYTE": "İzmir",
    "İZMİR EKONOMİ": "İzmir",
    "YAŞAR": "İzmir",
    "KATİP ÇELEBİ": "İzmir",
    "ANADOLU ÜNİVERSİTESİ": "Eskişehir",
    "ESKİŞEHİR OSMANGAZİ": "Eskişehir",
    "ESKİŞEHİR TEKNİK": "Eskişehir",
    "ULUDAĞ": "Bursa",
    "BURSA TEKNİK": "Bursa",
    "AKDENİZ ÜNİVERSİTESİ": "Antalya",
    "ÇUKUROVA": "Adana",
    "KARADENİZ TEKNİK": "Trabzon",
    "KTÜ": "Trabzon",
    "ONDOKUZ MAYIS": "Samsun",
    "SELÇUK": "Konya",
    "NECMETTİN ERBAKAN": "Konya",
    "KONYA TEKNİK": "Konya",
    "KOCAELİ ÜNİVERSİTESİ": "Kocaeli",
    "GEBZE TEKNİK": "Kocaeli",
    "GTÜ": "Kocaeli",
    "SAKARYA ÜNİVERSİTESİ": "Sakarya",
}

def infer_city(university_name: str, catalog_city: Optional[str]) -> Optional[str]:
    """Infers the province name from catalog, parentheses, or famous university mappings."""
    if catalog_city and str(catalog_city).strip() and str(catalog_city).strip().lower() != "nan":
        c = str(catalog_city).strip()
        # Title case Turkish
        return c[0].upper() + c[1:].lower() if len(c) > 1 else c.upper()
    
    if not university_name:
        return None

    import re
    # Check parenthesized words, e.g. (KAYSERİ), (İSTANBUL)
    matches = re.findall(r"\((.*?)\)", university_name)
    for m in matches:
        m_clean = m.upper().strip()
        if m_clean in TURKISH_CITIES_SET:
            return m_clean[0].upper() + m_clean[1:].lower()

    # Check famous university prefixes
    u_upper = university_name.upper()
    for prefix, city in FAMOUS_UNI_CITY.items():
        if prefix in u_upper:
            return city

    # Check directly if university name contains any city
    for city in TURKISH_CITIES_SET:
        if city in u_upper:
            return city[0].upper() + city[1:].lower()

    return None


class DataLoader:
    def __init__(self, admissions_path: str = "admissions_history_readable.csv", universities_path: str = "universities.csv"):
        self.admissions_path = admissions_path
        self.universities_path = universities_path
        self.programs_by_code: Dict[str, Dict[str, Any]] = {}
        self.program_list: List[Dict[str, Any]] = []
        self.catalog_by_code: Dict[str, Dict[str, Any]] = {}
        self._load_data()

    def _load_data(self):
        print(f"[DataLoader] Loading admissions data from '{self.admissions_path}'...")
        if not os.path.exists(self.admissions_path):
            raise FileNotFoundError(f"Missing admissions file: {self.admissions_path}")

        df_adm = pd.read_csv(self.admissions_path, dtype={"program_code": str}, encoding="utf-8-sig")

        # Load optional universities.csv catalog
        if os.path.exists(self.universities_path):
            print(f"[DataLoader] Loading university catalog from '{self.universities_path}'...")
            try:
                df_uni = pd.read_csv(self.universities_path, dtype={"programme_code": str}, encoding="utf-8")
                for _, row in df_uni.iterrows():
                    code = str(row["programme_code"]).strip()
                    if not code or code == "nan":
                        continue
                    
                    # Clean and parse catalog fields
                    scholarship = row.get("scholarship")
                    scholarship_val = None if pd.isna(scholarship) or not str(scholarship).strip() else str(scholarship).strip()

                    lang = row.get("teaching_language")
                    lang_val = None if pd.isna(lang) or not str(lang).strip() else str(lang).strip()

                    edu_type = row.get("education_type")
                    edu_type_val = None if pd.isna(edu_type) or not str(edu_type).strip() else str(edu_type).strip()

                    url = row.get("official_url")
                    url_val = None if pd.isna(url) or not str(url).strip() else str(url).strip()

                    city = row.get("city")
                    city_val = None if pd.isna(city) or not str(city).strip() else str(city).strip()

                    faculty = row.get("faculty")
                    faculty_val = None if pd.isna(faculty) or not str(faculty).strip() else str(faculty).strip()

                    self.catalog_by_code[code] = {
                        "teaching_language": lang_val,
                        "scholarship": scholarship_val,
                        "education_type": edu_type_val,
                        "official_url": url_val,
                        "city": city_val,
                        "faculty": faculty_val,
                    }
                print(f"[DataLoader] Catalog loaded with {len(self.catalog_by_code):,} programs.")
            except Exception as e:
                print(f"[DataLoader] Warning: Could not parse universities.csv: {e}")
        else:
            print("[DataLoader] universities.csv not found; continuing with admissions CSV alone.")

        # Organize admissions records by program_code
        grouped = df_adm.groupby("program_code")
        for code, group in grouped:
            code_str = str(code).strip()
            # Sort by year ascending
            group_sorted = group.sort_values(by="year")
            latest_row = group_sorted.iloc[-1]

            history = []
            for _, r in group_sorted.iterrows():
                yr = int(r["year"])
                quota = None if pd.isna(r["published_quota"]) else int(r["published_quota"])
                closing_rank = None if pd.isna(r["closing_rank"]) else float(r["closing_rank"])
                history.append({
                    "year": yr,
                    "published_quota": quota,
                    "closing_rank": closing_rank,
                    "quota_source": str(r.get("quota_source", "")) if not pd.isna(r.get("quota_source")) else "",
                    "rank_source_url": str(r.get("rank_source_url", "")) if not pd.isna(r.get("rank_source_url")) else "",
                })

            cat_info = self.catalog_by_code.get(code_str, {})
            u_name = str(latest_row["university_name"]).strip()
            p_name = str(latest_row["program_name"]).strip()
            score_type = str(latest_row["score_type"]).strip()

            prog_data = {
                "program_code": code_str,
                "university_name": u_name,
                "program_name": p_name,
                "score_type": score_type,
                "city": infer_city(u_name, cat_info.get("city")),
                "faculty": cat_info.get("faculty"),
                "teaching_language": cat_info.get("teaching_language"),
                "scholarship": cat_info.get("scholarship"),
                "education_type": cat_info.get("education_type"),
                "official_url": cat_info.get("official_url"),
                "history": history,
                # Precompute search text for fast lookups
                "_search_index": f"{normalize_turkish(u_name)} {normalize_turkish(p_name)} {code_str}",
            }
            self.programs_by_code[code_str] = prog_data
            self.program_list.append(prog_data)

        # Sort program list alphabetically by university then program name
        self.program_list.sort(key=lambda x: (x["university_name"], x["program_name"]))
        print(f"[DataLoader] Successfully indexed {len(self.programs_by_code):,} unique undergraduate programs.")

    def search_programs(self, query: str = "", score_type: str = "ALL", page: int = 1, page_size: int = 20):
        norm_query = normalize_turkish(query.strip()) if query else ""
        filtered = self.program_list

        if score_type and score_type.upper() != "ALL":
            filtered = [p for p in filtered if p["score_type"] == score_type.upper()]

        if norm_query:
            query_tokens = norm_query.split()
            filtered = [p for p in filtered if all(tok in p["_search_index"] for tok in query_tokens)]

        total = len(filtered)
        start = (page - 1) * page_size
        end = start + page_size
        items = filtered[start:end]

        # Strip internal search index from response
        clean_items = []
        for item in items:
            c = dict(item)
            c.pop("_search_index", None)
            clean_items.append(c)

        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if total > 0 else 1,
            "items": clean_items,
        }

    def get_program(self, program_code: str) -> Optional[Dict[str, Any]]:
        prog = self.programs_by_code.get(str(program_code).strip())
        if not prog:
            return None
        c = dict(prog)
        c.pop("_search_index", None)
        return c
