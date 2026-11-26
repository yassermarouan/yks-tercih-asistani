import React from "react";
import type { RelaxationSuggestion } from "../types";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

interface Props {
  message?: string;
  suggestions: RelaxationSuggestion[];
  onRelax: (criteriaKey: string) => void;
  onBackToForm: () => void;
}

export const FilterRelaxationModal: React.FC<Props> = ({
  message,
  suggestions,
  onRelax,
  onBackToForm,
}) => {
  return (
    <div className="max-w-2xl mx-auto bg-gradient-to-b from-[#F2F3EC] to-[#ECEEE3] dark:bg-none dark:bg-[#111114] border border-[#D0D5C6] dark:border-zinc-800 rounded-2xl p-6 space-y-5 shadow-[0_2px_10px_rgba(23,26,18,0.04)] dark:shadow-none">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-amber-500/12 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-600/25 dark:border-amber-500/20 shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[#171A12] dark:text-zinc-100">
            Eşleşen Program Bulunamadı
          </h3>
          <p className="text-sm text-[#6B7065] dark:text-zinc-400 mt-1">
            {message || "Seçtiğiniz tüm 'Şart' kriterlerini aynı anda karşılayan bir program bulunamadı."}
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-[#E8EBE0] dark:bg-[#09090b] border border-[#D0D5C6] dark:border-zinc-800/80 space-y-3">
        <h4 className="text-xs font-medium text-[#6B7065] dark:text-zinc-400">
          Kriterleri Esneterek Sonuçları Görün
        </h4>

        {suggestions && suggestions.length > 0 ? (
          <div className="space-y-2.5">
            {suggestions.map((s) => (
              <div
                key={s.criteria_key}
                className="p-3.5 rounded-xl bg-[#F0F1E9] dark:bg-[#111114] border border-[#D0D5C6] dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium text-rose-600 dark:text-rose-300">{s.label}</span>
                    <span className="text-[#6B7065]">({s.eliminated_count} program elendi)</span>
                  </div>
                  <p className="text-xs text-[#6B7065] dark:text-zinc-400">{s.reason}</p>
                </div>

                <button
                  type="button"
                  onClick={() => onRelax(s.criteria_key)}
                  className="px-3.5 py-2 rounded-lg bg-[#C6F432] hover:bg-[#b5e422] text-[#171A12] font-semibold text-xs flex items-center justify-center gap-1.5 transition whitespace-nowrap cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{s.action_text}</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#6B7065] dark:text-zinc-400">
            Tercih ettiğiniz bölümleri veya şehirleri genişletebilirsiniz.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onBackToForm}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#DFE4D5] dark:bg-zinc-900 hover:bg-[#DFE4D5] dark:hover:bg-zinc-800 border border-[#D0D5C6] dark:border-zinc-800 text-[#171A12] dark:text-zinc-200 text-xs font-medium transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Forma Geri Dön</span>
      </button>
    </div>
  );
};
