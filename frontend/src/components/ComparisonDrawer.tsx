import React from "react";
import type { RecommendedProgram } from "../types";
import { formatRank } from "../api";
import { Scale, X, ExternalLink } from "lucide-react";

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
  isOpen,
  onCloseModal,
}) => {
  if (!isOpen || shortlist.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#171A12]/40 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-5xl bg-gradient-to-b from-[#F2F3EC] to-[#ECEEE3] dark:bg-none dark:bg-[#111114] border border-[#D0D5C6] dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
        <div className="p-5 border-b border-[#D0D5C6] dark:border-zinc-800 flex items-center justify-between bg-[#F0F1E9] dark:bg-[#111114]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#E5EDC8] dark:bg-emerald-500/12 text-[#526B19] dark:text-emerald-400 border border-[#C5D496] dark:border-emerald-500/20">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-[#171A12] dark:text-zinc-100">
                Programları Karşılaştır ({shortlist.length})
              </h3>
              {studentRank && (
                <span className="text-xs text-[#6B7065] dark:text-zinc-400">
                  Başarı Sıran:{" "}
                  <strong className="text-[#526B19] dark:text-emerald-400 font-mono">
                    {formatRank(studentRank)}
                  </strong>
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseModal}
            className="p-2 rounded-lg bg-[#DFE4D5] dark:bg-zinc-900 hover:bg-[#DFE4D5] dark:hover:bg-zinc-800 border border-[#D0D5C6] dark:border-zinc-800 text-[#6B7065] dark:text-zinc-400 hover:text-[#171A12] dark:hover:text-zinc-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 min-w-[680px]">
            {shortlist.map((prog) => {
              const isPositiveAhead = (prog.rank_distance ?? 0) < 0;

              return (
                <div
                  key={prog.program_code}
                  className="bg-[#E8EBE0] dark:bg-[#09090b] border border-[#D0D5C6] dark:border-zinc-800/80 rounded-xl p-4 space-y-3.5 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono text-[#6B7065]">{prog.program_code}</span>
                      <button
                        type="button"
                        onClick={() => onRemove(prog.program_code)}
                        className="p-1 rounded text-[#6B7065] hover:text-rose-500 hover:bg-[#DFE4D5] dark:hover:bg-zinc-800 transition cursor-pointer"
                        title="Listeden Çıkar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-[#171A12] dark:text-zinc-100">{prog.program_name}</h4>
                      <p className="text-xs text-[#6B7065] dark:text-zinc-400 mt-0.5">{prog.university_name}</p>
                    </div>

                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                        prog.category === "reach"
                          ? "bg-amber-500/12 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300"
                          : prog.category === "target"
                          ? "bg-[#E5EDC8] dark:bg-emerald-500/10 text-[#526B19] dark:text-emerald-300"
                          : "bg-teal-500/12 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300"
                      }`}
                    >
                      {prog.category_label}
                    </span>

                    <div className="space-y-1.5 pt-2.5 border-t border-[#D0D5C6] dark:border-zinc-800/70 text-xs">
                      <div className="flex justify-between py-1">
                        <span className="text-[#6B7065]">Şehir</span>
                        <span className="text-[#171A12] dark:text-zinc-200">{prog.city || "—"}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-[#6B7065]">Dil</span>
                        <span className="text-[#171A12] dark:text-zinc-200">{prog.teaching_language || "—"}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-[#6B7065]">Burs / Ücret</span>
                        <span className="text-[#171A12] dark:text-zinc-200">{prog.scholarship || "—"}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-[#6B7065]">Taban Sıra</span>
                        <span className="text-[#526B19] dark:text-emerald-400 font-mono font-semibold">
                          {prog.latest_rank ? formatRank(prog.latest_rank) : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-[#6B7065]">Kontenjan</span>
                        <span className="text-[#171A12] dark:text-zinc-200 font-mono">
                          {prog.latest_quota ? `${formatRank(prog.latest_quota)} kişi` : "—"}
                        </span>
                      </div>
                      {studentRank && prog.rank_distance !== null && prog.rank_distance !== undefined && (
                        <div className="flex justify-between py-1">
                          <span className="text-[#6B7065]">Fark</span>
                          <span
                            className={`font-mono font-semibold ${
                              isPositiveAhead
                                ? "text-[#526B19] dark:text-emerald-400"
                                : "text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {isPositiveAhead ? "+" : ""}
                            {formatRank(-prog.rank_distance)} sıra
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {prog.official_url && (
                    <a
                      href={prog.official_url}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2 px-3 rounded-lg bg-[#F0F1E9] dark:bg-zinc-900 hover:bg-[#E5EDC8]/70 dark:hover:bg-zinc-800 border border-[#D0D5C6] dark:border-zinc-800 text-[#171A12] dark:text-zinc-300 text-xs font-medium flex items-center justify-center gap-1.5 transition"
                    >
                      <span>YÖK Atlas</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
