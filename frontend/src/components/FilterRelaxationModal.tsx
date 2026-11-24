import React from "react";
import type { RelaxationSuggestion } from "../types";
import { AlertTriangle, ArrowLeft, RefreshCw, CheckCircle2 } from "lucide-react";

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
    <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex-shrink-0">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-white tracking-tight">
            Eşleşen Program Bulunamadı
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            {message || "Belirttiğiniz 'Şart' kriterlerinin tümünü aynı anda sağlayan bir program bulunamadı."}
          </p>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Aramayı Kısıtlayan Kriterler ve Esnetme Önerileri:
        </h4>

        {suggestions && suggestions.length > 0 ? (
          <div className="space-y-3">
            {suggestions.map((s) => (
              <div
                key={s.criteria_key}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      {s.label}
                    </span>
                    <span className="text-xs text-slate-400">
                      ({s.eliminated_count} program elendi)
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{s.reason}</p>
                </div>

                <button
                  type="button"
                  onClick={() => onRelax(s.criteria_key)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition whitespace-nowrap"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {s.action_text}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">
            Arama kriterlerinizi genişletmek için tercih ettiğiniz bölümleri veya şehirleri esnetebilirsiniz.
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBackToForm}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Forma Geri Dön ve Düzenle
        </button>

        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Şartları tek tıkla esnetebilirsiniz
        </span>
      </div>
    </div>
  );
};
