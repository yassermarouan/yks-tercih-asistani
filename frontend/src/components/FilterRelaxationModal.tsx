import React from "react";
import type { RelaxationSuggestion } from "../types";
import { ArrowLeft, RefreshCw } from "lucide-react";

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
    <div className="max-w-2xl mx-auto bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5 space-y-1">
        <h3 className="text-base font-bold text-amber-900">
          Eşleşen Üniversite Programı Bulunamadı
        </h3>
        <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
          {message || "Belirttiğiniz kriterlerin tümünü aynı anda sağlayan bir program bulunamadı. Kriterlerinizi biraz esneterek daha fazla seçeneğe ulaşabilirsiniz."}
        </p>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Önerilen Kriter Esnetmeleri:
        </h4>

        {suggestions && suggestions.length > 0 ? (
          <div className="space-y-2.5">
            {suggestions.map((s) => (
              <div
                key={s.criteria_key}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <strong className="text-slate-900 font-semibold block">{s.label}</strong>
                  <span className="text-slate-500">{s.reason}</span>
                </div>

                <button
                  type="button"
                  onClick={() => onRelax(s.criteria_key)}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center justify-center gap-1.5 transition self-start sm:self-auto cursor-pointer shadow-xs"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{s.action_text}</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            Arama kriterlerinizi genişletmek için tercih ettiğiniz bölümleri veya şehirleri değiştirebilirsiniz.
          </p>
        )}
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToForm}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Forma Geri Dön</span>
        </button>
      </div>
    </div>
  );
};
