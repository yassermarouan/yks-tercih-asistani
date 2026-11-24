import React, { useState, useEffect } from "react";
import type { Program, SearchResponse } from "../types";
import { searchPrograms, formatRank } from "../api";
import {
  Search,
  Building2,
  MapPin,
  Languages,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  ArrowRight,
  GraduationCap,
} from "lucide-react";

interface Props {
  onSelectProgram: (program: Program) => void;
  initialQuery?: string;
}

const SCORE_TYPES = [
  { id: "ALL", label: "Tüm Puan Türleri" },
  { id: "SAY", label: "Sayısal (SAY)" },
  { id: "EA", label: "Eşit Ağırlık (EA)" },
  { id: "SÖZ", label: "Sözel (SÖZ)" },
  { id: "DİL", label: "Dil (DİL)" },
];

export const ProgramExplorer: React.FC<Props> = ({ onSelectProgram, initialQuery }) => {
  const [query, setQuery] = useState<string>(initialQuery || "");

  useEffect(() => {
    if (initialQuery !== undefined) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");
  const [scoreType, setScoreType] = useState<string>("ALL");
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(15);

  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch search results
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    searchPrograms(debouncedQuery, scoreType, page, pageSize)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Arama sırasında hata oluştu.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, scoreType, page, pageSize]);

  const handleScoreTypeChange = (type: string) => {
    setScoreType(type);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Controls */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Üniversite, program adı veya kod ile arayın... (Örn: Abdullah Gül Mimarlık, Bilgisayar, 106510014)"
              className="w-full pl-11 pr-4 py-3 bg-black border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white px-1.5 py-0.5 rounded bg-zinc-800 cursor-pointer"
              >
                Temizle
              </button>
            )}
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-2 text-xs text-zinc-400 px-1">
            <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
            <span>
              Toplam Bulunan:{" "}
              <strong className="text-white font-mono">{data ? formatRank(data.total) : "—"}</strong> program
            </span>
          </div>
        </div>

        {/* Score Type Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-zinc-800">
          <span className="text-xs font-semibold text-zinc-400 mr-1">Puan Türü:</span>
          {SCORE_TYPES.map((st) => {
            const isActive = scoreType === st.id;
            return (
              <button
                key={st.id}
                onClick={() => handleScoreTypeChange(st.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? "bg-emerald-500 text-black font-extrabold shadow-md shadow-emerald-500/20"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white"
                }`}
              >
                {st.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Program List Table / Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-3"></div>
            <p className="text-sm">Programlar aranıyor ve listeleniyor...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-rose-400 px-4">
            <p className="text-sm">{error}</p>
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="py-20 text-center text-slate-400 px-4">
            <GraduationCap className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-slate-200">Aramanıza uygun program bulunamadı</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Farklı bir arama terimi deneyebilir veya puan türü filtresini &apos;Tüm Puan Türleri&apos; olarak seçebilirsiniz.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {data.items.map((prog) => {
              // Find latest year closing rank
              const sortedHist = [...(prog.history || [])].sort((a, b) => b.year - a.year);
              const latestRec = sortedHist[0];
              const latestRank = latestRec?.closing_rank;
              const latestQuota = latestRec?.published_quota;
              const latestYear = latestRec?.year || 2025;

              return (
                <div
                  key={prog.program_code}
                  onClick={() => onSelectProgram(prog)}
                  className="p-4 sm:p-5 hover:bg-slate-800/40 cursor-pointer transition flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
                        {prog.program_code}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                        {prog.score_type}
                      </span>
                      {prog.city && (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {prog.city}
                        </span>
                      )}
                      {prog.teaching_language && (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Languages className="w-3 h-3 text-slate-400" />
                          {prog.teaching_language}
                        </span>
                      )}
                      {prog.scholarship && (
                        <span className="text-[11px] text-amber-400/90 bg-amber-400/10 px-1.5 py-0.5 rounded">
                          {prog.scholarship}
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-white group-hover:text-emerald-400 transition tracking-tight">
                      {prog.program_name}
                    </h4>

                    <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                      {prog.university_name}
                      {prog.faculty && <span className="text-zinc-500 hidden sm:inline">• {prog.faculty}</span>}
                    </p>
                  </div>

                  {/* Right: Ranks & Action */}
                  <div className="flex items-center justify-between md:justify-end gap-6 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-800">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] uppercase font-semibold text-zinc-400 block tracking-wide">
                        {latestYear} Taban Sıra
                      </span>
                      <span className="text-sm font-bold font-mono text-white block">
                        {latestRank ? formatRank(latestRank) : <span className="text-zinc-500 font-normal">Açıklanmadı</span>}
                      </span>
                      {latestQuota && (
                        <span className="text-[11px] text-zinc-400 block mt-0.5">
                          Kontenjan: {formatRank(latestQuota)}
                        </span>
                      )}
                    </div>

                    <div className="p-2.5 rounded-xl bg-zinc-900 group-hover:bg-emerald-500 text-zinc-400 group-hover:text-black transition">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {data && data.total_pages > 1 && (
          <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
            <span className="text-slate-400">
              Sayfa <strong className="text-white">{data.page}</strong> / {data.total_pages} (Toplam {formatRank(data.total)} program)
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 flex items-center gap-1 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                Önceki
              </button>

              <button
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                disabled={page >= data.total_pages || loading}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 flex items-center gap-1 transition"
              >
                Sonraki
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
