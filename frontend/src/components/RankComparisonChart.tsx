import React from "react";
import type { RecommendedProgram } from "../types";
import { formatRank } from "../api";
import { BarChart3, TrendingUp, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";

interface Props {
  studentRank: number;
  items: RecommendedProgram[];
  onSelectProgram?: (programCode: string) => void;
}

export const RankComparisonChart: React.FC<Props> = ({
  studentRank,
  items,
  onSelectProgram,
}) => {
  // Take top 6 programs with valid ranks
  const validItems = items
    .filter((it) => it.latest_rank && it.latest_rank > 0)
    .slice(0, 6);

  if (validItems.length === 0 || !studentRank) return null;

  // Calculate scaling min and max
  const allRanks = [studentRank, ...validItems.map((it) => it.latest_rank as number)];
  const minRank = Math.min(...allRanks) * 0.85;
  const maxRank = Math.max(...allRanks) * 1.15;
  const rankRange = maxRank - minRank || 1;

  const getPercent = (rank: number) => {
    // In YKS, lower rank is better (left side = top rank, right side = wider rank)
    return Math.max(2, Math.min(98, ((rank - minRank) / rankRange) * 100));
  };

  const studentPercent = getPercent(studentRank);

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <BarChart3 className="w-4 h-4" />
            </span>
            <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
              Sıralama Karşılaştırma & Güvenlik Spektrumu
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Başarı sıranın önerilen en yüksek eşleşmeli programlara göre göreli konumu ve güvenlik marjı
          </p>
        </div>

        {/* Candidate Benchmark Chip */}
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <span className="text-xs font-bold text-emerald-300">
            Senin Başarı Sıran: <strong className="text-white font-mono">{formatRank(studentRank)}</strong>
          </span>
        </div>
      </div>

      {/* Visual Axis Indicator */}
      <div className="relative pt-6 pb-2">
        <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 mb-2 px-1">
          <span className="flex items-center gap-1 text-white">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            Daha Üst / Rekabetçi Dilim (Küçük Sıralama)
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            Geniş / Güvenli Dilim (Büyük Sıralama)
          </span>
        </div>

        {/* Global Ruler Line */}
        <div className="relative h-2 w-full bg-black rounded-full border border-zinc-800">
          {/* Student Benchmark Marker on Ruler */}
          <div
            style={{ left: `${studentPercent}%` }}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none"
          >
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 ring-4 ring-emerald-500/40 shadow-lg shadow-emerald-500/50" />
          </div>
        </div>
      </div>

      {/* Program Comparison Bars */}
      <div className="space-y-4">
        {validItems.map((prog) => {
          const pRank = prog.latest_rank as number;
          const pPercent = getPercent(pRank);
          const diff = studentRank - pRank; // > 0 means student is behind (reach), < 0 means student is ahead (safe)
          const isAhead = diff < 0;
          const absDiff = Math.abs(diff);

          const barLeft = Math.min(studentPercent, pPercent);
          const barWidth = Math.max(2, Math.abs(studentPercent - pPercent));

          return (
            <div
              key={prog.program_code}
              className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 transition space-y-2 group"
            >
              {/* Top Row: Name, university, rank */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        prog.category === "reach"
                          ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                          : prog.category === "target"
                          ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
                          : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                      }`}
                    >
                      {prog.category_label}
                    </span>
                    <span className="font-bold text-white truncate group-hover:text-indigo-300 transition">
                      {prog.program_name}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {prog.university_name} • {prog.city || "Şehir belirtilmemiş"}
                  </p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                      {prog.latest_rank_year || 2025} Taban Sıra
                    </span>
                    <span className="text-xs font-mono font-bold text-white">
                      {formatRank(pRank)}
                    </span>
                  </div>

                  {onSelectProgram && (
                    <button
                      type="button"
                      onClick={() => onSelectProgram(prog.program_code)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition"
                      title="Detaylı XAI İncele"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Graphic Comparison Spectrum Row */}
              <div className="relative h-6 w-full bg-slate-900 rounded-lg overflow-hidden border border-slate-800/80 flex items-center px-1">
                {/* Distance Connector Bar */}
                <div
                  style={{
                    left: `${barLeft}%`,
                    width: `${barWidth}%`,
                  }}
                  className={`absolute h-2.5 rounded-full transition-all duration-300 ${
                    prog.category === "reach"
                      ? "bg-gradient-to-r from-amber-600 to-amber-500 shadow-sm shadow-amber-500/20"
                      : prog.category === "target"
                      ? "bg-gradient-to-r from-indigo-600 to-violet-500 shadow-sm shadow-indigo-500/20"
                      : "bg-gradient-to-r from-emerald-600 to-teal-500 shadow-sm shadow-emerald-500/20"
                  }`}
                />

                {/* Candidate Line */}
                <div
                  style={{ left: `${studentPercent}%` }}
                  className="absolute top-0 bottom-0 w-0.5 bg-indigo-400 z-10 shadow"
                />

                {/* Program Marker */}
                <div
                  style={{ left: `${pPercent}%` }}
                  className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-slate-950 z-20 ${
                    prog.category === "reach"
                      ? "bg-amber-400"
                      : prog.category === "target"
                      ? "bg-indigo-400"
                      : "bg-emerald-400"
                  }`}
                />
              </div>

              {/* Bottom Row: Delta interpretation */}
              <div className="flex items-center justify-between text-[11px] pt-0.5">
                <span className="text-slate-400">
                  {prog.category === "reach"
                    ? "Üst dilim hedefi: Sıralamanın önünde"
                    : prog.category === "target"
                    ? "İdeal hedef: Sıralama bandınla birebir örtüşüyor"
                    : "Güvenli liman: Sıralamanın belirgin gerisinde"}
                </span>

                <span
                  className={`font-mono font-bold ${
                    isAhead ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {isAhead ? `+${formatRank(absDiff)} sıra öndesin` : `-${formatRank(absDiff)} sıra geridesin`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Spectrum Guidance Note */}
      <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Açıklanabilir Karar Destek Bilgisi:</strong> Grafikte mor dikey çizgi senin başarı sıranı temsil eder.
          Yeşil çubuklar güvenli yerleşme payını, sarı çubuklar ise hedefin için gereken rekabet payını gösterir.
        </div>
      </div>
    </div>
  );
};
