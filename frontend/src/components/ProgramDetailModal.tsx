import React, { useEffect, useState } from "react";
import type { Program, PredictionResponse, ExplanationResponse } from "../types";
import { getPrediction, generateExplanation, formatRank } from "../api";
import { ShapWaterfallChart } from "./ShapWaterfallChart";
import {
  X,
  ExternalLink,
  MapPin,
  Building2,
  Languages,
  GraduationCap,
  Sparkles,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Calendar,
  Layers,
  Sliders,
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
          setPredError(err.message || "Model tahmini alınamadı.");
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
        setAiError(err.message || "Açıklama üretilemedi.");
        setLoadingAi(false);
      });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Kod: {program.program_code}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200">
                {program.score_type}
              </span>
              {program.city && (
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {program.city}
                </span>
              )}
              {program.teaching_language && (
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 flex items-center gap-1">
                  <Languages className="w-3 h-3 text-slate-400" />
                  {program.teaching_language}
                </span>
              )}
              {program.education_type && (
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 flex items-center gap-1">
                  <GraduationCap className="w-3 h-3 text-slate-400" />
                  {program.education_type}
                </span>
              )}
              {studentRank && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono font-bold">
                  Senin Sıran: {formatRank(studentRank)}
                </span>
              )}
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {program.program_name}
            </h3>
            <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Building2 className="w-4 h-4 text-slate-500" />
              {program.university_name}
              {program.faculty && <span className="text-slate-500">• {program.faculty}</span>}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {program.official_url && (
              <a
                href={program.official_url}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                title="YÖK Atlas Sayfası"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Section 1: Historical Data */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              Geçmiş Yılların Kontenjan ve Taban Sıralama Geçmişi
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-700/60 text-slate-400 text-xs font-semibold">
                    <th className="py-2 px-3">Yıl</th>
                    <th className="py-2 px-3">Yayınlanan Kontenjan</th>
                    <th className="py-2 px-3">Gerçekleşen Taban Sıralama</th>
                    <th className="py-2 px-3">Kaynak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {program.history && program.history.length > 0 ? (
                    program.history.map((h) => (
                      <tr key={h.year} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-semibold text-white">{h.year}</td>
                        <td className="py-2.5 px-3 font-mono">
                          {h.published_quota ? `${formatRank(h.published_quota)} kişi` : "—"}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {h.closing_rank ? (
                            <span className="font-semibold text-indigo-300">{formatRank(h.closing_rank)}</span>
                          ) : (
                            <span className="text-slate-500 italic">Dolmadı / Açıklanmadı</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-xs text-slate-400">
                          {h.rank_source_url ? (
                            <a
                              href={h.rank_source_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-400 hover:underline flex items-center gap-1"
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
                      <td colSpan={4} className="py-3 text-center text-slate-500">
                        Geçmiş kayıt bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Prospective Prediction Model */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  {prediction?.model_label || "2026 YKS Taban Sıralaması Projeksiyonu"}
                </span>
                <h4 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-400" />
                  Gelecek Dönem Taban Sıralaması Projeksiyonu & XAI Analizi
                </h4>
              </div>

              {onOpenSimulator && (
                <button
                  type="button"
                  onClick={() => onOpenSimulator(program)}
                  className="px-3.5 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 text-violet-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  title="Kontenjan değişiminin taban sıralamaya etkisini simüle edin"
                >
                  <Sliders className="w-3.5 h-3.5 text-violet-400" />
                  <span>Ne Olur? (Simülatör)</span>
                </button>
              )}
            </div>

            {loadingPred ? (
              <div className="py-8 text-center text-slate-400">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-2"></div>
                <p className="text-sm">Model projeksiyonu ve SHAP değerleri hesaplanıyor...</p>
              </div>
            ) : predError ? (
              <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{predError}</span>
              </div>
            ) : prediction?.status === "unsupported_score_type" ? (
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm flex items-center gap-3">
                <HelpCircle className="w-6 h-6 flex-shrink-0 text-amber-400" />
                <div>
                  <strong className="block font-semibold">Desteklenmeyen Puan Türü</strong>
                  <p className="text-xs text-amber-200/80 mt-0.5">{prediction.message}</p>
                </div>
              </div>
            ) : prediction?.status === "missing_inputs" ? (
              <div className="p-4 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm flex items-center gap-3">
                <AlertCircle className="w-6 h-6 flex-shrink-0 text-slate-400" />
                <div>
                  <strong className="block font-semibold text-slate-200">Girdi Eksikliği</strong>
                  <p className="text-xs text-slate-400 mt-0.5">{prediction.message}</p>
                </div>
              </div>
            ) : prediction?.status === "success" && prediction.inputs && prediction.predictions ? (
              <div className="space-y-4">
                {/* Inputs & Outputs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">
                      Temel Model Girdisi
                    </span>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      {prediction.inputs.input_rank_year || "Son"} Gerçekleşen Sıralama
                    </span>
                    <span className="text-lg font-bold font-mono text-white mt-1 block">
                      {formatRank(prediction.inputs.previous_closing_rank)}
                    </span>
                    {prediction.inputs.rank_momentum_ratio && prediction.inputs.rank_momentum_ratio !== 1 && (
                      <span className="text-[10px] text-indigo-300 font-medium block mt-1">
                        Trend: {prediction.inputs.rank_momentum_ratio < 1 ? "▲ Talep Artışı" : "▼ Hafif Gevşeme"} ({prediction.inputs.rank_momentum_ratio.toFixed(2)}x)
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">
                      Kapasite Girdisi
                    </span>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      {prediction.inputs.input_quota_year || "Yayınlanan"} Kontenjanı
                    </span>
                    <span className="text-lg font-bold font-mono text-white mt-1 block">
                      {formatRank(prediction.inputs.published_quota)} kişi
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium block mt-1">
                      {prediction.inputs.quota_change_pct && Math.abs(prediction.inputs.quota_change_pct) > 0.05
                        ? `Kontenjan Hareketi: %${prediction.inputs.quota_change_pct > 0 ? "+" : ""}${prediction.inputs.quota_change_pct.toFixed(1)}`
                        : "Kontenjan Hareketi: Sabit (%0.0 Doğal Projeksiyon)"}
                    </span>
                  </div>

                  <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-lg p-3">
                    <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wide block">
                      LightGBM Projeksiyonu
                    </span>
                    <span className="text-xs text-indigo-300/80 block mt-0.5">
                      {prediction.target_year || 2026} Taban Sıra Tahmini
                    </span>
                    <span className="text-lg font-bold font-mono text-indigo-300 mt-1 block">
                      {formatRank(prediction.predictions.predicted_closing_rank)}
                    </span>
                    {prediction.predictions.prediction_interval && (
                      <span className="text-[10px] text-indigo-200/90 font-mono block mt-1 leading-tight">
                        %80 Güven Koridoru:<br />
                        <strong>{formatRank(prediction.predictions.prediction_interval.lower)}</strong> – <strong>{formatRank(prediction.predictions.prediction_interval.upper)}</strong> (±%{prediction.predictions.prediction_interval.margin_pct.toFixed(1)})
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">
                      Geçmiş Gerçekleşme
                    </span>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      {prediction.predictions.latest_actual_year || 2025} Taban Başarı Sırası
                    </span>
                    <span className="text-lg font-bold font-mono text-white mt-1 block">
                      {prediction.predictions.latest_actual_closing_rank
                        ? formatRank(prediction.predictions.latest_actual_closing_rank)
                        : prediction.predictions.actual_closing_rank
                        ? formatRank(prediction.predictions.actual_closing_rank)
                        : "—"}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400 block mt-0.5">
                      Resmi YÖK Atlas Verisi
                    </span>
                  </div>
                </div>

                {/* Section 3: Bu tahmin nasıl oluştu? (SHAP Waterfall) */}
                {prediction.shap && (
                  <div className="mt-6">
                    <div className="mb-2">
                      <h5 className="text-base font-bold text-white flex items-center gap-2">
                        <Layers className="w-5 h-5 text-indigo-400" />
                        Bu tahmin nasıl oluştu?
                      </h5>
                    </div>

                    <ShapWaterfallChart
                      steps={prediction.shap.waterfall_steps}
                      referenceValue={prediction.shap.reference_value}
                      finalPrediction={prediction.predictions.predicted_closing_rank}
                      verificationPassed={prediction.shap.verification_passed}
                    />

                    {/* Educational note on YKS ranking direction */}
                    <div className="mt-3 p-3.5 rounded-lg bg-sky-950/20 border border-sky-800/30 text-xs text-sky-200/90 leading-relaxed">
                      💡 <strong>YKS Sıralaması Yorum Rehberi:</strong> YKS başarı sıralamasında sayı küçüldükçe öğrenci
                      daha üst ve daha rekabetçi bir dilime yerleşir. Dolayısıyla negatif bir etki payı (mavi yön),
                      sıralamayı referans başlangıç değerinden daha rekabetçi (daha iyi) bir başarı düzeyine çekmiştir.
                    </div>
                  </div>
                )}

                {/* Section 4: OpenAI Explanation Button & Panel */}
                <div className="mt-6 pt-5 border-t border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <h5 className="text-sm font-bold text-white tracking-wide">
                          Uzman Yapay Zeka Rehberlik Değerlendirmesi
                        </h5>
                      </div>
                      <p className="text-xs text-slate-300">
                        {studentRank
                          ? `2026 taban sıralaması öngörüsünü ve ${formatRank(studentRank)} olan sıralaman için yerleşme şansını samimi bir rehber diliyle özetleyin.`
                          : "2026 taban sıralaması öngörüsünü, geçmiş yıl eğilimlerini ve tercih listesi stratejisini samimi bir rehber diliyle özetleyin."}
                      </p>
                    </div>

                    <button
                      onClick={handleGenerateAi}
                      disabled={loadingAi}
                      className="self-start sm:self-center flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/25 transition disabled:opacity-50 cursor-pointer active:scale-95"
                    >
                      {loadingAi ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Rehber Analizi Hazırlanıyor...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          <span>Uzman Rehberlik & Yapay Zeka Analizi Al</span>
                        </>
                      )}
                    </button>
                  </div>

                  {aiError && (
                    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{aiError}</span>
                    </div>
                  )}

                  {explanation && (
                    <div className="p-5 rounded-2xl bg-slate-900/90 border border-indigo-500/30 shadow-inner space-y-3 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between text-xs text-slate-400 pb-2.5 border-b border-slate-800">
                        <span className="flex items-center gap-1.5 font-bold text-indigo-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          {explanation.source === "openai" ? "Yapay Zeka Rehberlik Danışmanı Değerlendirmesi" : "Doğrulanmış Uzman Rehberlik Analizi"}
                        </span>
                        {explanation.model && (
                          <span className="text-[11px] font-mono text-slate-500">{explanation.model}</span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-slate-100 leading-relaxed whitespace-pre-line">
                        {explanation.explanation}
                      </p>

                      {explanation.notice && (
                        <p className="text-[11px] text-amber-400/90 italic pt-1">{explanation.notice}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
