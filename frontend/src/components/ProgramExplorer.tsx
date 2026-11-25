import React, { useState, useEffect } from "react";
import type { Program, SearchResponse } from "../types";
import { searchPrograms, formatRank } from "../api";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
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
          setError(err.message || "Arama sırasında bir hata oluştu.");
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Search Header Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Üniversite ve Program Arama
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Türkiye genelindeki lisans programlarını arayabilir, geçmiş yılların taban sıralamalarını inceleyebilirsiniz.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Üniversite veya bölüm adı arayın (Örn: Hacettepe Tıp, ODTÜ Bilgisayar, Hukuk)..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition"
          />
        </div>

        {/* Score Type Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 mr-1">
            Puan Türü:
          </span>
          {SCORE_TYPES.map((st) => (
            <button
              type="button"
              key={st.id}
              onClick={() => handleScoreTypeChange(st.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                scoreType === st.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      {data && (
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>Toplam {data.total.toLocaleString("tr-TR")} program bulundu</span>
          <span>
            Sayfa {data.page} / {data.total_pages || 1}
          </span>
        </div>
      )}

      {/* Program Cards / List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="inline-block animate-spin rounded-full h-7 w-7 border-2 border-slate-300 border-t-blue-600 mb-2" />
            <p className="text-xs">Programlar listeleniyor...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs text-center">
            {error}
          </div>
        ) : data && data.items.length > 0 ? (
          data.items.map((prog) => {
            const sortedHistory = [...(prog.history || [])].sort((a, b) => b.year - a.year);
            const latestHistory = sortedHistory[0];

            return (
              <div
                key={prog.program_code}
                className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-xs hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                      {prog.score_type}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 uppercase">
                      {prog.university_name} {prog.city ? `• ${prog.city}` : ""}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {prog.program_name}
                  </h3>

                  {prog.faculty && (
                    <p className="text-xs text-slate-500">
                      {prog.faculty}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Son Taban Sıra
                    </span>
                    <span className="text-sm font-bold text-slate-800 block">
                      {latestHistory?.closing_rank ? formatRank(latestHistory.closing_rank) : "Açıklanmadı"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectProgram(prog)}
                    className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Detayları Gör</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            Aramanızla eşleşen program bulunamadı. Lütfen farklı bir arama terimi deneyiniz.
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2 py-4">
          <button
            type="button"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
            title="Önceki Sayfa"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs text-slate-600 px-3 py-1 font-medium">
            {page} / {data.total_pages}
          </span>

          <button
            type="button"
            onClick={() => setPage(Math.min(data.total_pages, page + 1))}
            disabled={page === data.total_pages}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
            title="Sonraki Sayfa"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
