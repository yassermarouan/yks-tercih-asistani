import React, { useState, useEffect } from "react";
import type { Program, RecommendedProgram, SimulationResponse, ExplanationResponse } from "../types";
import { simulateProgramQuota, generateSimulationExplanation, formatRank } from "../api";
import {
  X,
  Sliders,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Building2,
  MapPin,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
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
  // Extract latest official quota
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

  // Debounce slider changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuota(simulatedQuota);
      setExplanation(null); // Reset previous explanation when scenario changes
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
        setAiError(err.message || "Simülasyon açıklaması üretilemedi.");
        setLoadingAi(false);
      });
  };

  // Fetch simulation
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
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-6 py-4 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-emerald-500 text-black flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Sliders className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                XAI &quot;Ne Olur?&quot; Kontenjan Simülatörü
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {program.program_name}
            </h3>

            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              <span>{program.university_name}</span>
              {program.city && (
                <span className="flex items-center gap-1 text-slate-500">
                  • <MapPin className="w-3 h-3" /> {program.city}
                </span>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Interactive Quota Control Section */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/90 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-sm font-bold text-white block">
                  Simüle Edilen Yayınlanacak Kontenjan
                </label>
                <p className="text-xs text-slate-400 mt-0.5">
                  ÖSYM kılavuzunda kontenjan artar veya azalırsa taban sıranın nasıl tepki vereceğini test edin.
                </p>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl">
                  <input
                    type="number"
                    min={minQuota}
                    max={maxQuota}
                    value={simulatedQuota}
                    onChange={(e) => setSimulatedQuota(Math.max(5, Number(e.target.value) || 5))}
                    className="w-16 bg-transparent text-right font-mono font-bold text-white text-base focus:outline-none"
                  />
                  <span className="text-xs text-slate-400 font-semibold">kişi</span>
                </div>

                {simulatedQuota !== initialQuota && (
                  <button
                    type="button"
                    onClick={() => setSimulatedQuota(initialQuota)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1 transition"
                    title="Orijinal Kontenjana Sıfırla"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Sıfırla</span>
                  </button>
                )}
              </div>
            </div>

            {/* Slider */}
            <div className="space-y-1.5 pt-2">
              <input
                type="range"
                min={minQuota}
                max={maxQuota}
                value={simulatedQuota}
                onChange={(e) => setSimulatedQuota(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-500">
                <span>Min: {minQuota} kişi</span>
                <span className="text-slate-400 font-semibold">
                  Mevcut Resmi: <strong className="text-white">{initialQuota}</strong>
                </span>
                <span>Max: {maxQuota} kişi</span>
              </div>
            </div>

            {/* Quick Adjustment Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/60">
              <span className="text-[11px] font-semibold text-slate-400 mr-1">Hızlı Senaryolar:</span>
              {[-20, -10, -5, 0, 5, 10, 20, 30].map((step) => {
                const targetVal = initialQuota + step;
                if (targetVal < 5) return null;
                const isActive = simulatedQuota === targetVal;
                return (
                  <button
                    key={step}
                    type="button"
                    onClick={() => setSimulatedQuota(targetVal)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition ${
                      isActive
                        ? "bg-indigo-600 text-white shadow"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                    }`}
                  >
                    {step === 0 ? "Orijinal" : step > 0 ? `+${step}` : step}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results Comparison Grid */}
          {error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : loading && !simData ? (
            <div className="py-12 text-center text-slate-400">
              <div className="inline-block animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-500 mb-2"></div>
              <p className="text-xs">Yapay zeka simülasyonu çalıştırılıyor...</p>
            </div>
          ) : simData?.status === "unsupported_score_type" ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
              <HelpCircle className="w-4 h-4 flex-shrink-0" />
              <span>{simData.message}</span>
            </div>
          ) : simData?.status === "success" ? (
            <div className="space-y-5">
              {/* Dynamic Before / After Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Baseline Card */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">
                    Orijinal Projeksiyon
                  </span>
                  <span className="text-xs text-slate-500 block">
                    Resmi Kontenjan: {simData.original_quota} kişi
                  </span>
                  <span className="text-xl font-black font-mono text-slate-300 block pt-1">
                    {formatRank(simData.baseline_predicted_rank)}
                  </span>
                </div>

                {/* Simulated Card */}
                <div className="bg-indigo-950/40 p-4 rounded-2xl border border-indigo-500/40 space-y-1">
                  <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wide block">
                    Simülasyon Sonucu
                  </span>
                  <span className="text-xs text-indigo-300/80 block">
                    Yeni Kontenjan: {simData.simulated_quota} kişi
                  </span>
                  <span className="text-xl font-black font-mono text-indigo-300 block pt-1">
                    {formatRank(simData.simulated_predicted_rank)}
                  </span>
                  {simData.simulated_prediction_interval && (
                    <span className="text-[10px] text-indigo-300/90 font-mono block pt-0.5">
                      Koridor: {formatRank(simData.simulated_prediction_interval.lower)} – {formatRank(simData.simulated_prediction_interval.upper)}
                    </span>
                  )}
                </div>

                {/* Delta Impact Card */}
                <div
                  className={`p-4 rounded-2xl border space-y-1 ${
                    simData.rank_delta && simData.rank_delta > 0
                      ? "bg-emerald-950/30 border-emerald-500/40"
                      : simData.rank_delta && simData.rank_delta < 0
                      ? "bg-amber-950/30 border-amber-500/40"
                      : "bg-slate-950 border-slate-800"
                  }`}
                >
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">
                    Net Sıralama Etkisi
                  </span>
                  <span className="text-xs text-slate-400 block">
                    {quotaDelta > 0
                      ? `+${quotaDelta} Kişi Genişleme`
                      : quotaDelta < 0
                      ? `${quotaDelta} Kişi Daralma`
                      : "Değişim Yok"}
                  </span>
                  <div className="flex items-center gap-1.5 pt-1">
                    {simData.rank_delta && simData.rank_delta > 0 ? (
                      <>
                        <TrendingUp className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        <span className="text-lg font-black font-mono text-emerald-400">
                          +{formatRank(Math.abs(simData.rank_delta))} sıra
                        </span>
                      </>
                    ) : simData.rank_delta && simData.rank_delta < 0 ? (
                      <>
                        <TrendingDown className="w-5 h-5 text-amber-400 flex-shrink-0" />
                        <span className="text-lg font-black font-mono text-amber-400">
                          -{formatRank(Math.abs(simData.rank_delta))} sıra
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-black font-mono text-slate-400">—</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Candidate Personal Safety Transition Alert */}
              {simData.candidate_impact && (
                <div
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    simData.candidate_impact.category_changed
                      ? "bg-indigo-950/40 border-indigo-500/40"
                      : "bg-slate-950 border-slate-800"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold text-white">
                        Senin Başarı Sıran İçin Etki ({formatRank(simData.candidate_impact.student_rank)}):
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        Önce: {simData.candidate_impact.base_category_label}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-bold">
                        Sonra: {simData.candidate_impact.simulated_category_label}
                      </span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right text-xs">
                    <span className="text-slate-400 block">Sıralama Güvenlik Marjı:</span>
                    <span
                      className={`font-mono font-bold text-sm ${
                        simData.candidate_impact.simulated_distance < 0
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }`}
                    >
                      {simData.candidate_impact.simulated_distance < 0
                        ? `+${formatRank(-simData.candidate_impact.simulated_distance)} sıra öndesin`
                        : `-${formatRank(simData.candidate_impact.simulated_distance)} sıra geridesin`}
                    </span>
                  </div>
                </div>
              )}

              {/* AI Simulation Guidance Counselor Section */}
              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-sm font-bold text-white tracking-wide">
                        Yapay Zeka Rehberlik Değerlendirmesi
                      </h4>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Kontenjanın <strong className="text-emerald-400">{debouncedQuota} kişiye</strong> değişmesinin, 
                      2026 taban sırasına ve {studentRank ? <strong className="text-emerald-400">{formatRank(studentRank)}</strong> : "senin"} yerleşme şansına etkisini uzman rehber diliyle yorumlayın.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateAi}
                    disabled={loadingAi}
                    className="self-start sm:self-center flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition disabled:opacity-50 cursor-pointer active:scale-95"
                  >
                    {loadingAi ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        <span>Rehber Analizi Hazırlanıyor...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-black" />
                        <span>Simülasyon İçin Uzman Yorumu Al</span>
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

                {explanation ? (
                  <div className="p-5 rounded-2xl bg-black border border-zinc-800 shadow-inner space-y-3 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between text-xs text-zinc-400 pb-2.5 border-b border-zinc-800">
                      <span className="flex items-center gap-1.5 font-bold text-emerald-400">
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
                ) : (
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block font-semibold">Senaryo Özeti:</strong>
                      <span className="text-slate-300">{simData.interpretation}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* SHAP Quota Feature Shift */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="flex items-center justify-between font-mono">
                  <span>Orijinal Kontenjan SHAP Etki Payı:</span>
                  <span className="text-white font-bold">
                    {simData.original_shap_quota ? `${simData.original_shap_quota > 0 ? "+" : ""}${formatRank(simData.original_shap_quota)}` : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between font-mono">
                  <span>Simüle Edilen Kontenjan SHAP Etki Payı:</span>
                  <span className="text-indigo-400 font-bold">
                    {simData.simulated_shap_quota ? `${simData.simulated_shap_quota > 0 ? "+" : ""}${formatRank(simData.simulated_shap_quota)}` : "—"}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
