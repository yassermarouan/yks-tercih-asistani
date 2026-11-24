import React from "react";
import { PieChart, Target, Rocket, ShieldCheck, HelpCircle } from "lucide-react";

interface Props {
  totalCount: number;
  countReach: number;
  countTarget: number;
  countSafe: number;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
}

export const PreferencePortfolioChart: React.FC<Props> = ({
  totalCount,
  countReach,
  countTarget,
  countSafe,
  selectedCategory,
  onSelectCategory,
}) => {
  if (totalCount === 0) return null;

  const pctTarget = Math.round((countTarget / totalCount) * 100) || 0;
  const pctReach = Math.round((countReach / totalCount) * 100) || 0;
  const pctSafe = Math.round((countSafe / totalCount) * 100) || 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <PieChart className="w-4 h-4" />
            </span>
            <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
              Tercih Portföyü & Risk Dağılım Analizi
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            ÖSYM 24 tercih havuzundaki seçeneklerinin denge ve başarı aralığı dağılımı
          </p>
        </div>

        {/* Balance Status Pill */}
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl w-fit">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs font-bold text-emerald-300">
            {countTarget > 0 && countSafe > 0 ? "Dengeli Tercih Portföyü" : "Öneri Havuzu Hazır"}
          </span>
        </div>
      </div>

      {/* Visual Proportional Multi-Segment Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Portföy Ağırlık Dağılımı (Toplam {totalCount} Program)</span>
          <span>%100 Kapsam</span>
        </div>

        <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden flex p-0.5 border border-slate-800">
          {pctReach > 0 && (
            <div
              style={{ width: `${pctReach}%` }}
              className="h-full bg-gradient-to-r from-amber-600 to-amber-500 rounded-l-full transition-all duration-500 relative group cursor-pointer"
              onClick={() => onSelectCategory("reach")}
              title={`Daha Rekabetçi: %${pctReach}`}
            />
          )}
          {pctTarget > 0 && (
            <div
              style={{ width: `${pctTarget}%` }}
              className="h-full bg-gradient-to-r from-indigo-600 to-violet-600 transition-all duration-500 relative group cursor-pointer"
              onClick={() => onSelectCategory("target")}
              title={`Sıralamana Yakın: %${pctTarget}`}
            />
          )}
          {pctSafe > 0 && (
            <div
              style={{ width: `${pctSafe}%` }}
              className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-r-full transition-all duration-500 relative group cursor-pointer"
              onClick={() => onSelectCategory("safe")}
              title={`Daha Ulaşılabilir: %${pctSafe}`}
            />
          )}
        </div>
      </div>

      {/* Interactive 3-Tier Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Reach Tier */}
        <button
          type="button"
          onClick={() => onSelectCategory(selectedCategory === "reach" ? "all" : "reach")}
          className={`p-4 rounded-2xl border text-left transition-all relative ${
            selectedCategory === "reach"
              ? "bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/30"
              : "bg-slate-950/60 border-slate-800 hover:border-amber-500/40"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Rocket className="w-4 h-4" />
            </span>
            <span className="text-xl font-black font-mono text-amber-400">
              %{pctReach}
            </span>
          </div>
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Daha Rekabetçi</span>
              <span className="text-xs font-mono text-amber-300/80">{countReach} prog.</span>
            </h4>
            <p className="text-[11px] text-slate-400 leading-snug">
              Sıralamandan %15+ daha önde olan hedef programlar.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-semibold text-amber-400 flex items-center gap-1">
            <span>ÖSYM: 1 – 6. Sıralar İçin Uygun</span>
          </div>
        </button>

        {/* Target Tier */}
        <button
          type="button"
          onClick={() => onSelectCategory(selectedCategory === "target" ? "all" : "target")}
          className={`p-4 rounded-2xl border text-left transition-all relative ${
            selectedCategory === "target"
              ? "bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/30"
              : "bg-slate-950/60 border-slate-800 hover:border-indigo-500/40"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Target className="w-4 h-4" />
            </span>
            <span className="text-xl font-black font-mono text-indigo-400">
              %{pctTarget}
            </span>
          </div>
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Sıralamana Yakın</span>
              <span className="text-xs font-mono text-indigo-300/80">{countTarget} prog.</span>
            </h4>
            <p className="text-[11px] text-slate-400 leading-snug">
              Sıralamanla birebir uyumlu (%15-25 bandı) ana hedefler.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-semibold text-indigo-400 flex items-center gap-1">
            <span>ÖSYM: 7 – 18. Sıralar (Ana Omurga)</span>
          </div>
        </button>

        {/* Safe Tier */}
        <button
          type="button"
          onClick={() => onSelectCategory(selectedCategory === "safe" ? "all" : "safe")}
          className={`p-4 rounded-2xl border text-left transition-all relative ${
            selectedCategory === "safe"
              ? "bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30"
              : "bg-slate-950/60 border-slate-800 hover:border-emerald-500/40"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span className="text-xl font-black font-mono text-emerald-400">
              %{pctSafe}
            </span>
          </div>
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Daha Ulaşılabilir</span>
              <span className="text-xs font-mono text-emerald-300/80">{countSafe} prog.</span>
            </h4>
            <p className="text-[11px] text-slate-400 leading-snug">
              Sıralamandan daha gerideki güvenli liman seçenekleri.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
            <span>ÖSYM: 19 – 24. Sıralar (Güvence)</span>
          </div>
        </button>
      </div>

      {/* Strategic Roadmap for official ÖSYM 24 Choices */}
      <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
          <HelpCircle className="w-4 h-4 text-indigo-400" />
          <span>Uzman Tercih Stratejisi: 24 Tercih Listesi Nasıl Kurgulanmalı?</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300 pt-1">
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <strong className="text-amber-300 block mb-1">1. Aşama (1–6. Tercihler)</strong>
            <span>Puanının biraz üzerinde olan, hayalindeki rekabetçi bölümleri yaz.</span>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <strong className="text-indigo-300 block mb-1">2. Aşama (7–18. Tercihler)</strong>
            <span>Başarı sıranın merkezinde yer alan ideal programlarla listeni sağlama al.</span>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <strong className="text-emerald-300 block mb-1">3. Aşama (19–24. Tercihler)</strong>
            <span>Açıkta kalma riskini sıfırlayan, sıralamanın güvenli altındaki yerleri ekle.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
