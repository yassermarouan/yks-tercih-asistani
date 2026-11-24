import React, { useState, useEffect, useMemo } from "react";
import type { CitiesAnalyticsResponse, CitySummary } from "../types";
import { getCityAnalytics, formatRank } from "../api";
import {
  MapPin,
  Building2,
  GraduationCap,
  Search,
  ArrowRight,
  DollarSign,
  Home,
  X,
  Compass,
} from "lucide-react";

interface Props {
  onSelectCityForSearch?: (cityName: string) => void;
}

const REGIONS = [
  "Tümü",
  "Marmara",
  "İç Anadolu",
  "Ege",
  "Akdeniz",
  "Karadeniz",
  "Doğu Anadolu",
  "Güneydoğu Anadolu",
  "KKTC",
];

export const TurkeyPreferenceMap: React.FC<Props> = ({ onSelectCityForSearch }) => {
  const [data, setData] = useState<CitiesAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedRegion, setSelectedRegion] = useState<string>("Tümü");
  const [selectedCostTier, setSelectedCostTier] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCityModal, setActiveCityModal] = useState<CitySummary | null>(null);

  useEffect(() => {
    let isMounted = true;
    getCityAnalytics()
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Şehir verileri yüklenemedi.");
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCities = useMemo(() => {
    if (!data?.cities) return [];

    return data.cities.filter((c) => {
      // Region filter
      if (selectedRegion !== "Tümü" && c.region !== selectedRegion) {
        return false;
      }
      // Cost tier filter
      if (selectedCostTier !== "all" && c.cost_tier !== selectedCostTier) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inName = c.city_name.toLowerCase().includes(q);
        const inUni = c.top_universities.some((u) => u.name.toLowerCase().includes(q));
        if (!inName && !inUni) return false;
      }
      return true;
    });
  }, [data, selectedRegion, selectedCostTier, searchQuery]);

  // Overall totals
  const totalUniversities = useMemo(() => {
    if (!data?.cities) return 0;
    const allUnis = new Set<string>();
    data.cities.forEach((c) => {
      c.top_universities.forEach((u) => allUnis.add(u.name));
    });
    return allUnis.size;
  }, [data]);

  const totalPrograms = useMemo(() => {
    if (!data?.cities) return 0;
    return data.cities.reduce((acc, c) => acc + c.program_count, 0);
  }, [data]);

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "high":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Metropol (Yüksek)
          </span>
        );
      case "medium":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Öğrenci Kenti (Dengeli)
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Ekonomik (Öğrenci Dostu)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Overview */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-black border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                🗺️ Bölgesel Tercih & Şehir Rehberi
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                81 İl & KKTC Kapsamı
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Türkiye Üniversite & Tercih Haritası
            </h2>
            <p className="text-sm text-zinc-300 max-w-2xl mt-1.5 leading-relaxed">
              İllerin üniversite yoğunluğunu, taban sıralama seviyelerini ve ortalama barınma/yaşam maliyeti düzeylerini
              inceleyin. Şehirlere tıklayarak o ildeki tüm lisans programlarını anında filtreleyin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-center">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 min-w-[110px]">
              <span className="text-xs text-zinc-400 block font-medium">Toplam Şehir</span>
              <span className="text-xl font-bold font-mono text-white mt-0.5 block">
                {data?.total_cities || 81}
              </span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 min-w-[110px]">
              <span className="text-xs text-zinc-400 block font-medium">Üniversiteler</span>
              <span className="text-xl font-bold font-mono text-emerald-400 mt-0.5 block">
                {totalUniversities > 0 ? `${totalUniversities}+` : "200+"}
              </span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 min-w-[110px]">
              <span className="text-xs text-zinc-400 block font-medium">Lisans Programı</span>
              <span className="text-xl font-bold font-mono text-white mt-0.5 block">
                {totalPrograms > 0 ? formatRank(totalPrograms) : "13.000+"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Region tabs, Cost filter, City Search */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-lg space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Şehir veya üniversite adı arayın (Örn: Eskişehir, Ege, ODTÜ)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black border border-zinc-800 text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-500 placeholder-zinc-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Cost tier selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400 font-medium flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Yaşam Maliyeti:
            </span>
            <select
              value={selectedCostTier}
              onChange={(e) => setSelectedCostTier(e.target.value)}
              className="bg-black border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Tüm Maliyet Seviyeleri</option>
              <option value="high">Metropol (Yüksek Maliyet)</option>
              <option value="medium">Gelişmiş Öğrenci Kenti (Dengeli)</option>
              <option value="low">Ekonomik (Öğrenci Dostu)</option>
            </select>
          </div>
        </div>

        {/* Region tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar border-t border-zinc-800">
          <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mr-1 hidden sm:inline">
            Bölge:
          </span>
          {REGIONS.map((reg) => (
            <button
              key={reg}
              onClick={() => setSelectedRegion(reg)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedRegion === reg
                  ? "bg-emerald-500 text-black font-extrabold shadow-md shadow-emerald-500/20"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white"
              }`}
            >
              {reg}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: City Cards */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mb-3"></div>
          <p className="text-sm font-medium">81 ilin üniversite ve yaşam maliyeti verileri derleniyor...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm text-center">
          {error}
        </div>
      ) : filteredCities.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-xl">
          <Compass className="w-10 h-10 mx-auto text-slate-600 mb-3" />
          <h4 className="text-base font-semibold text-white">Seçilen Kriterlere Uygun Şehir Bulunamadı</h4>
          <p className="text-xs text-slate-400 mt-1">Filtreleri veya arama kelimesini temizleyerek tekrar deneyin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCities.map((city) => (
            <div
              key={city.city_name}
              onClick={() => setActiveCityModal(city)}
              className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/5 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-indigo-400 flex-shrink-0 group-hover:text-indigo-300 transition" />
                    <h3 className="text-base font-bold text-white tracking-wide group-hover:text-indigo-200 transition">
                      {city.city_name}
                    </h3>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60">
                    {city.region}
                  </span>
                </div>

                <div className="mb-3">{getTierBadge(city.cost_tier)}</div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs py-2.5 border-y border-slate-800/80 mb-3">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Üniversite Sayısı</span>
                    <span className="font-bold font-mono text-white flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                      {city.university_count} Üniversite
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Lisans Programı</span>
                    <span className="font-bold font-mono text-white flex items-center gap-1 mt-0.5">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                      {formatRank(city.program_count)} Program
                    </span>
                  </div>
                </div>

                {/* Universities Preview */}
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Öne Çıkan Kurumlar
                  </span>
                  <div className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {city.top_universities.slice(0, 3).map((u, i) => (
                      <span key={u.name}>
                        {u.name.replace(/ ÜNİVERSİTESİ/i, "")}
                        {i < Math.min(2, city.top_universities.length - 1) ? ", " : ""}
                      </span>
                    ))}
                    {city.top_universities.length > 3 && (
                      <span className="text-slate-400 font-medium"> +{city.top_universities.length - 3} daha</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-indigo-400 font-semibold group-hover:text-indigo-300 transition">
                <span>Detayları & Üniversiteleri Gör</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* City Detail Modal */}
      {activeCityModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {activeCityModal.region} Bölgesi
                  </span>
                  {getTierBadge(activeCityModal.cost_tier)}
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-indigo-400" />
                  {activeCityModal.city_name} Şehir & Tercih Profili
                </h3>
              </div>

              <button
                onClick={() => setActiveCityModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Living Cost & Student Life Guide */}
            <div className="my-5 p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Home className="w-4 h-4 text-amber-400" />
                  Öğrenci Yaşamı ve Barınma Analizi
                </h4>
                <div className="flex items-center gap-1 text-xs text-slate-300">
                  <span>Kira İndeksi:</span>
                  <span className="font-bold text-amber-300">
                    {"★".repeat(activeCityModal.rent_index_score)}
                    {"☆".repeat(5 - activeCityModal.rent_index_score)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {activeCityModal.living_cost_description}
              </p>
              <div className="flex flex-wrap gap-4 text-xs pt-2 border-t border-slate-700/50">
                <div>
                  <span className="text-slate-400">KYK Yurt Kapasitesi: </span>
                  <span className="font-semibold text-white">{activeCityModal.dorm_availability}</span>
                </div>
                <div>
                  <span className="text-slate-400">Maliyet Statüsü: </span>
                  <span className="font-semibold text-white">{activeCityModal.cost_label}</span>
                </div>
                {activeCityModal.median_closing_rank && (
                  <div>
                    <span className="text-slate-400">Medyan Başarı Sırası: </span>
                    <span className="font-mono font-semibold text-indigo-300">
                      {formatRank(activeCityModal.median_closing_rank)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* University List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  Şehirdeki Üniversiteler ({activeCityModal.top_universities.length})
                </h4>
                <span className="text-xs text-slate-400">
                  Toplam {formatRank(activeCityModal.program_count)} Lisans Programı
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {activeCityModal.top_universities.map((uni) => (
                  <div
                    key={uni.name}
                    className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <h5 className="font-semibold text-white">{uni.name}</h5>
                      <span className="text-[11px] text-slate-400">
                        {uni.type} Üniversitesi • {uni.program_count} lisans programı
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        uni.type === "Devlet"
                          ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {uni.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Score Type Distribution Badges */}
            <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 font-medium">Puan Türleri:</span>
                {Object.entries(activeCityModal.score_types_count).map(([st, cnt]) => (
                  <span
                    key={st}
                    className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700"
                  >
                    {st}: {cnt}
                  </span>
                ))}
              </div>

              {onSelectCityForSearch && (
                <button
                  onClick={() => {
                    onSelectCityForSearch(activeCityModal.city_name);
                    setActiveCityModal(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Compass className="w-4 h-4 text-black" />
                  <span>{activeCityModal.city_name} Programlarını Keşfet</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
