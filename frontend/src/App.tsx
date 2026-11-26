import { useState, useEffect } from "react";
import type {
  Program,
  AdvisorMetadata,
  StudentPreferencePayload,
  AdvisorResponse,
  RecommendedProgram,
} from "./types";
import { getAdvisorMetadata, recommendPrograms, getProgramDetail, formatRank } from "./api";
import { Sidebar, type NavTab } from "./components/Sidebar";

const TAB_TITLES: Record<NavTab, string> = {
  advisor: "Tercih Danışmanı",
  explorer: "Program Rehberi",
  map: "Şehir Haritası",
  trends: "Bölüm Trendleri",
  mentor: "AI Danışman",
};

import { StudentPreferenceForm } from "./components/StudentPreferenceForm";
import { AdvisorResults } from "./components/AdvisorResults";
import { FilterRelaxationModal } from "./components/FilterRelaxationModal";
import { ComparisonDrawer } from "./components/ComparisonDrawer";
import { ProgramExplorer } from "./components/ProgramExplorer";
import { ProgramDetailModal } from "./components/ProgramDetailModal";
import { WhatIfSimulatorModal } from "./components/WhatIfSimulatorModal";
import { PreferenceListAuditModal } from "./components/PreferenceListAuditModal";
import { TurkeyPreferenceMap } from "./components/TurkeyPreferenceMap";
import { TrendMarketDashboard } from "./components/TrendMarketDashboard";
import { AiChatMentor } from "./components/AiChatMentor";
import {
  Menu,
  BookmarkCheck,
  Scale,
  MessageSquare,
  Sun,
  Moon,
} from "lucide-react";

const SHORTLIST_STORAGE_KEY = "yks_shortlist_programs";
const THEME_STORAGE_KEY = "yks_theme";

