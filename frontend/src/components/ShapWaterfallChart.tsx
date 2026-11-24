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

  // Find min and max for chart scaling
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
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h4 className="text-base font-semibold text-white flex items-center gap-2">
            <span>SHAP Katkı Analizi (Waterfall)</span>
            {verificationPassed && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Matematiksel Doğrulandı
              </span>
            )}
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Başlangıç referans değerinden nihai model projeksiyonuna giden adım adım faktör etkileri
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
            <span className="text-zinc-300">Daha Rekabetçi (Sıralamayı Küçülten)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500 inline-block"></span>
            <span className="text-zinc-300">Daha Az Rekabetçi (Sıralamayı Büyüten)</span>
          </div>
        </div>
      </div>

      {/* Waterfall steps list with visual bar alignment */}
      <div className="space-y-4">
        {steps.map((step, idx) => {
          const isBase = step.step === "base_value";
          const isFinal = step.step === "final_prediction";
          const isNegative = step.change < 0;

          // Compute bar position on scale
          let barLeft = 0;
          let barWidth = 0;
          let barColor = "bg-emerald-600";

          if (isBase) {
            barLeft = 0;
            barWidth = getPercent(step.value ?? step.cumulative);
            barColor = "bg-zinc-600";
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
            <div key={idx} className="group">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-zinc-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-zinc-850 text-zinc-400 flex items-center justify-center text-[10px] font-mono">
                    {idx + 1}
                  </span>
                  {step.label}
                  {step.input_val !== undefined && (
                    <span className="text-zinc-400 font-normal">
                      (Değer: <strong className="text-zinc-200">{formatRank(step.input_val)}</strong>)
                    </span>
                  )}
                </span>
                <span className="font-mono text-sm font-semibold">
                  {isBase && <span className="text-zinc-300">{formatRank(step.value)}</span>}
                  {isFinal && <span className="text-emerald-400 text-base font-extrabold">{formatRank(step.value)}</span>}
                  {!isBase && !isFinal && (
                    <span className={`flex items-center gap-0.5 ${isNegative ? "text-emerald-400" : "text-amber-400"}`}>
                      {isNegative ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      {step.change > 0 ? `+${formatRank(step.change)}` : formatRank(step.change)}
                    </span>
                  )}
                </span>
              </div>

              {/* Visual Horizontal Gauge Bar */}
              <div className="relative h-6 bg-slate-800/80 rounded overflow-hidden flex items-center">
                {/* Connector tick or background grid */}
                <div
                  className="absolute top-0 bottom-0 border-l border-slate-700 pointer-events-none"
                  style={{ left: `${getPercent(referenceValue)}%` }}
                  title="Referans Seviye"
                />

                <div
                  className={`absolute h-full rounded transition-all duration-300 ${barColor}`}
                  style={{
                    left: `${barLeft}%`,
                    width: `${barWidth}%`,
                  }}
                />

                <div className="relative z-10 w-full px-3 flex justify-between text-[11px] font-mono text-white/90 drop-shadow">
                  <span></span>
                  <span>Kümülatif: {formatRank(step.cumulative)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <span>
          Referans Taban ($E[f(X)]$): <strong className="text-slate-200 font-mono">{formatRank(referenceValue)}</strong>
        </span>
        <span className="text-right">
          2025 Model Tahmini ($f(X)$): <strong className="text-indigo-400 font-mono text-sm">{formatRank(finalPrediction)}</strong>
        </span>
      </div>
    </div>
  );
};
