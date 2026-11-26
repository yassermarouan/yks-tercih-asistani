import React, { useState, useEffect } from "react";
import type { Program, RecommendedProgram, SimulationResponse, ExplanationResponse } from "../types";
import { simulateProgramQuota, generateSimulationExplanation, formatRank } from "../api";
import {
  X,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";

interface Props {
  program: Program | RecommendedProgram;
  studentRank?: number;
  onClose: () => void;
}

export const WhatIfSimulatorModal: React.FC<Props> = ({
  program,
  studentRank,
  onClose,
}) => {
  const history = program.history || [];
  const sortedHist = [...history].sort((a, b) => b.year - a.year);
  const latestRec = sortedHist[0];
  const initialQuota =
    latestRec?.published_quota ||
    ("latest_quota" in program && program.latest_quota ? program.latest_quota : 50);

  const [simulatedQuota, setSimulatedQuota] = useState<number>(initialQuota);
  const [debouncedQuota, setDebouncedQuota] = useState<number>(initialQuota);
  const [simData, setSimData] = useState<SimulationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuota(simulatedQuota);
      setExplanation(null);
      setAiError(null);
    }, 150);
    return () => clearTimeout(timer);
  }, [simulatedQuota]);

  const handleGenerateAi = () => {
    setLoadingAi(true);
    setAiError(null);
    generateSimulationExplanation(program.program_code, debouncedQuota, studentRank)
      .then((res) => {
        setExplanation(res);
        setLoadingAi(false);
      })
      .catch((err) => {
        setAiError(err.message || "Açıklama üretilemedi.");
        setLoadingAi(false);
      });
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    simulateProgramQuota(program.program_code, debouncedQuota, studentRank)
      .then((res) => {
        if (isMounted) {
          setSimData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Simülasyon hesaplanamadı.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [program.program_code, debouncedQuota, studentRank]);

  const minQuota = Math.max(5, initialQuota - 40);
  const maxQuota = initialQuota + 60;
  const quotaDelta = simulatedQuota - initialQuota;

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-[#171A12]/40 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#F2F3EC] to-[#ECEEE3] dark:bg-none dark:bg-[#111114] border border-[#D0D5C6] dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
        <div className="sticky top-0 z-20 bg-[#F0F1E9]/95 dark:bg-[#111114]/95 backdrop-blur border-b border-[#D0D5C6] dark:border-zinc-800 px-5 py-4 flex items-start justify-between gap-4">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[11px] font-medium text-[#526B19] dark:text-emerald-400">
              Kontenjan Simülatörü
            </span>
            <h3 className="text-lg font-semibold text-[#171A12] dark:text-zinc-100 leading-snug">
              {program.program_name}
            </h3>
            <p className="text-xs text-[#6B7065] dark:text-zinc-400">
              {program.university_name}
              {program.city && ` • ${program.city}`}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-[#DFE4D5] dark:bg-zinc-900 hover:bg-[#DFE4D5] dark:hover:bg-zinc-800 border border-[#D0D5C6] dark:border-zinc-800 text-[#6B7065] dark:text-zinc-400 hover:text-[#171A12] dark:hover:text-zinc-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-5">
          <div className="bg-[#E8EBE0] dark:bg-[#09090b] p-4 rounded-xl border border-[#D0D5C6] dark:border-zinc-800/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="text-sm font-medium text-[#171A12] dark:text-zinc-100 block">
                  Simüle Edilen Kontenjan
                </label>
                <p className="text-xs text-[#6B7065] mt-0.5">
                  Kontenjan artar veya azalırsa beklenen sıralamanın nasıl değişeceğini test edin.
                </p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <div className="flex items-center gap-1 bg-[#F0F1E9] dark:bg-[#111114] border border-[#D0D5C6] dark:border-zinc-800 px-3 py-1.5 rounded-lg">
                  <input
                    type="number"
                    min={minQuota}
                    max={maxQuota}
                    value={simulatedQuota}
                    onChange={(e) => setSimulatedQuota(Math.max(5, Number(e.target.value) || 5))}
                    className="w-14 bg-transparent text-right font-mono font-semibold text-[#171A12] dark:text-zinc-100 text-sm focus:outline-none"
                  />
                  <span className="text-xs text-[#6B7065]">kişi</span>
                </div>

                {simulatedQuota !== initialQuota && (
                  <button
                    type="button"
                    onClick={() => setSimulatedQuota(initialQuota)}
                    className="p-2 rounded-lg bg-[#F0F1E9] dark:bg-zinc-900 hover:bg-[#E5EDC8]/70 dark:hover:bg-zinc-800 border border-[#D0D5C6] dark:border-zinc-800 text-[#6B7065] dark:text-zinc-300 transition cursor-pointer"
                    title="Sıfırla"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <input
                type="range"
                min={minQuota}
                max={maxQuota}
                value={simulatedQuota}
                onChange={(e) => setSimulatedQuota(Number(e.target.value))}
                className="w-full h-2 bg-[#D0D5C6] dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-600 dark:accent-emerald-500"
              />
              <div className="flex justify-between text-[11px] font-mono text-[#6B7065]">
                <span>{minQuota}</span>
                <span>Mevcut: <strong className="text-[#171A12] dark:text-zinc-200">{initialQuota}</strong></span>
                <span>{maxQuota}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#D0D5C6] dark:border-zinc-800/60">
              {[-20, -10, -5, 0, 5, 10, 20, 30].map((step) => {
                const targetVal = initialQuota + step;
                if (targetVal < 5) return null;
                const isActive = simulatedQuota === targetVal;
                return (
                  <button
                    key={step}
                    type="button"
                    onClick={() => setSimulatedQuota(targetVal)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition cursor-pointer ${
                      isActive
                        ? "bg-[#C6F432] text-[#171A12] font-semibold"
                        : "bg-[#F0F1E9] dark:bg-zinc-900 hover:bg-[#E5EDC8]/70 dark:hover:bg-zinc-800 text-[#171A12] dark:text-zinc-300 border border-[#D0D5C6] dark:border-zinc-800"
                    }`}
                  >
                    {step === 0 ? "Mevcut" : step > 0 ? `+${step}` : step}
                  </button>
                );
              })}
            </div>
          </div>

          {error ? (
            <div className="p-4 rounded-xl bg-rose-500/12 dark:bg-rose-500/10 border border-rose-600/25 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : loading && !simData ? (
            <div className="py-10 text-center text-[#6B7065] dark:text-zinc-400">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mb-2" />
              <p className="text-xs">Simülasyon hesaplanıyor...</p>
            </div>
          ) : simData?.status === "unsupported_score_type" ? (
            <div className="p-4 rounded-xl bg-amber-500/12 dark:bg-amber-500/10 border border-amber-600/25 dark:border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>{simData.message}</span>
            </div>
          ) : simData?.status === "success" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#E8EBE0] dark:bg-[#09090b] p-3.5 rounded-xl border border-[#D0D5C6] dark:border-zinc-800/80">
                  <span className="text-[11px] text-[#6B7065] block">Mevcut Tahmin</span>
                  <span className="text-xs text-[#6B7065] dark:text-zinc-400">{simData.original_quota} kişi</span>
                  <span className="text-lg font-mono font-semibold text-[#171A12] dark:text-zinc-200 block mt-1">
                    {formatRank(simData.baseline_predicted_rank)}
                  </span>
                </div>

                <div className="bg-[#E5EDC8] dark:bg-emerald-500/10 p-3.5 rounded-xl border border-[#C5D496] dark:border-emerald-500/25">
                  <span className="text-[11px] text-[#526B19] dark:text-emerald-400 block">Simülasyon Sonucu</span>
                  <span className="text-xs text-[#526B19]/85 dark:text-emerald-300/80">{simData.simulated_quota} kişi</span>
                  <span className="text-lg font-mono font-semibold text-[#526B19] dark:text-emerald-300 block mt-1">
                    {formatRank(simData.simulated_predicted_rank)}
                  </span>
                </div>

                <div className="bg-[#E8EBE0] dark:bg-[#09090b] p-3.5 rounded-xl border border-[#D0D5C6] dark:border-zinc-800/80">
                  <span className="text-[11px] text-[#6B7065] block">Sıralama Farkı</span>
                  <span className="text-xs text-[#6B7065] dark:text-zinc-400">
                    {quotaDelta > 0
                      ? `+${quotaDelta} kişi`
                      : quotaDelta < 0
                      ? `${quotaDelta} kişi`
                      : "Değişim yok"}
                  </span>
                  <div className="flex items-center gap-1 mt-1">
                    {simData.rank_delta && simData.rank_delta > 0 ? (
                      <>
                        <TrendingUp className="w-4 h-4 text-[#526B19] dark:text-emerald-400" />
                        <span className="text-base font-mono font-semibold text-[#526B19] dark:text-emerald-400">
                          +{formatRank(Math.abs(simData.rank_delta))}
                        </span>
                      </>
                    ) : simData.rank_delta && simData.rank_delta < 0 ? (
                      <>
                        <TrendingDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-base font-mono font-semibold text-amber-600 dark:text-amber-400">
                          -{formatRank(Math.abs(simData.rank_delta))}
                        </span>
                      </>
                    ) : (
                      <span className="text-base font-mono text-[#6B7065]">—</span>
                    )}
                  </div>
                </div>
              </div>

              {simData.candidate_impact && (
                <div className="p-3.5 rounded-xl bg-[#E8EBE0] dark:bg-[#09090b] border border-[#D0D5C6] dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-[#6B7065] dark:text-zinc-400">Senin Sıran İçin Durum: </span>
                    <strong className="text-[#171A12] dark:text-zinc-100">
                      {simData.candidate_impact.base_category_label} → {simData.candidate_impact.simulated_category_label}
                    </strong>
                  </div>
                  <span
                    className={`font-mono font-semibold ${
                      simData.candidate_impact.simulated_distance < 0
                        ? "text-[#526B19] dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {simData.candidate_impact.simulated_distance < 0
                      ? `+${formatRank(-simData.candidate_impact.simulated_distance)} sıra öndesin`
                      : `-${formatRank(simData.candidate_impact.simulated_distance)} sıra geridesin`}
                  </span>
                </div>
              )}

              <div className="p-4 rounded-xl bg-[#E8EBE0] dark:bg-[#09090b] border border-[#D0D5C6] dark:border-zinc-800/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-xs text-[#6B7065] dark:text-zinc-300 leading-relaxed">
                    {simData.interpretation}
                  </p>
                  <button
                    type="button"
                    onClick={handleGenerateAi}
                    disabled={loadingAi}
                    className="shrink-0 px-3.5 py-2 rounded-xl bg-[#C6F432] hover:bg-[#b5e422] text-[#171A12] font-semibold text-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{loadingAi ? "Hazırlanıyor..." : "Danışman Yorumu Al"}</span>
                  </button>
                </div>

                {aiError && <p className="text-xs text-rose-600 dark:text-rose-400">{aiError}</p>}

                {explanation && (
                  <div className="p-3.5 rounded-xl bg-[#F0F1E9] dark:bg-[#111114] border border-[#D0D5C6] dark:border-zinc-800 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-[#526B19] dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Danışman Değerlendirmesi</span>
                    </div>
                    <p className="text-xs text-[#171A12] dark:text-zinc-200 leading-relaxed whitespace-pre-line">
                      {explanation.explanation}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
