import React from "react";
import type { RecommendedProgram } from "../types";
import { formatRank } from "../api";
import { ArrowRight } from "lucide-react";

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
  const validItems = items
    .filter((it) => it.latest_rank && it.latest_rank > 0)
    .slice(0, 6);

  if (validItems.length === 0 || !studentRank) return null;

  const allRanks = [studentRank, ...validItems.map((it) => it.latest_rank as number)];
  const minRank = Math.min(...allRanks) * 0.85;
  const maxRank = Math.max(...allRanks) * 1.15;
  const rankRange = maxRank - minRank || 1;

  const getPercent = (rank: number) => {
    return Math.max(2, Math.min(98, ((rank - minRank) / rankRange) * 100));
  };

  const studentPercent = getPercent(studentRank);

  return (
    <div className="bg-gradient-to-b from-[#F2F3EC] to-[#ECEEE3] dark:bg-none dark:bg-[#111114] border border-[#D0D5C6] dark:border-zinc-800/80 rounded-2xl p-5 space-y-4 shadow-[0_2px_10px_rgba(23,26,18,0.04)] dark:shadow-none">
      <div>
        <h3 className="text-sm font-semibold text-[#171A12] dark:text-zinc-100">
          Sıralama Konumu Karşılaştırması
        </h3>
        <p className="text-xs text-[#6B7065] mt-0.5">
          Senin sıran ({formatRank(studentRank)}) ile öne çıkan programların taban sıraları
        </p>
      </div>

      <div className="space-y-3">
        {validItems.map((prog) => {
          const pRank = prog.latest_rank as number;
          const pPercent = getPercent(pRank);
          const diff = studentRank - pRank;
          const isAhead = diff < 0;
          const absDiff = Math.abs(diff);

          const barLeft = Math.min(studentPercent, pPercent);
          const barWidth = Math.max(2, Math.abs(studentPercent - pPercent));

          return (
            <div
              key={prog.program_code}
              className="p-3 rounded-xl bg-[#E8EBE0] dark:bg-[#09090b] border border-[#D0D5C6] dark:border-zinc-800/70 space-y-2"
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <span className="font-medium text-[#171A12] dark:text-zinc-100 truncate block">
                    {prog.program_name}
                  </span>
                  <span className="text-[11px] text-[#6B7065] truncate block">
                    {prog.university_name}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-xs text-[#171A12] dark:text-zinc-300">
                    {formatRank(pRank)}
                  </span>
                  {onSelectProgram && (
                    <button
                      type="button"
                      onClick={() => onSelectProgram(prog.program_code)}
                      className="p-1 rounded-md bg-[#F0F1E9] dark:bg-zinc-900 hover:bg-[#E5EDC8]/70 dark:hover:bg-zinc-800 border border-[#D0D5C6] dark:border-zinc-800 text-[#6B7065] hover:text-[#171A12] dark:hover:text-zinc-100 transition cursor-pointer"
                      title="İncele"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="relative h-4 w-full bg-[#D0D5C6] dark:bg-zinc-900 rounded-md overflow-hidden flex items-center">
                <div
                  style={{ left: `${barLeft}%`, width: `${barWidth}%` }}
                  className={`absolute h-2 rounded-full ${
                    prog.category === "reach"
                      ? "bg-amber-500"
                      : prog.category === "target"
                      ? "bg-emerald-500"
                      : "bg-teal-500"
                  }`}
                />
                <div
                  style={{ left: `${studentPercent}%` }}
                  className="absolute top-0 bottom-0 w-0.5 bg-[#171A12] dark:bg-white z-10"
                  title={`Senin sıran: ${formatRank(studentRank)}`}
                />
                <div
                  style={{ left: `${pPercent}%` }}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-zinc-700 dark:bg-zinc-300 border border-white dark:border-zinc-950 z-20"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#6B7065]">
                <span>{prog.category_label}</span>
                <span
                  className={`font-mono ${
                    isAhead
                      ? "text-[#526B19] dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {isAhead ? `+${formatRank(absDiff)} sıra öndesin` : `-${formatRank(absDiff)} sıra geridesin`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
