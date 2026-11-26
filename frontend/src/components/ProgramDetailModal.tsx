import React, { useEffect, useState } from "react";
import type { Program, PredictionResponse, ExplanationResponse } from "../types";
import { getPrediction, generateExplanation, formatRank } from "../api";
import { ShapWaterfallChart } from "./ShapWaterfallChart";
import {
  X,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Sliders,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from "lucide-react";

interface Props {
  program: Program;
  studentRank?: number;
  onClose: () => void;
  onOpenSimulator?: (program: Program) => void;
}

export const ProgramDetailModal: React.FC<Props> = ({
  program,
  studentRank,
  onClose,
  onOpenSimulator,
}) => {
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [loadingPred, setLoadingPred] = useState<boolean>(true);
  const [predError, setPredError] = useState<string | null>(null);

  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [showFactors, setShowFactors] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setLoadingPred(true);
    setPredError(null);
    setExplanation(null);

    getPrediction(program.program_code)
      .then((data) => {
        if (isMounted) {
          setPrediction(data);
          setLoadingPred(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setPredError(err.message || "Tahmin bilgileri alınamadı.");
          setLoadingPred(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [program.program_code]);

  const handleGenerateAi = () => {
    setLoadingAi(true);
    setAiError(null);
    generateExplanation(program.program_code, studentRank)
      .then((res) => {
        setExplanation(res);
        setLoadingAi(false);
      })
      .catch((err) => {
        setAiError(err.message || "Değerlendirme alınamadı.");
        setLoadingAi(false);
      });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#171A12]/40 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-3xl bg-gradient-to-b from-[#F2F3EC] to-[#ECEEE3] dark:bg-none dark:bg-[#111114] border border-[#D0D5C6] dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
        <div className="sticky top-0 z-20 bg-[#F0F1E9]/95 dark:bg-[#111114]/95 backdrop-blur border-b border-[#D0D5C6] dark:border-zinc-800 px-5 py-4 flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-[#DFE4D5] dark:bg-zinc-800 text-[#171A12] dark:text-zinc-200 font-medium">
                {program.score_type}
              </span>
              <span className="font-mono text-[#6B7065]">{program.program_code}</span>
              {studentRank && (
                <span className="px-2 py-0.5 rounded bg-[#E5EDC8] dark:bg-emerald-500/12 text-[#526B19] dark:text-emerald-400 font-mono">
                  Senin Sıran: {formatRank(studentRank)}
                </span>
              )}
            </div>

            <h3 className="text-lg sm:text-xl font-semibold text-[#171A12] dark:text-zinc-100 leading-snug">
              {program.program_name}
            </h3>

            <p className="text-xs text-[#6B7065] dark:text-zinc-400">
              {program.university_name}
              {program.city && ` • ${program.city}`}
              {program.teaching_language && ` • ${program.teaching_language}`}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {program.official_url && (
              <a
                href={program.official_url}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-[#DFE4D5] dark:bg-zinc-900 hover:bg-[#DFE4D5] dark:hover:bg-zinc-800 border border-[#D0D5C6] dark:border-zinc-800 text-[#6B7065] dark:text-zinc-400 hover:text-[#171A12] dark:hover:text-zinc-100 transition"
                title="YÖK Atlas"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-[#DFE4D5] dark:bg-zinc-900 hover:bg-[#DFE4D5] dark:hover:bg-zinc-800 border border-[#D0D5C6] dark:border-zinc-800 text-[#6B7065] dark:text-zinc-400 hover:text-[#171A12] dark:hover:text-zinc-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-5 space-y-5">
          {loadingPred ? (
            <div className="py-12 text-center text-[#6B7065] dark:text-zinc-400">
              <div className="inline-block animate-spin rounded-full h-7 w-7 border-b-2 border-emerald-500 mb-2" />
              <p className="text-xs">Program verileri yükleniyor...</p>
            </div>
          ) : predError ? (
            <div className="p-4 rounded-xl bg-rose-500/12 dark:bg-rose-500/10 border border-rose-600/25 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{predError}</span>
            </div>
          ) : prediction?.status === "success" && prediction.inputs && prediction.predictions ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#E8EBE0] dark:bg-[#09090b] border border-[#D0D5C6] dark:border-zinc-800/80 rounded-xl p-3.5">
                  <span className="text-[11px] text-[#6B7065] block">
                    {prediction.inputs.input_rank_year || 2025} Taban Sıra
                  </span>
                  <span className="text-base font-mono font-semibold text-[#171A12] dark:text-zinc-100 mt-1 block">
                    {formatRank(prediction.inputs.previous_closing_rank)}
                  </span>
                </div>

                <div className="bg-[#E8EBE0] dark:bg-[#09090b] border border-[#D0D5C6] dark:border-zinc-800/80 rounded-xl p-3.5">
                  <span className="text-[11px] text-[#6B7065] block">Kontenjan</span>
                  <span className="text-base font-mono font-semibold text-[#171A12] dark:text-zinc-100 mt-1 block">
                    {formatRank(prediction.inputs.published_quota)} kişi
                  </span>
                </div>

                <div className="bg-[#E5EDC8] dark:bg-emerald-500/10 border border-[#C5D496] dark:border-emerald-500/25 rounded-xl p-3.5">
                  <span className="text-[11px] text-[#526B19] dark:text-emerald-400 block">
                    {prediction.target_year || 2026} Beklenen Sıra
                  </span>
                  <span className="text-base font-mono font-semibold text-[#526B19] dark:text-emerald-300 mt-1 block">
                    {formatRank(prediction.predictions.predicted_closing_rank)}
                  </span>
                  {prediction.predictions.prediction_interval && (
                    <span className="text-[10px] text-[#526B19]/85 dark:text-emerald-300/80 font-mono block mt-0.5">
                      {formatRank(prediction.predictions.prediction_interval.lower)} –{" "}
                      {formatRank(prediction.predictions.prediction_interval.upper)}
                    </span>
                  )}
                </div>

                <div className="bg-[#E8EBE0] dark:bg-[#09090b] border border-[#D0D5C6] dark:border-zinc-800/80 rounded-xl p-3.5">
                  <span className="text-[11px] text-[#6B7065] block">
                    {prediction.predictions.latest_actual_year || 2025} Gerçekleşen
                  </span>
                  <span className="text-base font-mono font-semibold text-[#171A12] dark:text-zinc-100 mt-1 block">
                    {prediction.predictions.latest_actual_closing_rank
                      ? formatRank(prediction.predictions.latest_actual_closing_rank)
                      : prediction.predictions.actual_closing_rank
                      ? formatRank(prediction.predictions.actual_closing_rank)
                      : "—"}
                  </span>
                </div>
              </div>

              <div className="bg-[#E8EBE0] dark:bg-[#09090b] border border-[#D0D5C6] dark:border-zinc-800/80 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-medium text-[#171A12] dark:text-zinc-100">
                      Danışman Değerlendirmesi
                    </h4>
                    <p className="text-xs text-[#6B7065] dark:text-zinc-400 mt-0.5">
                      {studentRank
                        ? `${formatRank(studentRank)} sıranız ve geçmiş veriler ışığında kişiselleştirilmiş yorum alın.`
                        : "Programın 2026 beklentisi ve tercih stratejisi hakkında yorum alın."}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {onOpenSimulator && (
                      <button
                        type="button"
                        onClick={() => onOpenSimulator(program)}
                        className="px-3 py-2 rounded-xl bg-[#F0F1E9] dark:bg-zinc-900 hover:bg-[#E5EDC8]/70 dark:hover:bg-zinc-800 border border-[#D0D5C6] dark:border-zinc-800 text-[#171A12] dark:text-zinc-200 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5 text-[#6B7065] dark:text-zinc-400" />
                        <span>Simülatör</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleGenerateAi}
                      disabled={loadingAi}
                      className="px-3.5 py-2 rounded-xl bg-[#C6F432] hover:bg-[#b5e422] text-[#171A12] font-semibold text-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{loadingAi ? "Hazırlanıyor..." : "Değerlendirme Al"}</span>
                    </button>
                  </div>
                </div>

                {aiError && (
                  <div className="p-3 rounded-lg bg-rose-500/12 dark:bg-rose-500/10 border border-rose-600/25 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs">
                    {aiError}
                  </div>
                )}

                {explanation && (
                  <div className="p-4 rounded-xl bg-[#F0F1E9] dark:bg-[#111114] border border-[#D0D5C6] dark:border-zinc-800 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-[#526B19] dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Danışman Özeti</span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#171A12] dark:text-zinc-200 leading-relaxed whitespace-pre-line">
                      {explanation.explanation}
                    </p>
                  </div>
                )}
              </div>

              {prediction.shap && (
                <div className="border border-[#D0D5C6] dark:border-zinc-800/80 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowFactors((v) => !v)}
                    className="w-full px-4 py-3 bg-[#E8EBE0] dark:bg-[#09090b] hover:bg-[#E5EDC8]/70 dark:hover:bg-zinc-900/70 flex items-center justify-between text-xs font-medium text-[#171A12] dark:text-zinc-200 transition cursor-pointer"
                  >
                    <span>Tahmin Nasıl Oluştu? (Detaylı Faktörler)</span>
                    {showFactors ? (
                      <ChevronUp className="w-4 h-4 text-[#6B7065]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#6B7065]" />
                    )}
                  </button>

                  {showFactors && (
                    <div className="p-4 border-t border-[#D0D5C6] dark:border-zinc-800/80 space-y-3">
                      <ShapWaterfallChart
                        steps={prediction.shap.waterfall_steps}
                        referenceValue={prediction.shap.reference_value}
                        finalPrediction={prediction.predictions.predicted_closing_rank}
                        verificationPassed={prediction.shap.verification_passed}
                      />
                      <p className="text-[11px] text-[#6B7065]">
                        Not: YKS sıralamasında sayı küçüldükçe başarı düzeyi yükselir.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : prediction?.message ? (
            <div className="p-4 rounded-xl bg-[#E8EBE0] dark:bg-[#09090b] border border-[#D0D5C6] dark:border-zinc-800 text-xs text-[#6B7065] dark:text-zinc-300">
              {prediction.message}
            </div>
          ) : null}

          <div className="border border-[#D0D5C6] dark:border-zinc-800/80 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              className="w-full px-4 py-3 bg-[#E8EBE0] dark:bg-[#09090b] hover:bg-[#E5EDC8]/70 dark:hover:bg-zinc-900/70 flex items-center justify-between text-xs font-medium text-[#171A12] dark:text-zinc-200 transition cursor-pointer"
            >
              <span>Geçmiş Yılların Kontenjan ve Sıralamaları</span>
              {showHistory ? (
                <ChevronUp className="w-4 h-4 text-[#6B7065]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#6B7065]" />
              )}
            </button>

            {showHistory && (
              <div className="p-4 border-t border-[#D0D5C6] dark:border-zinc-800/80 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#D0D5C6] dark:border-zinc-800 text-[#6B7065]">
                      <th className="py-2 px-2 font-medium">Yıl</th>
                      <th className="py-2 px-2 font-medium">Kontenjan</th>
                      <th className="py-2 px-2 font-medium">Taban Sıralama</th>
                      <th className="py-2 px-2 font-medium">Kaynak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D0D5C6] dark:divide-zinc-800/60 text-[#171A12] dark:text-zinc-200">
                    {program.history && program.history.length > 0 ? (
                      program.history.map((h) => (
                        <tr key={h.year}>
                          <td className="py-2 px-2 font-medium">{h.year}</td>
                          <td className="py-2 px-2 font-mono">
                            {h.published_quota ? `${formatRank(h.published_quota)} kişi` : "—"}
                          </td>
                          <td className="py-2 px-2 font-mono">
                            {h.closing_rank ? formatRank(h.closing_rank) : "Dolmadı"}
                          </td>
                          <td className="py-2 px-2 text-[#6B7065] dark:text-zinc-400">
                            {h.rank_source_url ? (
                              <a
                                href={h.rank_source_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#526B19] dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                              >
                                YÖK Atlas <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              h.quota_source || "Resmi Kılavuz"
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-3 text-center text-[#6B7065]">
                          Kayıt bulunamadı.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
