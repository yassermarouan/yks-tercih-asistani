import React from "react";

interface Props {
  totalCount: number;
  countReach: number;
  countTarget: number;
  countSafe: number;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
}

export const PreferencePortfolioChart: React.FC<Props> = ({
  totalCount,
  countReach,
  countTarget,
  countSafe,
  selectedCategory,
  onSelectCategory,
}) => {
  if (totalCount === 0) return null;

  const pctTarget = Math.round((countTarget / totalCount) * 100) || 0;
  const pctReach = Math.round((countReach / totalCount) * 100) || 0;
  const pctSafe = Math.round((countSafe / totalCount) * 100) || 0;

  return (
    <div className="bg-gradient-to-b from-[#F2F3EC] to-[#ECEEE3] dark:bg-none dark:bg-[#111114] border border-[#D0D5C6] dark:border-zinc-800/80 rounded-2xl p-5 space-y-5 shadow-[0_2px_10px_rgba(23,26,18,0.04)] dark:shadow-none">
      <div>
        <h3 className="text-sm font-semibold text-[#171A12] dark:text-zinc-100">Tercih Dağılım Özeti</h3>
        <p className="text-xs text-[#6B7065] mt-0.5">
          Toplam {totalCount} programın sıralamana göre dağılımı
        </p>
      </div>

      <div className="h-3 w-full bg-[#DFE4D5] dark:bg-[#09090b] rounded-full overflow-hidden flex border border-[#D0D5C6] dark:border-zinc-800/80">
        {pctReach > 0 && (
          <div
            style={{ width: `${pctReach}%` }}
            className="h-full bg-amber-500 transition-all duration-300 cursor-pointer"
            onClick={() => onSelectCategory("reach")}
            title={`Daha Rekabetçi: %${pctReach}`}
          />
        )}
        {pctTarget > 0 && (
          <div
            style={{ width: `${pctTarget}%` }}
            className="h-full bg-emerald-500 transition-all duration-300 cursor-pointer"
            onClick={() => onSelectCategory("target")}
            title={`Sıralamana Yakın: %${pctTarget}`}
          />
        )}
        {pctSafe > 0 && (
          <div
            style={{ width: `${pctSafe}%` }}
            className="h-full bg-teal-500 transition-all duration-300 cursor-pointer"
            onClick={() => onSelectCategory("safe")}
            title={`Daha Ulaşılabilir: %${pctSafe}`}
          />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => onSelectCategory(selectedCategory === "reach" ? "all" : "reach")}
          className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
            selectedCategory === "reach"
              ? "bg-amber-500/12 dark:bg-amber-500/12 border-amber-600/35 dark:border-amber-500/40"
              : "bg-[#E8EBE0] dark:bg-[#09090b] border-[#D0D5C6] dark:border-zinc-800/80 hover:border-[#B6BEA9] dark:hover:border-zinc-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Daha Rekabetçi</span>
            <span className="text-sm font-mono font-semibold text-amber-600 dark:text-amber-400">%{pctReach}</span>
          </div>
          <p className="text-[11px] text-[#6B7065] mt-1">
            {countReach} program • 1–6. sıralar için uygun
          </p>
        </button>

        <button
          type="button"
          onClick={() => onSelectCategory(selectedCategory === "target" ? "all" : "target")}
          className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
            selectedCategory === "target"
              ? "bg-[#E5EDC8] dark:bg-emerald-500/12 border-[#B8CB82] dark:border-emerald-500/40"
              : "bg-[#E8EBE0] dark:bg-[#09090b] border-[#D0D5C6] dark:border-zinc-800/80 hover:border-[#B6BEA9] dark:hover:border-zinc-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#526B19] dark:text-emerald-300">Sıralamana Yakın</span>
            <span className="text-sm font-mono font-semibold text-[#526B19] dark:text-emerald-400">%{pctTarget}</span>
          </div>
          <p className="text-[11px] text-[#6B7065] mt-1">
            {countTarget} program • 7–18. sıralar için uygun
          </p>
        </button>

        <button
          type="button"
          onClick={() => onSelectCategory(selectedCategory === "safe" ? "all" : "safe")}
          className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
            selectedCategory === "safe"
              ? "bg-teal-500/12 dark:bg-teal-500/12 border-teal-300 dark:border-teal-500/40"
              : "bg-[#E8EBE0] dark:bg-[#09090b] border-[#D0D5C6] dark:border-zinc-800/80 hover:border-[#B6BEA9] dark:hover:border-zinc-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-teal-700 dark:text-teal-300">Daha Ulaşılabilir</span>
            <span className="text-sm font-mono font-semibold text-teal-600 dark:text-teal-400">%{pctSafe}</span>
          </div>
          <p className="text-[11px] text-[#6B7065] mt-1">
            {countSafe} program • 19–24. sıralar için uygun
          </p>
        </button>
      </div>
    </div>
  );
};
