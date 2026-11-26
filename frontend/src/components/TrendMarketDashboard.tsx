import React, { useState, useEffect } from "react";
import type { TrendAnalyticsResponse, TrendProgram } from "../types";
import { getTrendAnalytics, formatRank } from "../api";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface Props {
  onSelectProgram?: (programCode: string) => void;
}

const SCORE_TYPES = [
  { id: "ALL", label: "Tümü" },
  { id: "SAY", label: "Sayısal (SAY)" },
  { id: "EA", label: "Eşit Ağırlık (EA)" },
  { id: "SÖZ", label: "Sözel (SÖZ)" },
  { id: "DİL", label: "Dil (DİL)" },
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
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-[#171A12] dark:text-zinc-100 tracking-tight">
            Bölüm Trendleri
          </h2>
          <p className="text-sm text-[#6B7065] dark:text-zinc-400 mt-0.5">
            Son üç yılda sıralaması en çok öne çekilen ve rahatlayan bölümleri inceleyin.
          </p>
        </div>
        <span className="text-xs text-[#6B7065] font-mono">
          {data?.sample_size ? `${formatRank(data.sample_size)} program incelendi` : ""}
        </span>
      </div>

      <div className="bg-gradient-to-b from-[#F2F3EC] to-[#ECEEE3] dark:bg-none dark:bg-[#111114] border border-[#D0D5C6] dark:border-zinc-800/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-[0_2px_10px_rgba(23,26,18,0.04)] dark:shadow-none">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {SCORE_TYPES.map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setSelectedScoreType(st.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                selectedScoreType === st.id
                  ? "bg-[#C6F432] text-[#171A12] font-semibold"
                  : "bg-[#E8EBE0] dark:bg-[#09090b] border border-[#D0D5C6] dark:border-zinc-800 text-[#6B7065] dark:text-zinc-400 hover:text-[#171A12] dark:hover:text-zinc-100"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-[#DFE4D5] dark:bg-[#09090b] p-1 rounded-xl border border-[#D0D5C6] dark:border-zinc-800 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("gainers")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === "gainers"
                ? "bg-[#F0F1E9] dark:bg-zinc-800 text-[#171A12] dark:text-zinc-100 shadow-[0_2px_10px_rgba(23,26,18,0.04)]"
                : "text-[#6B7065] dark:text-zinc-400 hover:text-[#171A12] dark:hover:text-zinc-200"
            }`}
          >
            İlgi Görenler
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("decliners")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === "decliners"
                ? "bg-[#F0F1E9] dark:bg-zinc-800 text-[#171A12] dark:text-zinc-100 shadow-[0_2px_10px_rgba(23,26,18,0.04)]"
                : "text-[#6B7065] dark:text-zinc-400 hover:text-[#171A12] dark:hover:text-zinc-200"
            }`}
          >
            Sıralaması Rahatlayanlar
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("sectors")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === "sectors"
                ? "bg-[#F0F1E9] dark:bg-zinc-800 text-[#171A12] dark:text-zinc-100 shadow-[0_2px_10px_rgba(23,26,18,0.04)]"
                : "text-[#6B7065] dark:text-zinc-400 hover:text-[#171A12] dark:hover:text-zinc-200"
            }`}
          >
            Alanlara Göre
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-[#6B7065] dark:text-zinc-400">
          <div className="inline-block animate-spin rounded-full h-7 w-7 border-b-2 border-emerald-500 mb-3" />
          <p className="text-sm">Trend verileri hazırlanıyor...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/12 dark:bg-rose-500/10 border border-rose-600/25 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-sm text-center">
          {error}
        </div>
      ) : activeTab === "sectors" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {data?.sector_trends.map((sec) => {
            const isUp = sec.direction === "up";
            const isDown = sec.direction === "down";

            return (
              <div
                key={sec.sector_name}
                className="bg-gradient-to-b from-[#F2F3EC] to-[#ECEEE3] dark:bg-none dark:bg-[#111114] border border-[#D0D5C6] dark:border-zinc-800/80 rounded-2xl p-4 space-y-3 shadow-[0_2px_10px_rgba(23,26,18,0.04)] dark:shadow-none"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-[#171A12] dark:text-zinc-100">{sec.sector_name}</h4>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium inline-flex items-center gap-0.5 ${
                      isUp
                        ? "bg-[#E5EDC8] dark:bg-emerald-500/10 text-[#526B19] dark:text-emerald-400"
                        : isDown
                        ? "bg-rose-500/12 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400"
                        : "bg-[#DFE4D5] dark:bg-zinc-800 text-[#6B7065] dark:text-zinc-400"
                    }`}
                  >
                    {isUp && <ArrowUpRight className="w-3 h-3" />}
                    {isDown && <ArrowDownRight className="w-3 h-3" />}
                    {sec.average_change_pct > 0 ? "+" : ""}
                    {sec.average_change_pct}%
                  </span>
                </div>

                <div className="h-1.5 rounded-full bg-[#D0D5C6] dark:bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isUp ? "bg-emerald-500" : isDown ? "bg-rose-500" : "bg-zinc-400"
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(12, Math.abs(sec.average_change_pct) * 2.5))}%`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#6B7065] dark:text-zinc-400 pt-1">
                  <span>{sec.trend_label} ({sec.program_count} bölüm)</span>
                  <span className="font-mono text-[#171A12] dark:text-zinc-200">
                    Ortalama: {formatRank(sec.median_rank_2025)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-gradient-to-b from-[#F2F3EC] to-[#ECEEE3] dark:bg-none dark:bg-[#111114] border border-[#D0D5C6] dark:border-zinc-800/80 rounded-2xl divide-y divide-[#D0D5C6] dark:divide-zinc-800/70 overflow-hidden shadow-[0_2px_10px_rgba(23,26,18,0.04)] dark:shadow-none">
          {((activeTab === "gainers" ? data?.top_gainers : data?.top_decliners) || []).map(
            (p: TrendProgram, idx: number) => {
              const isGain = p.change_pct > 0;

              return (
                <div
                  key={p.program_code}
                  onClick={() => onSelectProgram && onSelectProgram(p.program_code)}
                  className="p-4 hover:bg-[#E5EDC8]/55 dark:hover:bg-zinc-900/60 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="text-xs font-mono text-[#6B7065] dark:text-zinc-500 pt-0.5 shrink-0">
                      #{idx + 1}
                    </span>

                    <div className="space-y-0.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-[#DFE4D5] dark:bg-zinc-800 text-[#171A12] dark:text-zinc-200 font-medium">
                          {p.score_type}
                        </span>
                        <span className="text-[#6B7065]">{p.city} • {p.quota_2025} kontenjan</span>
                      </div>
                      <h4 className="text-sm sm:text-base font-semibold text-[#171A12] dark:text-zinc-100 group-hover:text-[#526B19] dark:group-hover:text-emerald-400 transition truncate">
                        {p.program_name}
                      </h4>
                      <p className="text-xs text-[#6B7065] dark:text-zinc-400 truncate">{p.university_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#D0D5C6] dark:border-zinc-800/60 shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] text-[#6B7065] block">2023 → 2025</span>
                      <div className="font-mono text-xs text-[#6B7065] dark:text-zinc-300">
                        {formatRank(p.rank_2023)} → <strong className="text-[#171A12] dark:text-zinc-100">{formatRank(p.rank_2025)}</strong>
                      </div>
                    </div>

                    <div className="text-right min-w-[90px]">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-medium ${
                          isGain
                            ? "bg-[#E5EDC8] dark:bg-emerald-500/12 text-[#526B19] dark:text-emerald-400"
                            : "bg-sky-500/12 dark:bg-sky-500/12 text-sky-700 dark:text-sky-400"
                        }`}
                      >
                        {isGain ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {isGain ? "+" : ""}
                        {p.change_pct.toFixed(1)}%
                      </span>
                      <span className="text-[11px] text-[#6B7065] block mt-0.5 font-mono">
                        {formatRank(Math.abs(p.rank_difference))} sıra {isGain ? "öne" : "aşağı"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}
    </div>
  );
};
