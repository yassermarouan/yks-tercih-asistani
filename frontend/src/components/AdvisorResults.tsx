import React, { useState } from "react";
import type { RecommendedProgram, AdvisorResponse } from "../types";
import { formatRank } from "../api";
import { PreferencePortfolioChart } from "./PreferencePortfolioChart";
import { RankComparisonChart } from "./RankComparisonChart";
import {
  ArrowLeft,
  BookmarkPlus,
  BookmarkCheck,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Eye,
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
  const [showCharts, setShowCharts] = useState<boolean>(false);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const items = results.items || [];
  const studentRank = results.student_rank || 0;

  const filteredItems =
    selectedCategory === "all"
      ? items
      : items.filter((it) => it.category === selectedCategory);

  const isShortlisted = (code: string) => shortlist.some((p) => p.program_code === code);

  const toggleExpand = (code: string) => {
    setExpandedCards((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  const countReach = items.filter((i) => i.category === "reach").length;
  const countTarget = items.filter((i) => i.category === "target").length;
  const countSafe = items.filter((i) => i.category === "safe").length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Summary Header Card */}
      <div className="bg-gradient-to-b from-[#F2F3EC] to-[#ECEEE3] dark:bg-none dark:bg-[#111114] border border-[#D0D5C6] dark:border-zinc-800/80 rounded-2xl p-5 space-y-4 shadow-[0_2px_10px_rgba(23,26,18,0.04)] dark:shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBackToForm}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E8EBE0] dark:bg-zinc-900 hover:bg-[#E5EDC8]/70 dark:hover:bg-zinc-800 border border-[#D0D5C6] dark:border-zinc-800 text-[#171A12] dark:text-zinc-200 text-xs font-medium transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kriterleri Düzenle</span>
          </button>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-[#E5EDC8] dark:bg-emerald-500/12 border border-[#C5D496] dark:border-emerald-500/25 text-[#526B19] dark:text-emerald-400 font-medium">
              {results.score_type} • {formatRank(studentRank)}. sıra
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#E8EBE0] dark:bg-zinc-900 border border-[#D0D5C6] dark:border-zinc-800 text-[#6B7065] dark:text-zinc-300">
              {items.length} program bulundu
            </span>
          </div>
        </div>

        {/* Category Filter Tabs & Charts Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#D0D5C6] dark:border-zinc-800/80">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-[#171A12] dark:bg-zinc-100 text-[#F0F1E9] dark:text-zinc-950"
                  : "bg-[#E8EBE0] dark:bg-zinc-900 text-[#6B7065] dark:text-zinc-400 hover:text-[#171A12] dark:hover:text-zinc-100 border border-[#D0D5C6] dark:border-zinc-800"
              }`}
            >
              Tümü ({items.length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory("target")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                selectedCategory === "target"
                  ? "bg-[#C6F432] text-[#171A12] font-semibold"
                  : "bg-[#E8EBE0] dark:bg-zinc-900 text-[#6B7065] dark:text-zinc-400 hover:text-[#171A12] dark:hover:text-zinc-100 border border-[#D0D5C6] dark:border-zinc-800"
              }`}
            >
              Sıralamana Yakın ({countTarget})
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory("reach")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                selectedCategory === "reach"
                  ? "bg-amber-500 text-black font-semibold"
                  : "bg-[#E8EBE0] dark:bg-zinc-900 text-[#6B7065] dark:text-zinc-400 hover:text-[#171A12] dark:hover:text-zinc-100 border border-[#D0D5C6] dark:border-zinc-800"
              }`}
            >
              Daha Rekabetçi ({countReach})
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory("safe")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                selectedCategory === "safe"
                  ? "bg-teal-600 dark:bg-teal-500 text-[#F0F1E9] dark:text-black font-semibold"
                  : "bg-[#E8EBE0] dark:bg-zinc-900 text-[#6B7065] dark:text-zinc-400 hover:text-[#171A12] dark:hover:text-zinc-100 border border-[#D0D5C6] dark:border-zinc-800"
              }`}
            >
              Daha Ulaşılabilir ({countSafe})
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowCharts((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#E8EBE0] dark:bg-zinc-900 hover:bg-[#E5EDC8]/70 dark:hover:bg-zinc-800 text-[#171A12] dark:text-zinc-300 border border-[#D0D5C6] dark:border-zinc-800 transition cursor-pointer"
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#526B19] dark:text-emerald-400" />
            <span>{showCharts ? "Grafikleri Gizle" : "Dağılım ve Grafikler"}</span>
            {showCharts ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Collapsible Charts */}
      {showCharts && (
        <div className="space-y-4">
          <PreferencePortfolioChart
            totalCount={items.length}
            countReach={countReach}
            countTarget={countTarget}
            countSafe={countSafe}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => setSelectedCategory(cat)}
          />
          <RankComparisonChart
            studentRank={studentRank}
            items={items}
            onSelectProgram={onSelectProgramForDetail}
          />
        </div>
      )}

      {/* Program Cards */}
      <div className="space-y-3">
        {filteredItems.map((prog, index) => {
          const isSaved = isShortlisted(prog.program_code);
          const isPositiveAhead = (prog.rank_distance ?? 0) < 0;
          const isExpanded = Boolean(expandedCards[prog.program_code]);

          return (
            <div
              key={prog.program_code}
              className="bg-gradient-to-b from-[#F2F3EC] to-[#ECEEE3] dark:bg-none dark:bg-[#111114] border border-[#D0D5C6] dark:border-zinc-800/80 hover:border-[#B6BEA9] dark:hover:border-zinc-700/80 rounded-2xl p-4 sm:p-5 transition shadow-[0_2px_10px_rgba(23,26,18,0.04)] dark:shadow-none"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono text-[#6B7065] dark:text-zinc-500">#{index + 1}</span>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                        prog.category === "reach"
                          ? "bg-amber-500/12 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-600/25 dark:border-amber-500/20"
                          : prog.category === "target"
                          ? "bg-[#E5EDC8] dark:bg-emerald-500/10 text-[#526B19] dark:text-emerald-300 border-[#C5D496] dark:border-emerald-500/20"
                          : prog.category === "safe"
                          ? "bg-teal-500/12 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-600/25 dark:border-teal-500/20"
                          : "bg-[#DFE4D5] dark:bg-zinc-800 text-[#6B7065] dark:text-zinc-400 border-[#D0D5C6] dark:border-zinc-700"
                      }`}
                    >
                      {prog.category_label}
                    </span>
                    <span className="text-[11px] font-mono text-[#6B7065] dark:text-zinc-500">
                      {prog.program_code}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-semibold text-[#171A12] dark:text-zinc-100 leading-snug">
                    {prog.program_name}
                  </h3>

                  <p className="text-xs text-[#6B7065] dark:text-zinc-400">
                    {prog.university_name}
                    {prog.city && ` • ${prog.city}`}
                    {prog.teaching_language && ` • ${prog.teaching_language}`}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onSelectProgramForDetail && (
                    <button
                      type="button"
                      onClick={() => onSelectProgramForDetail(prog.program_code)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#E8EBE0] dark:bg-zinc-900 hover:bg-[#E5EDC8]/70 dark:hover:bg-zinc-800 border border-[#D0D5C6] dark:border-zinc-800 text-[#171A12] dark:text-zinc-200 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#526B19] dark:text-emerald-400" />
                      <span>İncele</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onToggleShortlist(prog)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 border cursor-pointer ${
                      isSaved
                        ? "bg-[#C6F432] border-[#C6F432] text-[#171A12] font-semibold"
                        : "bg-[#E8EBE0] dark:bg-zinc-900 hover:bg-[#E5EDC8]/70 dark:hover:bg-zinc-800 border-[#D0D5C6] dark:border-zinc-800 text-[#171A12] dark:text-zinc-200"
                    }`}
                  >
                    {isSaved ? (
                      <>
                        <BookmarkCheck className="w-3.5 h-3.5" />
                        <span>Listede</span>
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        <span>Listeye Ekle</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Essential Numbers */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 p-3 rounded-xl bg-[#E8EBE0] dark:bg-[#09090b] border border-[#D0D5C6] dark:border-zinc-800/70">
                <div>
                  <span className="text-[11px] text-[#6B7065] block">
                    {prog.latest_rank_year || 2025} Taban Sıra
                  </span>
                  <span className="text-sm font-mono font-semibold text-[#171A12] dark:text-zinc-100 mt-0.5 block">
                    {prog.latest_rank ? formatRank(prog.latest_rank) : "Dolmadı"}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-[#6B7065] block">Sıra Farkı</span>
                  {prog.rank_distance !== null && prog.rank_distance !== undefined ? (
                    <span
                      className={`text-sm font-mono font-semibold mt-0.5 block ${
                        isPositiveAhead
                          ? "text-[#526B19] dark:text-emerald-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {isPositiveAhead ? "+" : ""}
                      {formatRank(-prog.rank_distance)}
                    </span>
                  ) : (
                    <span className="text-sm text-[#6B7065] mt-0.5 block">—</span>
                  )}
                </div>

                <div>
                  <span className="text-[11px] text-[#6B7065] block">Kontenjan</span>
                  <span className="text-sm font-mono font-semibold text-[#171A12] dark:text-zinc-200 mt-0.5 block">
                    {prog.latest_quota ? `${formatRank(prog.latest_quota)} kişi` : "—"}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-[#6B7065] block">Uyum Puanı</span>
                  <span className="text-sm font-mono font-semibold text-[#526B19] dark:text-emerald-400 mt-0.5 block">
                    %{Math.round(prog.total_score)}
                  </span>
                </div>
              </div>

              {/* Expand Toggle */}
              <div className="mt-3 pt-2.5 border-t border-[#D0D5C6] dark:border-zinc-800/60 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => toggleExpand(prog.program_code)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#526B19] dark:text-emerald-400 hover:text-[#526B19] dark:hover:text-emerald-300 transition cursor-pointer"
                >
                  <span>{isExpanded ? "Detayları Gizle" : "Neden önerildi?"}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {prog.strategic_tier && (
                  <span className="text-[11px] text-[#6B7065]">{prog.strategic_tier}</span>
                )}
              </div>

              {/* Expandable Details */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-[#D0D5C6] dark:border-zinc-800/60 space-y-3 text-xs">
                  <p className="text-[#171A12] dark:text-zinc-300 leading-relaxed">{prog.explanation}</p>

                  <div className="flex flex-wrap gap-1.5">
                    {(prog.matches_notes && prog.matches_notes.length > 0
                      ? prog.matches_notes
                      : ["Hedef Bölüm Eşleşmesi"]
                    ).map((note, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#E5EDC8] dark:bg-emerald-500/10 text-[#526B19] dark:text-emerald-300 border border-[#C5D496] dark:border-emerald-500/20 text-[11px]"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {note}
                      </span>
                    ))}

                    {prog.trade_offs?.map((trade, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/12 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-600/25 dark:border-amber-500/20 text-[11px]"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        {trade}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#D0D5C6] dark:border-zinc-800/60">
                    {prog.history && prog.history.length > 0 && (
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#6B7065] dark:text-zinc-400">
                        <span>Geçmiş:</span>
                        {prog.history.map((h) => (
                          <span key={h.year} className="font-mono">
                            <strong className="text-[#171A12] dark:text-zinc-300">{h.year}:</strong>{" "}
                            {h.closing_rank ? formatRank(h.closing_rank) : "—"}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {onOpenSimulator && (
                        <button
                          type="button"
                          onClick={() => onOpenSimulator(prog)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E8EBE0] dark:bg-zinc-900 hover:bg-[#E5EDC8]/70 dark:hover:bg-zinc-800 border border-[#D0D5C6] dark:border-zinc-800 text-[#171A12] dark:text-zinc-300 text-[11px] font-medium transition cursor-pointer"
                        >
                          <Sliders className="w-3 h-3" />
                          <span>Kontenjan Simülatörü</span>
                        </button>
                      )}

                      {prog.official_url && (
                        <a
                          href={prog.official_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#E8EBE0] dark:bg-zinc-900 hover:bg-[#E5EDC8]/70 dark:hover:bg-zinc-800 border border-[#D0D5C6] dark:border-zinc-800 text-[#171A12] dark:text-zinc-300 text-[11px] font-medium transition"
                        >
                          <span>YÖK Atlas</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-[#6B7065] text-center pt-2">
        Bu öneriler geçmiş yerleştirme verileri ve eğilimler üzerinden bilgilendirme amacıyla sunulmaktadır; kesin yerleşme garantisi vermez.
      </p>
    </div>
  );
};
