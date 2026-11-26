import React, { useState, useEffect, useMemo } from "react";
import type { CitiesAnalyticsResponse, CitySummary } from "../types";
import { getCityAnalytics, formatRank } from "../api";
import { MapPin, Search, ArrowRight, X, Compass } from "lucide-react";

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
  const [modalUniFilter, setModalUniFilter] = useState<string>("");

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
      if (selectedRegion !== "Tümü" && c.region !== selectedRegion) return false;
      if (selectedCostTier !== "all" && c.cost_tier !== selectedCostTier) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inName = c.city_name.toLowerCase().includes(q);
        const inUni = c.top_universities.some((u) => u.name.toLowerCase().includes(q));
        if (!inName && !inUni) return false;
      }
      return true;
    });
  }, [data, selectedRegion, selectedCostTier, searchQuery]);

  const totalUniversities = useMemo(() => {
    if (!data?.cities) return 0;
    const allUnis = new Set<string>();
    data.cities.forEach((c) => c.top_universities.forEach((u) => allUnis.add(u.name)));
    return allUnis.size;
  }, [data]);

  const totalPrograms = useMemo(() => {
    if (!data?.cities) return 0;
    return data.cities.reduce((acc, c) => acc + c.program_count, 0);
  }, [data]);

  const displayedModalUnis = useMemo(() => {
    if (!activeCityModal) return [];
    if (!modalUniFilter.trim()) return activeCityModal.top_universities;
    const q = modalUniFilter.toLowerCase().trim();
    return activeCityModal.top_universities.filter((u) => u.name.toLowerCase().includes(q));
  }, [activeCityModal, modalUniFilter]);

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "high":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/12 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-600/25 dark:border-rose-500/20">
            Yüksek Maliyet
          </span>
        );
      case "medium":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/12 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-600/25 dark:border-amber-500/20">
            Dengeli Maliyet
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#E5EDC8] dark:bg-emerald-500/10 text-[#526B19] dark:text-emerald-300 border border-[#C5D496] dark:border-emerald-500/20">
            Ekonomik
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-[#171A12] dark:text-zinc-100 tracking-tight">
            Şehir Haritası ve Yaşam Rehberi
          </h2>
          <p className="text-sm text-[#6B7065] dark:text-zinc-400 mt-0.5">
            Şehirlere tıklayarak üniversiteleri, yurt imkanlarını ve yaşam maliyetini inceleyin.
          </p>
        </div>

        <div className="flex items-center gap-2.5 text-xs">
          <div className="bg-[#F0F1E9] dark:bg-[#111114] border border-[#D0D5C6] dark:border-zinc-800/80 rounded-xl px-3.5 py-2">
            <span className="text-[#6B7065] mr-1.5">Şehir:</span>
            <strong className="font-mono text-[#171A12] dark:text-zinc-100">{data?.total_cities || 81}</strong>
          </div>
          <div className="bg-[#F0F1E9] dark:bg-[#111114] border border-[#D0D5C6] dark:border-zinc-800/80 rounded-xl px-3.5 py-2">
            <span className="text-[#6B7065] mr-1.5">Üniversite:</span>
            <strong className="font-mono text-[#526B19] dark:text-emerald-400">
              {totalUniversities > 0 ? `${totalUniversities}+` : "200+"}
            </strong>
          </div>
          <div className="bg-[#F0F1E9] dark:bg-[#111114] border border-[#D0D5C6] dark:border-zinc-800/80 rounded-xl px-3.5 py-2 hidden sm:block">
            <span className="text-[#6B7065] mr-1.5">Program:</span>
            <strong className="font-mono text-[#171A12] dark:text-zinc-100">
              {totalPrograms > 0 ? formatRank(totalPrograms) : "13.000+"}
            </strong>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-b from-[#F2F3EC] to-[#ECEEE3] dark:bg-none dark:bg-[#111114] border border-[#D0D5C6] dark:border-zinc-800/80 rounded-2xl p-4 space-y-3 shadow-[0_2px_10px_rgba(23,26,18,0.04)] dark:shadow-none">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6B7065] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Şehir veya üniversite ara (Örn: Eskişehir, ODTÜ)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#E8EBE0] dark:bg-[#09090b] border border-[#D0D5C6] dark:border-zinc-800 text-[#171A12] dark:text-zinc-100 rounded-xl pl-10 pr-8 py-2 text-sm focus:outline-none focus:border-emerald-500 placeholder-[#6B7065]/75 dark:placeholder-zinc-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7065] hover:text-[#171A12] dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <select
            value={selectedCostTier}
            onChange={(e) => setSelectedCostTier(e.target.value)}
            className="bg-[#E8EBE0] dark:bg-[#09090b] border border-[#D0D5C6] dark:border-zinc-800 text-[#171A12] dark:text-zinc-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Tüm Maliyet Seviyeleri</option>
            <option value="low">Ekonomik Şehirler</option>
            <option value="medium">Dengeli Öğrenci Kentleri</option>
            <option value="high">Yüksek Maliyetli Metropoller</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-[#D0D5C6] dark:border-zinc-800/60 no-scrollbar">
          {REGIONS.map((reg) => (
            <button
              key={reg}
              type="button"
              onClick={() => setSelectedRegion(reg)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                selectedRegion === reg
                  ? "bg-[#C6F432] text-[#171A12] font-semibold"
                  : "bg-[#E8EBE0] dark:bg-[#09090b] border border-[#D0D5C6] dark:border-zinc-800 text-[#6B7065] dark:text-zinc-400 hover:text-[#171A12] dark:hover:text-zinc-100"
              }`}
            >
              {reg}
            </button>
          ))}
        </div>
      </div>

      {/* City Cards */}
      {loading ? (
        <div className="py-20 text-center text-[#6B7065] dark:text-zinc-400">
          <div className="inline-block animate-spin rounded-full h-7 w-7 border-b-2 border-emerald-500 mb-3" />
          <p className="text-sm">Şehir verileri yükleniyor...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/12 dark:bg-rose-500/10 border border-rose-600/25 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-sm text-center">
          {error}
        </div>
      ) : filteredCities.length === 0 ? (
        <div className="py-16 text-center text-[#6B7065] bg-gradient-to-b from-[#F2F3EC] to-[#ECEEE3] dark:bg-none dark:bg-[#111114] border border-[#D0D5C6] dark:border-zinc-800/80 rounded-2xl">
          <Compass className="w-8 h-8 mx-auto text-[#6B7065] dark:text-zinc-600 mb-2" />
          <p className="text-sm font-medium text-[#171A12] dark:text-zinc-200">Uygun şehir bulunamadı</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredCities.map((city) => (
            <div
              key={city.city_name}
              onClick={() => setActiveCityModal(city)}
              className="bg-gradient-to-b from-[#F2F3EC] to-[#ECEEE3] dark:bg-none dark:bg-[#111114] border border-[#D0D5C6] dark:border-zinc-800/80 hover:border-[#B6BEA9] dark:hover:border-zinc-700 rounded-2xl p-4 transition cursor-pointer flex flex-col justify-between group shadow-[0_2px_10px_rgba(23,26,18,0.04)] dark:shadow-none"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-[#171A12] dark:text-zinc-100 group-hover:text-[#526B19] dark:group-hover:text-emerald-400 transition">
                      {city.city_name}
                    </h3>
                    <span className="text-[11px] text-[#6B7065]">{city.region}</span>
                  </div>
                  {getTierBadge(city.cost_tier)}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#D0D5C6] dark:border-zinc-800/70 text-xs">
                  <div>
                    <span className="text-[#6B7065] text-[11px] block">Üniversite</span>
                    <span className="font-mono font-semibold text-[#171A12] dark:text-zinc-100">
                      {city.university_count}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B7065] text-[11px] block">Program</span>
                    <span className="font-mono font-semibold text-[#171A12] dark:text-zinc-100">
                      {formatRank(city.program_count)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#D0D5C6] dark:border-zinc-800/60 flex items-center justify-between text-xs text-[#526B19] dark:text-emerald-400 font-medium">
                <span>Şehri İncele</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* City Modal */}
      {activeCityModal && (
        <div className="fixed inset-0 z-50 bg-[#171A12]/40 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gradient-to-b from-[#F2F3EC] to-[#ECEEE3] dark:bg-none dark:bg-[#111114] border border-[#D0D5C6] dark:border-zinc-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#D0D5C6] dark:border-zinc-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#6B7065] dark:text-zinc-400">{activeCityModal.region} Bölgesi</span>
                  {getTierBadge(activeCityModal.cost_tier)}
                </div>
                <h3 className="text-xl font-semibold text-[#171A12] dark:text-zinc-100 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#526B19] dark:text-emerald-400" />
                  {activeCityModal.city_name}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveCityModal(null);
                  setModalUniFilter("");
                }}
                className="p-1.5 rounded-lg text-[#6B7065] hover:text-[#171A12] dark:hover:text-zinc-100 hover:bg-[#E5EDC8]/70 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#E8EBE0] dark:bg-[#09090b] border border-[#D0D5C6] dark:border-zinc-800/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#171A12] dark:text-zinc-200">Öğrenci Yaşamı ve Barınma</span>
                <span className="text-amber-600 dark:text-amber-300">
                  Kira Düzeyi: {"★".repeat(activeCityModal.rent_index_score)}
                  {"☆".repeat(5 - activeCityModal.rent_index_score)}
                </span>
              </div>
              <p className="text-xs text-[#6B7065] dark:text-zinc-400 leading-relaxed">
                {activeCityModal.living_cost_description}
              </p>
              <div className="flex flex-wrap gap-4 text-xs pt-2 border-t border-[#D0D5C6] dark:border-zinc-800/60 text-[#171A12] dark:text-zinc-300">
                <span>KYK Yurt: <strong>{activeCityModal.dorm_availability}</strong></span>
                <span>Maliyet: <strong>{activeCityModal.cost_label}</strong></span>
                {activeCityModal.median_closing_rank && (
                  <span>
                    Ortalama Sıra:{" "}
                    <strong className="font-mono text-[#526B19] dark:text-emerald-400">
                      {formatRank(activeCityModal.median_closing_rank)}
                    </strong>
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-[#171A12] dark:text-zinc-100">
                  Üniversiteler ({activeCityModal.top_universities.length})
                </h4>
                <span className="text-xs text-[#6B7065]">
                  {formatRank(activeCityModal.program_count)} program
                </span>
              </div>

              {activeCityModal.top_universities.length > 5 && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7065]" />
                  <input
                    type="text"
                    value={modalUniFilter}
                    onChange={(e) => setModalUniFilter(e.target.value)}
                    placeholder="Üniversite ara..."
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#E8EBE0] dark:bg-[#09090b] border border-[#D0D5C6] dark:border-zinc-800 text-xs text-[#171A12] dark:text-zinc-100 placeholder-[#6B7065]/75 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {displayedModalUnis.map((uni) => (
                  <div
                    key={uni.name}
                    className="p-3 rounded-xl bg-[#E8EBE0] dark:bg-[#09090b] border border-[#D0D5C6] dark:border-zinc-800/70 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-medium text-[#171A12] dark:text-zinc-100">{uni.name}</div>
                      <span className="text-[11px] text-[#6B7065]">{uni.program_count} program</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        uni.type === "Devlet"
                          ? "bg-[#E5EDC8] dark:bg-emerald-500/10 text-[#526B19] dark:text-emerald-400"
                          : "bg-amber-500/12 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      {uni.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#D0D5C6] dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5 text-[11px] font-mono text-[#6B7065] dark:text-zinc-400">
                {Object.entries(activeCityModal.score_types_count).map(([st, cnt]) => (
                  <span key={st} className="px-2 py-0.5 rounded bg-[#DFE4D5] dark:bg-zinc-900 border border-[#D0D5C6] dark:border-zinc-800">
                    {st}: {cnt}
                  </span>
                ))}
              </div>

              {onSelectCityForSearch && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectCityForSearch(activeCityModal.city_name);
                    setActiveCityModal(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#C6F432] hover:bg-[#b5e422] text-[#171A12] font-semibold text-xs transition cursor-pointer"
                >
                  {activeCityModal.city_name} Programlarını Gör
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
