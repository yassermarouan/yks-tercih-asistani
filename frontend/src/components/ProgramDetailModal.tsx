import React, { useEffect, useState } from "react";
import type { Program, PredictionResponse, ExplanationResponse } from "../types";
import { getPrediction, generateExplanation, formatRank } from "../api";
import {
  X,
  ExternalLink,
  MapPin,
  Calendar,
  Sliders,
  CheckCircle2,
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
          setPredError(err.message || "Tahmin verileri yüklenemedi.");
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
        setAiError(err.message || "Rehberlik değerlendirmesi alınamadı.");
        setLoadingAi(false);
      });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-100 px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                {program.score_type}
              </span>
              <span className="text-xs font-mono text-slate-500">
                Kod: {program.program_code}
              </span>
              {program.city && (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {program.city}
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {program.program_name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              {program.university_name} {program.faculty ? `• ${program.faculty}` : ""}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Section 1: 2026 Expected Rank Card */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                  2026 YKS Tahmini
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Beklenen Taban Sıralaması
                </h3>
              </div>

              {onOpenSimulator && (
                <button
                  type="button"
                  onClick={() => onOpenSimulator(program)}
                  className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Sliders className="w-3.5 h-3.5 text-slate-500" />
                  <span>Kontenjan Simülatörü</span>
                </button>
              )}
            </div>

            {loadingPred ? (
              <div className="py-6 text-center text-slate-500">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-blue-600 mb-2" />
                <p className="text-xs">Tahmin hesaplanıyor...</p>
              </div>
            ) : predError ? (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                {predError}
              </div>
            ) : prediction?.status === "success" && prediction.predictions ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="bg-white border border-slate-200 rounded-lg p-3">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase block">
                    Tahmini Taban Sıra
                  </span>
                  <span className="text-xl font-bold text-blue-700 mt-0.5 block">
                    {formatRank(prediction.predictions.predicted_closing_rank)}
                  </span>
                  {prediction.predictions.prediction_interval && (
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Aralık: {formatRank(prediction.predictions.prediction_interval.lower)} – {formatRank(prediction.predictions.prediction_interval.upper)}
                    </span>
                  )}
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-3">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase block">
                    Son Yıl (2025) Tabanı
                  </span>
                  <span className="text-xl font-bold text-slate-800 mt-0.5 block">
                    {prediction.inputs?.previous_closing_rank
                      ? formatRank(prediction.inputs.previous_closing_rank)
                      : "—"}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Resmi Sonuç
                  </span>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-3">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase block">
                    Kontenjan
                  </span>
                  <span className="text-xl font-bold text-slate-800 mt-0.5 block">
                    {prediction.inputs?.published_quota
                      ? `${prediction.inputs.published_quota} kişi`
                      : "—"}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {program.teaching_language || "Türkçe"}
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Section 2: Past Years Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>Geçmiş Yılların Kontenjan ve Taban Sıralama Geçmişi</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-2 px-3">Yıl</th>
                    <th className="py-2 px-3">Kontenjan</th>
                    <th className="py-2 px-3">Taban Sıralama</th>
                    <th className="py-2 px-3">Resmi Kaynak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {program.history && program.history.length > 0 ? (
                    program.history.map((h) => (
                      <tr key={h.year}>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{h.year}</td>
                        <td className="py-2.5 px-3">
                          {h.published_quota ? `${h.published_quota} kişi` : "—"}
                        </td>
                        <td className="py-2.5 px-3 font-medium">
                          {h.closing_rank ? (
                            <span className="text-slate-900 font-semibold">{formatRank(h.closing_rank)}</span>
                          ) : (
                            <span className="text-slate-400 italic">Dolmadı / Açıklanmadı</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {h.rank_source_url ? (
                            <a
                              href={h.rank_source_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              YÖK Atlas <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            "ÖSYM Kılavuzu"
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-3 text-center text-slate-400">
                        Geçmiş kayıt bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Guidance Counselor Assessment */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Rehberlik Değerlendirmesi
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {studentRank
                    ? `${formatRank(studentRank)} başarı sıranıza göre bu programın durumunu değerlendirin.`
                    : "Bu bölümün tercih stratejisi değerlendirmesini görüntüleyin."}
                </p>
              </div>

              {!explanation && (
                <button
                  type="button"
                  onClick={handleGenerateAi}
                  disabled={loadingAi}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer self-start sm:self-auto"
                >
                  {loadingAi ? "Hazırlanıyor..." : "Rehberlik Yorumunu Al"}
                </button>
              )}
            </div>

            {aiError && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                {aiError}
              </div>
            )}

            {explanation && (
              <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
                <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Uzman Rehber Görüşü
                </span>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {explanation.explanation}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
