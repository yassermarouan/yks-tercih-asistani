import React from "react";
import type { RecommendedProgram } from "../types";
import { formatRank } from "../api";
import {
  Scale,
  X,
  Trash2,
  ListOrdered,
} from "lucide-react";

interface Props {
  shortlist: RecommendedProgram[];
  studentRank?: number;
  onRemove: (programCode: string) => void;
  onClear: () => void;
  isOpen: boolean;
  onOpenModal: () => void;
  onCloseModal: () => void;
  onOpenAuditModal: () => void;
}

export const ComparisonDrawer: React.FC<Props> = ({
  shortlist,
  studentRank,
  onRemove,
  onClear,
  isOpen,
  onOpenModal,
  onCloseModal,
  onOpenAuditModal,
}) => {
  if (shortlist.length === 0) return null;

  return (
    <>
      {/* Floating Bottom Action Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-xl bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                Tercih Listeniz ({shortlist.length}/24)
              </span>
            </div>
            <span className="text-[11px] text-slate-500 hidden sm:block">
              Seçtiğiniz programları kıyaslayın ve sıralayın.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-rose-600 transition cursor-pointer"
            title="Tümünü Temizle"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenModal}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <Scale className="w-3.5 h-3.5 text-slate-600" />
            <span>Karşılaştır</span>
          </button>

          <button
            type="button"
            onClick={onOpenAuditModal}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">24'lük Liste</span>
            <span className="sm:hidden">Liste</span>
          </button>
        </div>
      </div>

      {/* Side-by-Side Comparison Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden my-6 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Program Karşılaştırma
                </h2>
                {studentRank && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Başarı Sıranız: <strong className="text-blue-700">{formatRank(studentRank)}</strong>
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={onCloseModal}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comparison Table / Cards */}
            <div className="overflow-x-auto p-5 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 min-w-[650px]">
                {shortlist.map((prog) => {
                  const isAhead = (prog.rank_distance ?? 0) < 0;

                  return (
                    <div
                      key={prog.program_code}
                      className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3.5 flex flex-col justify-between"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                            {prog.university_name}
                          </span>
                          <button
                            type="button"
                            onClick={() => onRemove(prog.program_code)}
                            className="text-slate-400 hover:text-rose-600 p-0.5"
                            title="Listeden Çıkar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 leading-snug">
                          {prog.program_name}
                        </h3>

                        {prog.city && (
                          <p className="text-xs text-slate-500">
                            Şehir: {prog.city}
                          </p>
                        )}
                      </div>

                      {/* Key Comparison Data */}
                      <div className="space-y-2 pt-2 border-t border-slate-200/80 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">2026 Tahmini Sıra:</span>
                          <strong className="text-slate-900">
                            {prog.latest_rank ? formatRank(Math.round(prog.latest_rank * 0.98)) : "—"}
                          </strong>
                        </div>

                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">2025 Taban Sırası:</span>
                          <span className="text-slate-800 font-medium">
                            {prog.latest_rank ? formatRank(prog.latest_rank) : "Açıklanmadı"}
                          </span>
                        </div>

                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Durumunuz:</span>
                          <span className={`font-semibold ${isAhead ? "text-emerald-700" : "text-slate-700"}`}>
                            {prog.rank_distance !== null && prog.rank_distance !== undefined ? (
                              isAhead ? `+${formatRank(-prog.rank_distance)} önde` : `${formatRank(prog.rank_distance)} geride`
                            ) : "—"}
                          </span>
                        </div>

                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Kontenjan:</span>
                          <span className="text-slate-800 font-medium">
                            {prog.latest_quota ? `${prog.latest_quota} kişi` : "—"}
                          </span>
                        </div>

                        <div className="flex justify-between py-1">
                          <span className="text-slate-500">Öğretim Dili:</span>
                          <span className="text-slate-800 font-medium">
                            {prog.teaching_language || "Türkçe"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>Toplam {shortlist.length} program karşılaştırılıyor.</span>
              <button
                type="button"
                onClick={onCloseModal}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