export function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      return saved === "light" || saved === "dark" ? saved : "dark";
    } catch {
      return "dark";
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const [activeTab, setActiveTab] = useState<NavTab>("advisor");
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [cityFilterFromMap, setCityFilterFromMap] = useState<string>("");

  const [metadata, setMetadata] = useState<AdvisorMetadata | null>(null);
  const [loadingMeta, setLoadingMeta] = useState<boolean>(true);
  const [formPayload, setFormPayload] = useState<StudentPreferencePayload | null>(null);

  const [advisorResults, setAdvisorResults] = useState<AdvisorResponse | null>(null);
  const [loadingAdvisor, setLoadingAdvisor] = useState<boolean>(false);

  const [shortlist, setShortlist] = useState<RecommendedProgram[]>(() => {
    try {
      const saved = localStorage.getItem(SHORTLIST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [comparisonModalOpen, setComparisonModalOpen] = useState<boolean>(false);
  const [auditModalOpen, setAuditModalOpen] = useState<boolean>(false);

  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [simulationProgram, setSimulationProgram] = useState<Program | RecommendedProgram | null>(null);

  useEffect(() => {
    getAdvisorMetadata()
      .then((data) => {
        setMetadata(data);
        setLoadingMeta(false);
      })
      .catch((err) => {
        console.error("Metadata load error:", err);
        setLoadingMeta(false);
      });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SHORTLIST_STORAGE_KEY, JSON.stringify(shortlist));
    } catch (e) {
      console.error("Shortlist save error:", e);
    }
  }, [shortlist]);

  const handlePreferenceSubmit = (payload: StudentPreferencePayload) => {
    setLoadingAdvisor(true);
    setFormPayload(payload);

    recommendPrograms(payload)
      .then((res) => {
        setAdvisorResults(res);
        setLoadingAdvisor(false);
      })
      .catch((err) => {
        console.error("Recommend error:", err);
        setAdvisorResults({
          status: "error",
          message: err.message || "Öneriler hesaplanırken bir hata oluştu.",
        });
        setLoadingAdvisor(false);
      });
  };

  const handleResetForm = () => {
    setFormPayload(null);
    setAdvisorResults(null);
  };

  const handleRelaxFilter = (criteriaKey: string) => {
    if (!formPayload) return;

    const updated = { ...formPayload };
    if (criteriaKey === "tuition_strict") {
      updated.tuition_strict = false;
      updated.max_tuition = null;
    } else if (criteriaKey === "cities_strict") {
      updated.cities_strict = false;
    } else if (criteriaKey === "language_strict") {
      updated.language_strict = false;
      updated.teaching_language = "all";
    } else if (criteriaKey === "university_type_strict") {
      updated.university_type_strict = false;
      updated.university_type = "all";
    } else if (criteriaKey === "scholarship_strict") {
      updated.scholarship_strict = false;
      updated.scholarship = "all";
    }

    handlePreferenceSubmit(updated);
  };

  const handleToggleShortlist = (prog: RecommendedProgram) => {
    if (shortlist.some((p) => p.program_code === prog.program_code)) {
      setShortlist(shortlist.filter((p) => p.program_code !== prog.program_code));
    } else {
      if (shortlist.length >= 24) {
        alert("ÖSYM tercih kılavuzuna göre en fazla 24 program ekleyebilirsiniz. Yeni bir tane eklemek için önce listenizden birini çıkarın.");
        return;
      }
      setShortlist([...shortlist, prog]);
    }
  };

  const handleRemoveFromShortlist = (programCode: string) => {
    setShortlist(shortlist.filter((p) => p.program_code !== programCode));
  };

  const handleClearShortlist = () => {
    setShortlist([]);
  };

  const activeRank =
    advisorResults?.student_rank ||
    (formPayload?.rank ? Number(formPayload.rank) : undefined);

  const activeScoreType =
    advisorResults?.score_type || formPayload?.score_type || undefined;

  const studentSummary =
    activeRank && activeScoreType
      ? `${activeScoreType} • ${formatRank(activeRank)}`
      : null;

  const pageTitle = TAB_TITLES[activeTab] || "Tercih Danışmanı";

  return (
    <div className="min-h-screen bg-[#E8EBE0] dark:bg-[#09090b] text-[#171A12] dark:text-zinc-100 flex font-sans transition-colors duration-200">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab !== "explorer") setCityFilterFromMap("");
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        shortlistCount={shortlist.length}
        onOpenAuditModal={() => setAuditModalOpen(true)}
        onOpenCompareModal={() => setComparisonModalOpen(true)}
        studentSummary={studentSummary}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Minimal Header Bar */}
        <header className="h-14 sticky top-0 z-30 bg-[#E8EBE0]/90 dark:bg-[#09090b]/90 backdrop-blur-md border-b border-[#D0D5C6] dark:border-zinc-800/80 px-4 sm:px-6 flex items-center justify-between gap-3 transition-colors duration-200">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-[#6B7065] dark:text-zinc-400 hover:text-[#171A12] dark:hover:text-zinc-100 hover:bg-[#DFE4D5] dark:hover:bg-zinc-800/60 transition cursor-pointer"
              aria-label="Menüyü aç"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm sm:text-base font-semibold text-[#171A12] dark:text-zinc-100 truncate">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {shortlist.length > 1 && (
              <button
                type="button"
                onClick={() => setComparisonModalOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#F0F1E9] dark:bg-zinc-900 hover:bg-[#E5EDC8] dark:hover:bg-zinc-800 text-[#171A12] dark:text-zinc-200 border border-[#D0D5C6] dark:border-zinc-800 transition cursor-pointer shadow-xs dark:shadow-none"
              >
                <Scale className="w-3.5 h-3.5 text-[#526B19] dark:text-zinc-400" />
                <span>Karşılaştır</span>
              </button>
            )}

            {shortlist.length > 0 && (
              <button
                type="button"
                onClick={() => setAuditModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold dark:font-medium bg-[#E5EDC8] dark:bg-emerald-500/15 hover:bg-[#dbe6b8] dark:hover:bg-emerald-500/20 text-[#526B19] dark:text-emerald-400 border border-[#CBD6A4] dark:border-emerald-500/25 transition cursor-pointer"
              >
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span>Listem ({shortlist.length}/24)</span>
              </button>
            )}

            {activeTab !== "mentor" && (
              <button
                type="button"
                onClick={() => setActiveTab("mentor")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#F0F1E9] dark:bg-zinc-900 hover:bg-[#E5EDC8] dark:hover:bg-zinc-800 text-[#171A12] dark:text-zinc-300 border border-[#D0D5C6] dark:border-zinc-800 transition cursor-pointer shadow-xs dark:shadow-none"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#526B19] dark:text-emerald-400" />
                <span className="hidden sm:inline">Danışmana Sor</span>
              </button>
            )}

            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-[#F0F1E9] dark:bg-zinc-900 hover:bg-[#E5EDC8] dark:hover:bg-zinc-800 border border-[#D0D5C6] dark:border-zinc-800 text-[#526B19] dark:text-zinc-300 transition cursor-pointer shadow-xs dark:shadow-none"
              title={theme === "dark" ? "Açık Tema" : "Koyu Tema"}
              aria-label={theme === "dark" ? "Açık Temaya Geç" : "Koyu Temaya Geç"}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-[#526B19]" />
              )}
            </button>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === "advisor" ? (
            loadingMeta ? (
              <div className="py-24 text-center text-[#6B7065] dark:text-zinc-400">
                <div className="inline-block animate-spin rounded-full h-7 w-7 border-b-2 border-[#526B19] dark:border-emerald-500 mb-3" />
                <p className="text-sm">Tercih verileri yükleniyor...</p>
              </div>
            ) : !metadata ? (
              <div className="py-16 text-center text-rose-700 dark:text-rose-400">
                <p className="text-sm">Tercih verileri yüklenemedi. Lütfen sayfayı yenileyin.</p>
              </div>
            ) : advisorResults?.status === "no_matches" ? (
              <FilterRelaxationModal
                message={advisorResults.message}
                suggestions={advisorResults.relaxation_suggestions || []}
                onRelax={handleRelaxFilter}
                onBackToForm={() => setAdvisorResults(null)}
              />
            ) : advisorResults?.status === "success" ? (
              <AdvisorResults
                results={advisorResults}
                onBackToForm={() => setAdvisorResults(null)}
                shortlist={shortlist}
                onToggleShortlist={handleToggleShortlist}
                onSelectProgramForDetail={(code) => {
                  getProgramDetail(code)
                    .then((p) => setSelectedProgram(p))
                    .catch((err) => console.error("Program load error:", err));
                }}
                onOpenSimulator={(prog) => setSimulationProgram(prog)}
              />
            ) : (
              <StudentPreferenceForm
                metadata={metadata}
                initialValues={formPayload}
                onSubmit={handlePreferenceSubmit}
                onReset={handleResetForm}
                loading={loadingAdvisor}
              />
            )
          ) : activeTab === "explorer" ? (
            <ProgramExplorer
              initialQuery={cityFilterFromMap}
              onSelectProgram={(prog) => setSelectedProgram(prog)}
            />
          ) : activeTab === "map" ? (
            <TurkeyPreferenceMap
              onSelectCityForSearch={(cityName) => {
                setCityFilterFromMap(cityName);
                setActiveTab("explorer");
              }}
            />
          ) : activeTab === "trends" ? (
            <TrendMarketDashboard
              onSelectProgram={(code) => {
                getProgramDetail(code)
                  .then((p) => setSelectedProgram(p))
                  .catch((err) => console.error("Program load error:", err));
              }}
            />
          ) : (
            <AiChatMentor
              studentProfile={formPayload}
              shortlist={shortlist}
              onAddToShortlist={handleToggleShortlist}
              onOpenDetailModal={(code) => {
                getProgramDetail(code)
                  .then((p) => setSelectedProgram(p))
                  .catch((err) => console.error("Program load error:", err));
              }}
              onOpenSimulationModal={(code) => {
                getProgramDetail(code)
                  .then((p) => setSimulationProgram(p))
                  .catch((err) => console.error("Simulation load error:", err));
              }}
            />
          )}
        </main>
      </div>

      <ComparisonDrawer
        shortlist={shortlist}
        studentRank={activeRank}
        onRemove={handleRemoveFromShortlist}
        onClear={handleClearShortlist}
        isOpen={comparisonModalOpen}
        onOpenModal={() => setComparisonModalOpen(true)}
        onCloseModal={() => setComparisonModalOpen(false)}
        onOpenAuditModal={() => setAuditModalOpen(true)}
      />

      {auditModalOpen && (
        <PreferenceListAuditModal
          shortlist={shortlist}
          studentRank={activeRank}
          scoreType={activeScoreType || "SAY"}
          onReorder={(newList) => setShortlist(newList)}
          onRemove={handleRemoveFromShortlist}
          onClear={handleClearShortlist}
          onClose={() => setAuditModalOpen(false)}
        />
      )}

      {selectedProgram && (
        <ProgramDetailModal
          program={selectedProgram}
          studentRank={activeRank}
          onClose={() => setSelectedProgram(null)}
          onOpenSimulator={(prog) => setSimulationProgram(prog)}
        />
      )}

      {simulationProgram && (
        <WhatIfSimulatorModal
          program={simulationProgram}
          studentRank={activeRank}
          onClose={() => setSimulationProgram(null)}
        />
      )}
    </div>
  );
}

export default App;
