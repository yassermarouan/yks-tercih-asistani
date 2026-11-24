import React, { useState, useEffect } from "react";
import type { TrendAnalyticsResponse, TrendProgram } from "../types";
import { getTrendAnalytics, formatRank } from "../api";
import {
  Flame,
  ShieldCheck,
  BarChart3,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  MapPin,
} from "lucide-react";

interface Props {
  onSelectProgram?: (programCode: string) => void;
}

const SCORE_TYPES = [
  { id: "ALL", label: "Tüm Puan Türleri" },
  { id: "SAY", label: "SAY (Sayısal)" },
  { id: "EA", label: "EA (Eşit Ağırlık)" },
  { id: "SÖZ", label: "SÖZ (Sözel)" },
  { id: "DİL", label: "DİL (Yabancı Dil)" },
];

export const TrendMarketDashboard: React.FC<Props> = ({ onSelectProgram }) => {
  const [selectedScoreType, setSelectedScoreType] = useState<string>("ALL");
  const [data, setData] = useState<TrendAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"gainers" | "decliners" | "sectors">("gainers");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getTrendAnalytics(selectedScoreType, 15)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Trend verileri yüklenemedi.");
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [selectedScoreType]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Live Ticker */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-black border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                YKS Tercih Borsası & Makro Trendler
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-900 text-zinc-300 border border-zinc-800">
                2023 – 2025 Dinamikleri
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Popülarite & Taban Sıralaması Trendleri
            </h2>
            <p className="text-sm text-zinc-300 max-w-2xl mt-1.5 leading-relaxed">
              Son 3 yılda Türkiye genelinde talebi hızla tırmanan (tavan yapan) ve taban sıralaması gevşeyerek adaylara
              stratejik fırsat sunan lisans programlarının borsa analizi.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-center">
              <span className="text-[11px] text-zinc-400 block font-medium">İncelenen Program</span>
              <span className="text-xl font-bold font-mono text-emerald-400 block mt-0.5">
                {data?.sample_size ? formatRank(data.sample_size) : "7.800+"}
              </span>
            </div>
          </div>
        </div>

        {/* Live Ticker Strip */}
        {data?.ticker_headlines && data.ticker_headlines.length > 0 && (
          <div className="bg-black border border-zinc-800 rounded-xl px-4 py-2.5 flex items-center gap-3 overflow-x-auto no-scrollbar">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1 flex-shrink-0">
              <Activity className="w-3.5 h-3.5" /> Trend Akışı:
            </span>
            <div className="flex items-center gap-3 text-xs whitespace-nowrap overflow-x-auto no-scrollbar">
              {data.ticker_headlines.map((item, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md bg-zinc-900 text-zinc-200 border border-zinc-800 font-mono text-[11px] flex-shrink-0"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Control Bar: Score Type Selector & Section Tabs */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Score Type Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {SCORE_TYPES.map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedScoreType(st.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedScoreType === st.id
                  ? "bg-emerald-500 text-black font-extrabold shadow-md shadow-emerald-500/20"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2 bg-black p-1 rounded-xl border border-zinc-800 self-start md:self-auto">
          <button
            onClick={() => setActiveTab("gainers")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "gainers"
                ? "bg-emerald-500 text-black font-extrabold shadow-md shadow-emerald-500/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tavan Yapanlar (Talep Patlaması)</span>
          </button>

          <button
            onClick={() => setActiveTab("decliners")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "decliners"
                ? "bg-white text-black font-extrabold shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
            <span>Fırsat Havuzu (Tabanı Gevşeyenler)</span>
          </button>

          <button
            onClick={() => setActiveTab("sectors")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "sectors"
                ? "bg-emerald-500 text-black font-extrabold shadow-md shadow-emerald-500/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sektörel Genel Bakış</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-3"></div>
          <p className="text-sm font-medium">Borsa ve popülarite dinamikleri hesaplanıyor...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm text-center">
          {error}
        </div>
      ) : activeTab === "sectors" ? (
        /* Sector Breakdown Cards */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              Sektör ve Alan Bazlı 3 Yıllık Talep Yönü
            </h3>
            <span className="text-xs text-slate-400">YKS 2023 $\rightarrow$ 2025 Medyan Eğilimleri</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.sector_trends.map((sec) => {
              const isUp = sec.direction === "up";
              const isDown = sec.direction === "down";

              return (
                <div
                  key={sec.sector_name}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold text-white tracking-wide">{sec.sector_name}</h4>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono flex items-center gap-1 ${
                        isUp
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : isDown
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          : "bg-slate-800 text-slate-300 border border-slate-700"
                      }`}
                    >
                      {isUp && <ArrowUpRight className="w-3 h-3" />}
                      {isDown && <ArrowDownRight className="w-3 h-3" />}
                      {sec.average_change_pct > 0 ? "+" : ""}
                      {sec.average_change_pct}%
                    </span>
                  </div>

                  {/* Progress / Trend Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{sec.trend_label}</span>
                      <span className="font-mono">{sec.program_count} Program</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isUp ? "bg-emerald-500" : isDown ? "bg-rose-500" : "bg-slate-500"
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(15, Math.abs(sec.average_change_pct) * 2.5))}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span>2025 Medyan Sıralama:</span>
                    <span className="font-mono font-semibold text-indigo-300">
                      {formatRank(sec.median_rank_2025)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Top Gainers or Decliners List */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {activeTab === "gainers" ? (
                <>
                  <Flame className="w-5 h-5 text-emerald-400" />
                  <span>En Çok Yükselenler (Tavan Yapan Bölümler)</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 text-sky-400" />
                  <span>Fırsat Havuzu (Taban Sıralaması En Çok Gevşeyenler)</span>
                </>
              )}
            </h3>
            <span className="text-xs text-slate-400">
              {activeTab === "gainers"
                ? "Sıralaması öne çekilen ve rekabeti katlanan programlar"
                : "Sıralaması geriye doğru açılan, adaya güvenli tercih fırsatı veren programlar"}
            </span>
          </div>

          <div className="space-y-3">
            {((activeTab === "gainers" ? data?.top_gainers : data?.top_decliners) || []).map(
              (p: TrendProgram, idx: number) => {
                const isGain = p.change_pct > 0;

                return (
                  <div
                    key={p.program_code}
                    onClick={() => onSelectProgram && onSelectProgram(p.program_code)}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl shadow-md transition hover:-translate-y-0.5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 ${
                          activeTab === "gainers"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                        }`}
                      >
                        #{idx + 1}
                      </span>

                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-800 text-slate-300 border border-slate-700">
                            {p.score_type}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            {p.city}
                          </span>
                          <span className="text-xs text-slate-400">
                            • {p.quota_2025} Kontenjan
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white group-hover:text-indigo-200 transition">
                          {p.program_name}
                        </h4>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          {p.university_name}
                        </p>
                      </div>
                    </div>

                    {/* Numerical Trend Shift */}
                    <div className="flex items-center gap-6 self-end md:self-auto">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block uppercase font-medium">
                          2023 $\rightarrow$ 2025 Taban Sıra
                        </span>
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                          <span className="text-slate-400">{formatRank(p.rank_2023)}</span>
                          <span className="text-slate-600">→</span>
                          <span className="font-bold text-white">{formatRank(p.rank_2025)}</span>
                        </div>
                      </div>

                      <div className="min-w-[100px] text-right">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold font-mono ${
                            isGain
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                          }`}
                        >
                          {isGain ? (
                            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5 text-sky-400" />
                          )}
                          {isGain ? "+" : ""}
                          {p.change_pct.toFixed(1)}%
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                          {isGain
                            ? `▲ ${formatRank(Math.abs(p.rank_difference))} sıra öne`
                            : `▼ ${formatRank(Math.abs(p.rank_difference))} sıra esneme`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}
    </div>
  );
};
