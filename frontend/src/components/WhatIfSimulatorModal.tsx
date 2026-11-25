import React, { useState, useEffect } from "react";
import type { Program, RecommendedProgram, SimulationResponse } from "../types";
import { simulateProgramQuota, formatRank } from "../api";
import {
  X,
  RotateCcw,
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

  // Debounce slider changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuota(simulatedQuota);
    }, 150);
    return () => clearTimeout(timer);
  }, [simulatedQuota]);

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

  const minQuota = Math.max(5, initialQuota - 30);
  const maxQuota = initialQuota + 40;
  const quotaDelta = simulatedQuota - initialQuota;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden my-6 flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
              Kontenjan Simülatörü
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
              {program.program_name}
            </h2>
            <p className="text-xs text-slate-500">
              {program.university_name} {program.city ? `• ${program.city}` : ""}
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
        <div className="p-6 space-y-6">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Kontenjan arttığında genellikle taban sıralaması geriler ve yerleşme ihtimali yükselir; kontenjan daraldığında ise rekabet artar. Aşağıdaki kaydırıcıyı kullanarak olası kontenjan senaryolarını test edebilirsiniz.
          </p>

          {/* Slider Control Box */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 block">
                  Simüle Edilen Kontenjan
                </span>
                <span className="text-2xl font-bold text-slate-900">
                  {simulatedQuota} kişi
                </span>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500 block">
                  Mevcut: {initialQuota} kişi
                </span>
                {quotaDelta !== 0 ? (
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      quotaDelta > 0
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-amber-50 text-amber-800"
                    }`}
                  >
                    {quotaDelta > 0 ? `+${quotaDelta} kişi artış` : `${quotaDelta} kişi azalış`}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Değişiklik yok</span>
                )}
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={minQuota}
              max={maxQuota}
              step={5}
              value={simulatedQuota}
              onChange={(e) => setSimulatedQuota(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />

            <div className="flex justify-between text-[11px] text-slate-400">
              <span>{minQuota} kişi</span>
              <span>Başlangıç: {initialQuota}</span>
              <span>{maxQuota} kişi</span>
            </div>

            {quotaDelta !== 0 && (
              <button
                type="button"
                onClick={() => setSimulatedQuota(initialQuota)}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Mevcut Kontenjana Dön</span>
              </button>
            )}
          </div>

          {/* Simulation Outcome */}
          {loading ? (
            <div className="py-6 text-center text-slate-500">
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-slate-300 border-t-blue-600 mb-2" />
              <p className="text-xs">Yeni sıralama hesaplanıyor...</p>
            </div>
          ) : error ? (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              {error}
            </div>
          ) : simData && simData.status === "success" ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <span className="text-[11px] text-slate-500 font-semibold block uppercase">
                    Tahmini Yeni Taban Sıra
                  </span>
                  <span className="text-xl font-bold text-blue-700 block mt-0.5">
                    {simData.simulated_predicted_rank
                      ? formatRank(simData.simulated_predicted_rank)
                      : "—"}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <span className="text-[11px] text-slate-500 font-semibold block uppercase">
                    Sıralama Değişimi
                  </span>
                  <span className="text-xl font-bold text-slate-800 block mt-0.5">
                    {simData.rank_delta !== undefined && simData.rank_delta !== null ? (
                      simData.rank_delta === 0 ? (
                        "0 sıra"
                      ) : simData.rank_delta > 0 ? (
                        `+${formatRank(simData.rank_delta)} sıra geriler`
                      ) : (
                        `-${formatRank(Math.abs(simData.rank_delta))} sıra öne çeker`
                      )
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
              </div>

              {/* Plain Language Interpretation */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 text-xs text-slate-700 leading-relaxed">
                <strong>Rehberlik Değerlendirmesi: </strong>
                {simData.interpretation ||
                  (quotaDelta > 0
                    ? `Kontenjanın ${quotaDelta} kişi artması durumunda bölümün taban sıralamasının yaklaşık ${formatRank(Math.abs(simData.rank_delta || 0))} sıra gerilemesi ve yerleşme ihtimalinizin artması beklenir.`
                    : quotaDelta < 0
                    ? `Kontenjanın ${Math.abs(quotaDelta)} kişi azalması halinde bölümdeki rekabet artacak ve taban sıralamasının öne çekmesi beklenecektir.`
                    : "Mevcut kontenjan korunduğunda sıralamada belirgin bir kontenjan şoku beklenmez.")}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
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
