import React from "react";
import type { WaterfallStep } from "../types";
import { formatRank } from "../api";
import { ArrowDownRight, ArrowUpRight, CheckCircle2 } from "lucide-react";

interface Props {
  steps: WaterfallStep[];
  referenceValue: number;
  finalPrediction: number;
  verificationPassed: boolean;
}

export const ShapWaterfallChart: React.FC<Props> = ({
  steps,
  referenceValue,
  finalPrediction,
  verificationPassed,
}) => {
  if (!steps || steps.length === 0) return null;

  const allValues = [
    referenceValue,
    finalPrediction,
    ...steps.map((s) => s.cumulative),
  ];
  const minVal = Math.min(...allValues) * 0.9;
  const maxVal = Math.max(...allValues) * 1.05;
  const range = maxVal - minVal || 1;

  const getPercent = (val: number) => {
    return Math.max(0, Math.min(100, ((val - minVal) / range) * 100));
  };

  return (
    <div className="bg-[#E8EBE0] dark:bg-[#09090b] border border-[#D0D5C6] dark:border-zinc-800/80 rounded-xl p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-medium text-[#171A12] dark:text-zinc-100 flex items-center gap-2">
            <span>Sıralamayı Etkileyen Faktörler</span>
            {verificationPassed && (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-[#E5EDC8] dark:bg-emerald-500/10 text-[#526B19] dark:text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                Doğrulandı
              </span>
            )}
          </h4>
          <p className="text-[11px] text-[#6B7065] mt-0.5">
            Başlangıç ortalamasından beklenen sıralamaya adım adım etki payları
          </p>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-[#6B7065] dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
            Öne Çeken
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
            Geriye Çeken
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step, idx) => {
          const isBase = step.step === "base_value";
          const isFinal = step.step === "final_prediction";
          const isNegative = step.change < 0;

          let barLeft = 0;
          let barWidth = 0;
          let barColor = "bg-[#C6F432]";

          if (isBase) {
            barLeft = 0;
            barWidth = getPercent(step.value ?? step.cumulative);
            barColor = "bg-zinc-400 dark:bg-zinc-600";
          } else if (isFinal) {
            barLeft = 0;
            barWidth = getPercent(step.value ?? step.cumulative);
            barColor = "bg-emerald-500";
          } else {
            const startVal = idx > 0 ? steps[idx - 1].cumulative : referenceValue;
            const endVal = step.cumulative;
            const startPct = getPercent(startVal);
            const endPct = getPercent(endVal);

            barLeft = Math.min(startPct, endPct);
            barWidth = Math.max(1.5, Math.abs(endPct - startPct));
            barColor = isNegative ? "bg-emerald-500" : "bg-amber-500";
          }

          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#171A12] dark:text-zinc-300 font-medium">
                  {step.label}
                  {step.input_val !== undefined && (
                    <span className="text-[#6B7065] font-normal ml-1.5">
                      ({formatRank(step.input_val)})
                    </span>
                  )}
                </span>
                <span className="font-mono font-medium">
                  {isBase && <span className="text-[#6B7065] dark:text-zinc-400">{formatRank(step.value)}</span>}
                  {isFinal && (
                    <span className="text-[#526B19] dark:text-emerald-400 font-semibold">
                      {formatRank(step.value)}
                    </span>
                  )}
                  {!isBase && !isFinal && (
                    <span
                      className={`inline-flex items-center gap-0.5 ${
                        isNegative
                          ? "text-[#526B19] dark:text-emerald-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {isNegative ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                      {step.change > 0 ? `+${formatRank(step.change)}` : formatRank(step.change)}
                    </span>
                  )}
                </span>
              </div>

              <div className="relative h-5 bg-[#D0D5C6] dark:bg-zinc-900 rounded overflow-hidden flex items-center">
                <div
                  className={`absolute h-full rounded ${barColor}`}
                  style={{ left: `${barLeft}%`, width: `${barWidth}%` }}
                />
                <div className="relative z-10 w-full px-2.5 flex justify-end text-[10px] font-mono text-[#171A12] dark:text-zinc-200 font-medium">
                  <span>{formatRank(step.cumulative)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-3 border-t border-[#D0D5C6] dark:border-zinc-800/70 flex flex-wrap items-center justify-between text-[11px] text-[#6B7065] dark:text-zinc-400 gap-2">
        <span>
          Başlangıç Ortalaması: <strong className="text-[#171A12] dark:text-zinc-200 font-mono">{formatRank(referenceValue)}</strong>
        </span>
        <span>
          Beklenen Sıralama: <strong className="text-[#526B19] dark:text-emerald-400 font-mono">{formatRank(finalPrediction)}</strong>
        </span>
      </div>
    </div>
  );
};
