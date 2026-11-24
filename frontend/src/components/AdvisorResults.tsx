import React, { useState } from "react";
import type { RecommendedProgram, AdvisorResponse } from "../types";
import { formatRank } from "../api";
import { PreferencePortfolioChart } from "./PreferencePortfolioChart";
import { RankComparisonChart } from "./RankComparisonChart";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Languages,
  BookmarkPlus,
  BookmarkCheck,
  ExternalLink,
  Sparkles,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  SlidersHorizontal,
  Compass,
  Sliders,
  ArrowRight,
} from "lucide-react";

interface Props {
  results: AdvisorResponse;
  onBackToForm: () => void;
  shortlist: RecommendedProgram[];
  onToggleShortlist: (program: RecommendedProgram) => void;
  onSelectProgramForDetail?: (programCode: string) => void;
  onOpenSimulator?: (program: RecommendedProgram) => void;
}

export const AdvisorResults: React.FC<Props> = ({
  results,
  onBackToForm,
  shortlist,
  onToggleShortlist,
  onSelectProgramForDetail,
  onOpenSimulator,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const items = results.items || [];
  const studentRank = results.student_rank || 0;

  // Filter items by category
  const filteredItems =
    selectedCategory === "all"
      ? items
      : items.filter((it) => it.category === selectedCategory);

  const isShortlisted = (code: string) => shortlist.some((p) => p.program_code === code);

  // Category counts
  const countReach = items.filter((i) => i.category === "reach").length;
  const countTarget = items.filter((i) => i.category === "target").length;
  const countSafe = items.filter((i) => i.category === "safe").length;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      {/* Top Banner / Summary Header */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBackToForm}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-bold transition w-fit cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kriterleri Yeniden Düzenle</span>
          </button>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
              Puan Türü: {results.score_type}
            </span>
            <span className="px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono font-bold">
              Başarı Sıran: {formatRank(studentRank)}
            </span>
            <span className="px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
              Öneri Havuzu: <strong className="text-white">{items.length}</strong> program
            </span>
          </div>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Compass className="w-6 h-6 text-emerald-400" />
            Kişiselleştirilmiş Tercih & Açıklanabilir AI Danışmanı
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 mt-1 max-w-3xl leading-relaxed">
            Resmi ÖSYM taban sıralamaları, kontenjan trendleri ve bireysel kriterlerin matematiksel uyum puanlamasıyla sıralandı.
            Tüm öneriler <strong>XAI (Açıklanabilir Yapay Zeka)</strong> şeffaflığıyla faktör bazında gerekçelendirilmiştir.
          </p>
        </div>

        {/* Category Filter Navigation Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedCategory === "all"
                ? "bg-white text-black font-extrabold shadow-md"
                : "bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300"
            }`}
          >
            Tüm Öneriler ({items.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory("target")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === "target"
                ? "bg-emerald-500 text-black font-extrabold shadow-lg shadow-emerald-500/20"
                : "bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Sıralamana Yakın ({countTarget})
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory("reach")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === "reach"
                ? "bg-amber-500 text-black font-extrabold shadow-lg shadow-amber-500/20"
                : "bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Daha Rekabetçi ({countReach})
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory("safe")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === "safe"
                ? "bg-emerald-600 text-white font-extrabold shadow-lg shadow-emerald-600/20"
                : "bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Daha Ulaşılabilir ({countSafe})
          </button>
        </div>
      </div>

      {/* Visual Chart 1: Portfolio Strategy & Risk Distribution */}
      <PreferencePortfolioChart
        totalCount={items.length}
        countReach={countReach}
        countTarget={countTarget}
        countSafe={countSafe}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
      />

      {/* Visual Chart 2: Rank Benchmark Spectrum Visualizer */}
      <RankComparisonChart
        studentRank={studentRank}
        items={items}
        onSelectProgram={onSelectProgramForDetail}
      />

      {/* Program Cards Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span>Önerilen Program Kartları</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
            {filteredItems.length} program listeleniyor
          </span>
        </h3>
        <span className="text-xs text-slate-400 hidden sm:inline">
          Öncelik: Skor ve Sıralama Yakınlığı
        </span>
      </div>

      {/* Program Cards List with XAI Deep Dives */}
      <div className="space-y-5">
        {filteredItems.map((prog, index) => {
          const isSaved = isShortlisted(prog.program_code);
          const isPositiveAhead = (prog.rank_distance ?? 0) < 0;

          return (
            <div
              key={prog.program_code}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5 hover:border-slate-700 transition"
            >
              {/* Card Top: Rank Order, Badges, Strategic Slot & Action Button */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-indigo-600/20 text-indigo-400 font-mono text-xs font-black flex items-center justify-center border border-indigo-500/30">
                      {index + 1}
                    </span>

                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {prog.program_code}
                    </span>

                    {/* Category Tag */}
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
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

                    {/* Strategic Tier Recommendation Tag */}
                    {prog.strategic_tier && (
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700">
                        {prog.strategic_tier}
                      </span>
                    )}

                    {prog.city && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {prog.city}
                      </span>
                    )}

                    {prog.teaching_language && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Languages className="w-3.5 h-3.5 text-slate-500" />
                        {prog.teaching_language}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    {prog.program_name}
                  </h3>

                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <strong className="text-slate-300">{prog.university_name}</strong>
                    {prog.faculty && <span className="text-slate-500 hidden sm:inline">• {prog.faculty}</span>}
                  </p>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center gap-2 self-start flex-shrink-0">
                  {onSelectProgramForDetail && (
                    <button
                      type="button"
                      onClick={() => onSelectProgramForDetail(prog.program_code)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                      title="2026 taban sıralaması tahmini ve uzman yapay zeka rehberlik analizini görüntüle"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>AI Rehberlik & Analiz</span>
                    </button>
                  )}

                  {onOpenSimulator && (
                    <button
                      type="button"
                      onClick={() => onOpenSimulator(prog)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                      title="Kontenjan değişirse taban sıralama ve senin şansın ne olur? Test et"
                    >
                      <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="hidden md:inline">Ne Olur? (Simülatör)</span>
                      <span className="md:hidden">Simülatör</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onToggleShortlist(prog)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                      isSaved
                        ? "bg-emerald-500 border-emerald-500 text-black font-extrabold shadow-md shadow-emerald-500/20"
                        : "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300 hover:text-white"
                    }`}
                  >
                    {isSaved ? (
                      <>
                        <BookmarkCheck className="w-3.5 h-3.5" />
                        <span>Listende</span>
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        <span>Listeme Ekle</span>
                      </>
                    )}
                  </button>

                  {prog.official_url && (
                    <a
                      href={prog.official_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 hover:text-white transition"
                      title="YÖK Atlas Sayfası"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Middle Grid: Ranks, Distances, Quotas, Scores */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    {prog.latest_rank_year || 2025} Taban Sıra
                  </span>
                  <span className="text-base font-extrabold font-mono text-white block mt-0.5">
                    {prog.latest_rank ? formatRank(prog.latest_rank) : "Dolmadı / Açıklanmadı"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Sıralama Farkı
                  </span>
                  {prog.rank_distance !== null && prog.rank_distance !== undefined ? (
                    <span
                      className={`text-base font-extrabold font-mono block mt-0.5 ${
                        isPositiveAhead ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {isPositiveAhead ? "+" : ""}
                      {formatRank(-prog.rank_distance)}
                      <span className="text-[10px] font-normal text-slate-400 ml-1">
                        ({isPositiveAhead ? "öndesin" : "geridesin"})
                      </span>
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 block mt-1">—</span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Kapasite / Kontenjan
                  </span>
                  <span className="text-base font-extrabold font-mono text-slate-300 block mt-0.5">
                    {prog.latest_quota ? `${formatRank(prog.latest_quota)} kişi` : "—"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Genel Model Skoru
                  </span>
                  <span className="text-base font-extrabold font-mono text-indigo-400 block mt-0.5">
                    %{Math.round(prog.total_score)}
                  </span>
                </div>
              </div>

              {/* Explainable AI (XAI) Score Breakdown & Decision Transparency */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-300">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                    <span>XAI Karar Şeffaflığı: Puan Katkı Ağırlıkları</span>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-slate-400">
                    <span>
                      Kriter Uyumu: <strong className="text-white">%{Math.round(prog.preference_fit_score)}</strong>
                    </span>
                    <span>
                      Sıralama Koridoru: <strong className="text-white">%{Math.round(prog.rank_fit_score)}</strong>
                    </span>
                  </div>
                </div>

                {/* Factor Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {/* Matches Notes Chips */}
                  {prog.matches_notes && prog.matches_notes.length > 0 ? (
                    prog.matches_notes.map((note, nIdx) => (
                      <span
                        key={nIdx}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        {note}
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Hedef Bölüm Eşleşmesi
                    </span>
                  )}

                  {/* Trade-offs Chips */}
                  {prog.trade_offs &&
                    prog.trade_offs.map((trade, tIdx) => (
                      <span
                        key={tIdx}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20"
                      >
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        {trade}
                      </span>
                    ))}
                </div>
              </div>

              {/* Natural Explanation: "Neden önerildi?" */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Neden önerildi? (Rehberlik Gerekçesi)</span>
                  </div>
                  {onSelectProgramForDetail && (
                    <button
                      type="button"
                      onClick={() => onSelectProgramForDetail(prog.program_code)}
                      className="text-[11px] font-semibold text-emerald-400 hover:text-white flex items-center gap-1 hover:underline transition self-start sm:self-auto cursor-pointer"
                    >
                      <span>Uzman AI Rehberlik Analizini Gör</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed">
                  {prog.explanation}
                </p>
              </div>

              {/* Past Ranks Strip (2023, 2024, 2025) */}
              {prog.history && prog.history.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    Geçmiş Yılların Eğilimi:
                  </span>
                  {prog.history.map((h) => (
                    <span key={h.year} className="inline-flex items-center gap-1 font-mono text-[11px]">
                      <strong className="text-slate-300">{h.year}:</strong>{" "}
                      {h.closing_rank ? (
                        <span className="text-white font-semibold">{formatRank(h.closing_rank)}</span>
                      ) : (
                        <span className="text-slate-600 italic">açıklanmadı</span>
                      )}
                      {h.published_quota && (
                        <span className="text-slate-400">({h.published_quota} k.)</span>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Disclaimer at Bottom */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 text-center space-y-1">
        <p>
          ⚠️ <strong>Açıklanabilir Yapay Zeka & Yasal Bilgilendirme:</strong> Bu tavsiyeler, ÖSYM ve YÖK Atlas geçmiş merkezi yerleştirme verileri üzerinden istatistiksel kıyaslama amacıyla üretilmiştir. Kesin yerleşme veya kabul garantisi taşımaz.
        </p>
      </div>
    </div>
  );
};
