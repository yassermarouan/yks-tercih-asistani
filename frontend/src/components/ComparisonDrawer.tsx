import React from "react";
import type { RecommendedProgram } from "../types";
import { formatRank } from "../api";
import {
  Scale,
  X,
  Building2,
  MapPin,
  Languages,
  GraduationCap,
  ExternalLink,
  Trash2,
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
      {/* Floating Bottom Shortlist Bar */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-2xl bg-slate-900/95 backdrop-blur-md border border-indigo-500/30 rounded-2xl p-3 sm:p-4 shadow-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white block">
                ÖSYM Tercih Listen ({shortlist.length}/24)
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Aktif Liste
              </span>
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:block">
              Ölü tercih denetimi yapabilir ve resmi PDF raporu alabilirsiniz.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition"
            title="Listeyi Temizle"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenAuditModal}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5"
          >
            <span>24 Tercih & Denetim</span>
          </button>

          <button
            type="button"
            onClick={onOpenModal}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5"
          >
            <Scale className="w-4 h-4" />
            <span className="hidden sm:inline">Karşılaştır</span>
          </button>
        </div>
      </div>

      {/* Side-by-Side Comparison Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 sticky top-0 z-10 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <Scale className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    Programları Yan Yana Karşılaştır
                  </h3>
                  {studentRank && (
                    <span className="text-xs text-slate-400">
                      Başarı Sıran: <strong className="text-indigo-400 font-mono">{formatRank(studentRank)}</strong>
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={onCloseModal}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comparison Grid */}
            <div className="overflow-x-auto p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 min-w-[700px]">
                {shortlist.map((prog) => {
                  const isPositiveAhead = (prog.rank_distance ?? 0) < 0;

                  return (
                    <div
                      key={prog.program_code}
                      className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        {/* Header & Remove */}
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {prog.program_code}
                          </span>
                          <button
                            type="button"
                            onClick={() => onRemove(prog.program_code)}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                            title="Listeden Çıkar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div>
                          <h4 className="text-base font-bold text-white tracking-tight">
                            {prog.program_name}
                          </h4>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-500" />
                            {prog.university_name}
                          </p>
                        </div>

                        {/* Category Badge */}
                        <div className="pt-1">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${
                              prog.category === "reach"
                                ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                                : prog.category === "target"
                                ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
                                : prog.category === "safe"
                                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                                : "bg-slate-800 text-slate-400 border-slate-700"
                            }`}
                          >
                            {prog.category_label}
                          </span>
                        </div>

                        {/* Attribute Rows */}
                        <div className="space-y-2 pt-3 border-t border-slate-800/80 text-xs">
                          <div className="flex justify-between py-1 border-b border-slate-900">
                            <span className="text-slate-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-500" /> Şehir:
                            </span>
                            <span className="text-white font-medium">{prog.city || "—"}</span>
                          </div>

                          <div className="flex justify-between py-1 border-b border-slate-900">
                            <span className="text-slate-400 flex items-center gap-1">
                              <Languages className="w-3 h-3 text-slate-500" /> Öğretim Dili:
                            </span>
                            <span className="text-white font-medium">{prog.teaching_language || "—"}</span>
                          </div>

                          <div className="flex justify-between py-1 border-b border-slate-900">
                            <span className="text-slate-400 flex items-center gap-1">
                              <GraduationCap className="w-3 h-3 text-slate-500" /> Burs / Ücret:
                            </span>
                            <span className="text-white font-medium">{prog.scholarship || "—"}</span>
                          </div>

                          <div className="flex justify-between py-1 border-b border-slate-900">
                            <span className="text-slate-400">Son Taban Sıra:</span>
                            <span className="text-indigo-400 font-mono font-bold">
                              {prog.latest_rank ? formatRank(prog.latest_rank) : "—"}
                              {prog.latest_rank_year && ` (${prog.latest_rank_year})`}
                            </span>
                          </div>

                          <div className="flex justify-between py-1 border-b border-slate-900">
                            <span className="text-slate-400">Kontenjan:</span>
                            <span className="text-white font-mono">
                              {prog.latest_quota ? `${formatRank(prog.latest_quota)} kişi` : "—"}
                            </span>
                          </div>

                          {studentRank && prog.rank_distance !== null && prog.rank_distance !== undefined && (
                            <div className="flex justify-between py-1">
                              <span className="text-slate-400">Sıralama Farkı:</span>
                              <span
                                className={`font-mono font-bold ${
                                  isPositiveAhead ? "text-emerald-400" : "text-amber-400"
                                }`}
                              >
                                {isPositiveAhead ? "+" : ""}
                                {formatRank(-prog.rank_distance)} sıra
                                <span className="text-[10px] block font-normal text-slate-400">
                                  ({isPositiveAhead ? "Daha öndesin" : "Gerisindesin"})
                                </span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Official Link */}
                      {prog.official_url && (
                        <div className="pt-3 border-t border-slate-800/80">
                          <a
                            href={prog.official_url}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                          >
                            <span>YÖK Atlas Sayfası</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
