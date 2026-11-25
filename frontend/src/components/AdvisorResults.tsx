import React, { useState } from "react";
import type { RecommendedProgram, AdvisorResponse } from "../types";
import { formatRank, simulateProgramQuota } from "../api";
import {
  ArrowLeft,
  BookmarkPlus,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Sliders,
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
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedPrograms, setExpandedPrograms] = useState<Record<string, boolean>>({});
  const [simQuotas, setSimQuotas] = useState<Record<string, number>>({});
  const [simResults, setSimResults] = useState<Record<string, { rank: number; delta: number; loading: boolean }>>({});

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

  const toggleExpand = (code: string) => {
    setExpandedPrograms((prev) => ({
      ...prev,
      [code]: !prev[code],
    }));
  };

  const handleInlineQuotaChange = async (programCode: string, newQuota: number) => {
    setSimQuotas((prev) => ({ ...prev, [programCode]: newQuota }));
    setSimResults((prev) => ({
      ...prev,
      [programCode]: { rank: prev[programCode]?.rank || 0, delta: 0, loading: true },
    }));

    try {
      const res = await simulateProgramQuota(programCode, newQuota, studentRank);
      if (res.simulated_predicted_rank) {
        setSimResults((prev) => ({
          ...prev,
          [programCode]: {
            rank: res.simulated_predicted_rank || 0,
            delta: res.rank_delta || 0,
            loading: false,
          },
        }));
      }
    } catch {
      setSimResults((prev) => ({
        ...prev,
        [programCode]: { rank: 0, delta: 0, loading: false },
      }));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      {/* Top Navigation & Summary */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBackToForm}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition py-1 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kriterleri Düzenle</span>
          </button>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold">
              Puan Türü: {results.score_type}
            </span>
            <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold">
              Başarı Sıranız: {formatRank(studentRank)}
            </span>
            <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600">
              Toplam {items.length} Öneri
            </span>
          </div>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Kişiselleştirilmiş Tercih Önerileri
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Bu liste, girdiğiniz başarı sırası ve ilgi duyduğunuz bölümler doğrultusunda hazırlanmıştır. Tercih listenizde yerleşme güvenliğini artırmak için önerileri üç farklı kategoride değerlendirebilirsiniz.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              selectedCategory === "all"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Tüm Öneriler ({items.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory("target")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              selectedCategory === "target"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            Dengeli Tercihler ({countTarget})
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory("reach")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              selectedCategory === "reach"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100"
            }`}
          >
            Hedef Tercihler ({countReach})
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory("safe")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              selectedCategory === "safe"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            Güvenli Tercihler ({countSafe})
          </button>
        </div>

        {/* Understandable Category Explanation Guide */}
        <div className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3 border border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <strong className="text-blue-700 block">Dengeli Tercih:</strong>
            Başarı sıranızla en uyumlu olan ve listenizin merkezini oluşturması önerilen programlar.
          </div>
          <div>
            <strong className="text-amber-700 block">Hedef Tercih:</strong>
            Sıralamanızın biraz üzerinde kalan, listenizin ilk sıralarında değerlendirebileceğiniz alternatifler.
          </div>
          <div>
            <strong className="text-emerald-700 block">Güvenli Tercih:</strong>
            Sıralamanızın altında kalarak açıkta kalma riskini düşüren programlar.
          </div>
        </div>
      </div>

      {/* Program Cards Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {filteredItems.length} Program Listeleniyor
        </span>
        <span className="text-xs text-slate-500">
          Sıralama Uyumuna Göre Sıralandı
        </span>
      </div>

      {/* Cards List */}
      <div className="space-y-4">
        {filteredItems.map((prog) => {
          const isSaved = isShortlisted(prog.program_code);
          const isAhead = (prog.rank_distance ?? 0) < 0;
          const isExpanded = Boolean(expandedPrograms[prog.program_code]);
          const currentSimQuota = simQuotas[prog.program_code] ?? (prog.latest_quota || 50);
          const currentSimResult = simResults[prog.program_code];

          // Clean Turkish category label
          const categoryBadge =
            prog.category === "reach"
              ? { text: "Hedef Tercih", color: "bg-amber-50 text-amber-800 border-amber-200" }
              : prog.category === "safe"
              ? { text: "Güvenli Tercih", color: "bg-emerald-50 text-emerald-800 border-emerald-200" }
              : { text: "Dengeli Tercih", color: "bg-blue-50 text-blue-800 border-blue-200" };

          return (
            <div
              key={prog.program_code}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm hover:border-slate-300 transition space-y-4"
            >
              {/* Card Header: University, Department, Category & List Button */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {prog.university_name} {prog.city ? `• ${prog.city}` : ""}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${categoryBadge.color}`}
                    >
                      {categoryBadge.text}
                    </span>
                  </div>

                  <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    {prog.program_name}
                  </h2>

                  {prog.faculty && (
                    <p className="text-xs text-slate-500">
                      {prog.faculty}
                    </p>
                  )}
                </div>

                {/* List Button */}
                <div className="flex items-center gap-2 self-start flex-shrink-0 pt-1 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => onToggleShortlist(prog)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border cursor-pointer ${
                      isSaved
                        ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                    }`}
                  >
                    {isSaved ? (
                      <>
                        <BookmarkCheck className="w-3.5 h-3.5" />
                        <span>Listende (24)</span>
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
                      className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 transition"
                      title="YÖK Atlas Sayfasını Aç"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Essential Metrics: 4 Clean Columns */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    2026 Tahmini Sıralama
                  </span>
                  <span className="text-base font-bold text-slate-900 block mt-0.5">
                    {prog.latest_rank ? formatRank(Math.round(prog.latest_rank * 0.98)) : "—"}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Beklenen Başarı Aralığı
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    2025 Taban Sırası
                  </span>
                  <span className="text-base font-bold text-slate-700 block mt-0.5">
                    {prog.latest_rank ? formatRank(prog.latest_rank) : "Açıklanmadı"}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Son Yerleştirme Sonucu
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Sıralama Durumunuz
                  </span>
                  {prog.rank_distance !== null && prog.rank_distance !== undefined ? (
                    <span
                      className={`text-base font-bold block mt-0.5 ${
                        isAhead ? "text-emerald-700" : "text-slate-800"
                      }`}
                    >
                      {isAhead ? "+" : ""}
                      {formatRank(-prog.rank_distance)}
                      <span className="text-xs font-normal text-slate-500 ml-1">
                        ({isAhead ? "öndesiniz" : "geridesiniz"})
                      </span>
                    </span>
                  ) : (
                    <span className="text-base font-bold text-slate-500 block mt-0.5">—</span>
                  )}
                  <span className="text-[10px] text-slate-400 block">
                    Başarı Sıranıza Göre
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Kontenjan
                  </span>
                  <span className="text-base font-bold text-slate-700 block mt-0.5">
                    {prog.latest_quota ? `${formatRank(prog.latest_quota)} kişi` : "—"}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {prog.teaching_language || "Türkçe"}
                  </span>
                </div>
              </div>

              {/* Natural Guidance Explanation (2-3 Short Sentences) */}
              <div className="bg-blue-50/40 border border-blue-100/60 rounded-xl p-3.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <span className="font-semibold text-blue-900 block mb-0.5">
                  Neden Bu Bölüm Önerildi?
                </span>
                <p>
                  {prog.explanation}
                </p>
              </div>

              {/* Expandable "Detayları Gör" Toggle */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => toggleExpand(prog.program_code)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition py-1 cursor-pointer"
                >
                  <span>{isExpanded ? "Detayları Gizle" : "Detayları Gör"}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </button>

                {/* Inline Expanded Details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-4 text-xs text-slate-600 animate-in fade-in duration-200">
                    {/* Past Years Table */}
                    {prog.history && prog.history.length > 0 && (
                      <div>
                        <span className="font-semibold text-slate-800 block mb-2">
                          Geçmiş Yılların Taban Sıralama Geçmişi
                        </span>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-500 font-medium">
                                <th className="py-1.5 px-2">Yıl</th>
                                <th className="py-1.5 px-2">Kontenjan</th>
                                <th className="py-1.5 px-2">Gerçekleşen Taban Sıra</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {prog.history.map((h) => (
                                <tr key={h.year}>
                                  <td className="py-1.5 px-2 font-semibold text-slate-900">{h.year}</td>
                                  <td className="py-1.5 px-2">
                                    {h.published_quota ? `${h.published_quota} kişi` : "—"}
                                  </td>
                                  <td className="py-1.5 px-2 font-medium">
                                    {h.closing_rank ? formatRank(h.closing_rank) : "Açıklanmadı"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Program Information Tags */}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <span className="text-slate-700">
                        <strong>Öğretim Dili:</strong> {prog.teaching_language || "Türkçe"}
                      </span>
                      {prog.scholarship && (
                        <span className="text-slate-700">
                          <strong>Burs Durumu:</strong> {prog.scholarship}
                        </span>
                      )}
                      <span className="text-slate-700">
                        <strong>Program Kodu:</strong> {prog.program_code}
                      </span>
                    </div>

                    {/* Interactive Quota Simulator (What-If) */}
                    <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-slate-500" />
                          Kontenjan Değişimi Simülatörü
                        </span>
                        <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {currentSimQuota} Kişi
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500">
                        Kontenjan artırıldığında veya azaltıldığında taban sıralamasının nasıl değişebileceğini test edin:
                      </p>

                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-400">Daha Az</span>
                        <input
                          type="range"
                          min={Math.max(10, (prog.latest_quota || 50) - 30)}
                          max={(prog.latest_quota || 50) + 40}
                          step={5}
                          value={currentSimQuota}
                          onChange={(e) => handleInlineQuotaChange(prog.program_code, Number(e.target.value))}
                          className="w-full accent-blue-600 cursor-pointer"
                        />
                        <span className="text-[11px] text-slate-400">Daha Fazla</span>
                      </div>

                      {currentSimResult && (
                        <div className="text-xs pt-1 flex items-center justify-between text-slate-700">
                          <span>
                            {currentSimQuota === prog.latest_quota ? (
                              "Mevcut kontenjan baz alındı."
                            ) : (
                              <>
                                Yeni Tahmini Sıralama:{" "}
                                <strong className="text-blue-700 font-bold">
                                  {formatRank(currentSimResult.rank)}
                                </strong>{" "}
                                ({currentSimResult.delta < 0 ? "yaklaşık " + formatRank(Math.abs(currentSimResult.delta)) + " sıra öne çekebilir" : "yaklaşık " + formatRank(currentSimResult.delta) + " sıra gerileyebilir"})
                              </>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reassuring Disclaimer */}
      <div className="p-4 rounded-xl bg-slate-100/70 text-center text-xs text-slate-500 space-y-1">
        <p>
          Bilgilendirme: Bu sıralama tahminleri ve öneriler, geçmiş yerleştirme istatistikleri doğrultusunda hazırlanmış karar destek tavsiyeleridir. Kesin yerleşme taahhüdü içermez; nihai tercih listenizi bir rehberlik uzmanı eşliğinde oluşturmanız önerilir.
        </p>
      </div>
    </div>
  );
};
