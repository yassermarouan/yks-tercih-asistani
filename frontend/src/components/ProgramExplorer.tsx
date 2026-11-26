import React, { useState, useEffect } from "react";
import type { Program, SearchResponse } from "../types";
import { searchPrograms, formatRank } from "../api";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  GraduationCap,
} from "lucide-react";

interface Props {
  onSelectProgram: (program: Program) => void;
  initialQuery?: string;
}

const SCORE_TYPES = [
  { id: "ALL", label: "Tümü" },
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

  const [debouncedQuery, setDebouncedQuery] = useState<string>(initialQuery || "");
  const [scoreType, setScoreType] = useState<string>("ALL");
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(15);

  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

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
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-[#171A12] dark:text-zinc-100 tracking-tight">
            Program Rehberi
          </h2>
          <p className="text-sm text-[#6B7065] dark:text-zinc-400 mt-0.5">
            Üniversite, bölüm adı veya program kodu ile arama yapın ve geçmiş sıralamaları inceleyin.
          </p>
        </div>
        <span className="text-xs text-[#6B7065] font-mono">
          {data ? `${formatRank(data.total)} program` : ""}
        </span>
      </div>

      {/* Search & Filter Card */}
      <div className="bg-gradient-to-b from-[#F2F3EC] to-[#ECEEE3] dark:bg-none dark:bg-[#111114] border border-[#D0D5C6] dark:border-zinc-800/80 rounded-2xl p-4 space-y-3 shadow-[0_2px_10px_rgba(23,26,18,0.04)] dark:shadow-none">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7065]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Üniversite, bölüm adı veya kod arayın (Örn: ODTÜ Bilgisayar, Hukuk)..."
            className="w-full pl-10 pr-16 py-2.5 bg-[#E8EBE0] dark:bg-[#09090b] border border-[#D0D5C6] dark:border-zinc-800 rounded-xl text-[#171A12] dark:text-zinc-100 placeholder-[#6B7065]/75 dark:placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500 transition"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6B7065] hover:text-[#171A12] dark:hover:text-zinc-100 px-2 py-0.5 rounded bg-[#D0D5C6] dark:bg-zinc-800 cursor-pointer"
            >
              Temizle
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#D0D5C6] dark:border-zinc-800/60">
          {SCORE_TYPES.map((st) => {
            const isActive = scoreType === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => handleScoreTypeChange(st.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  isActive
                    ? "bg-[#C6F432] text-[#171A12] font-semibold"
                    : "bg-[#E8EBE0] dark:bg-[#09090b] border border-[#D0D5C6] dark:border-zinc-800 text-[#6B7065] dark:text-zinc-400 hover:text-[#171A12] dark:hover:text-zinc-100"
                }`}
              >
                {st.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results List */}
      <div className="bg-gradient-to-b from-[#F2F3EC] to-[#ECEEE3] dark:bg-none dark:bg-[#111114] border border-[#D0D5C6] dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-[0_2px_10px_rgba(23,26,18,0.04)] dark:shadow-none">
        {loading ? (
          <div className="py-20 text-center text-[#6B7065] dark:text-zinc-400">
            <div className="inline-block animate-spin rounded-full h-7 w-7 border-b-2 border-emerald-500 mb-3" />
            <p className="text-sm">Programlar aranıyor...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-rose-500 dark:text-rose-400 px-4 text-sm">{error}</div>
        ) : !data || data.items.length === 0 ? (
          <div className="py-16 text-center text-[#6B7065] dark:text-zinc-400 px-4">
            <GraduationCap className="w-10 h-10 text-[#6B7065] dark:text-zinc-600 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-[#171A12] dark:text-zinc-200">Uygun program bulunamadı</h4>
            <p className="text-xs text-[#6B7065] mt-1">
              Farklı bir arama kelimesi veya puan türü deneyebilirsiniz.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#D0D5C6] dark:divide-zinc-800/70">
            {data.items.map((prog) => {
              const sortedHist = [...(prog.history || [])].sort((a, b) => b.year - a.year);
              const latestRec = sortedHist[0];
              const latestRank = latestRec?.closing_rank;
              const latestQuota = latestRec?.published_quota;
              const latestYear = latestRec?.year || 2025;

              return (
                <div
                  key={prog.program_code}
                  onClick={() => onSelectProgram(prog)}
                  className="p-4 hover:bg-[#E5EDC8]/55 dark:hover:bg-zinc-900/60 cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="font-medium px-2 py-0.5 rounded bg-[#DFE4D5] dark:bg-zinc-800 text-[#171A12] dark:text-zinc-200">
                        {prog.score_type}
                      </span>
                      {prog.scholarship && (
                        <span className="text-amber-700 dark:text-amber-300 bg-amber-500/12 dark:bg-amber-500/10 px-2 py-0.5 rounded">
                          {prog.scholarship}
                        </span>
                      )}
                      <span className="font-mono text-[#6B7065] dark:text-zinc-500">{prog.program_code}</span>
                    </div>

                    <h4 className="text-sm sm:text-base font-semibold text-[#171A12] dark:text-zinc-100 group-hover:text-[#526B19] dark:group-hover:text-emerald-400 transition truncate">
                      {prog.program_name}
                    </h4>

                    <p className="text-xs text-[#6B7065] dark:text-zinc-400 truncate">
                      {prog.university_name}
                      {prog.city && ` • ${prog.city}`}
                      {prog.teaching_language && ` • ${prog.teaching_language}`}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#D0D5C6] dark:border-zinc-800/60 shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] text-[#6B7065] block">
                        {latestYear} Taban
                      </span>
                      <span className="text-sm font-semibold font-mono text-[#171A12] dark:text-zinc-100 block">
                        {latestRank ? formatRank(latestRank) : "Dolmadı"}
                      </span>
                      {latestQuota && (
                        <span className="text-[11px] text-[#6B7065] block">
                          {formatRank(latestQuota)} kontenjan
                        </span>
                      )}
                    </div>

                    <div className="p-2 rounded-lg bg-[#DFE4D5] dark:bg-zinc-900 group-hover:bg-[#C6F432] text-[#6B7065] dark:text-zinc-400 group-hover:text-zinc-950 transition">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {data && data.total_pages > 1 && (
          <div className="p-4 border-t border-[#D0D5C6] dark:border-zinc-800/70 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-[#6B7065] dark:text-zinc-400">
              Sayfa <strong className="text-[#171A12] dark:text-zinc-100">{data.page}</strong> / {data.total_pages}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="px-3 py-1.5 rounded-lg bg-[#E8EBE0] dark:bg-zinc-900 hover:bg-[#E5EDC8]/70 dark:hover:bg-zinc-800 border border-[#D0D5C6] dark:border-zinc-800 disabled:opacity-40 text-[#171A12] dark:text-zinc-200 flex items-center gap-1 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Önceki</span>
              </button>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                disabled={page >= data.total_pages || loading}
                className="px-3 py-1.5 rounded-lg bg-[#E8EBE0] dark:bg-zinc-900 hover:bg-[#E5EDC8]/70 dark:hover:bg-zinc-800 border border-[#D0D5C6] dark:border-zinc-800 disabled:opacity-40 text-[#171A12] dark:text-zinc-200 flex items-center gap-1 transition cursor-pointer"
              >
                <span>Sonraki</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
