import { useState, useEffect } from "react";
import type {
  Program,
  AdvisorMetadata,
  StudentPreferencePayload,
  AdvisorResponse,
  RecommendedProgram,
} from "./types";
import { getAdvisorMetadata, recommendPrograms, getProgramDetail } from "./api";
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
  Compass,
  BookOpen,
  SlidersHorizontal,
  MapPin,
  Activity,
  Bot,
} from "lucide-react";

const SHORTLIST_STORAGE_KEY = "yks_shortlist_programs";
const FORM_STORAGE_KEY = "yks_saved_form_payload";

export function App() {
  const [activeTab, setActiveTab] = useState<"advisor" | "explorer" | "map" | "trends" | "mentor">("advisor");
  const [cityFilterFromMap, setCityFilterFromMap] = useState<string>("");

  // Advisor state
  const [metadata, setMetadata] = useState<AdvisorMetadata | null>(null);
  const [loadingMeta, setLoadingMeta] = useState<boolean>(true);
  const [formPayload, setFormPayload] = useState<StudentPreferencePayload | null>(() => {
    try {
      const saved = sessionStorage.getItem(FORM_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [advisorResults, setAdvisorResults] = useState<AdvisorResponse | null>(null);
  const [loadingAdvisor, setLoadingAdvisor] = useState<boolean>(false);

  // Shortlist state (up to 24 programs)
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

  // Modal states
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [simulationProgram, setSimulationProgram] = useState<Program | RecommendedProgram | null>(null);

  // Load advisor metadata on startup
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

  // Save shortlist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SHORTLIST_STORAGE_KEY, JSON.stringify(shortlist));
    } catch (e) {
      console.error("Shortlist save error:", e);
    }
  }, [shortlist]);

  // Handle preference form submit
  const handlePreferenceSubmit = (payload: StudentPreferencePayload) => {
    setLoadingAdvisor(true);
    setFormPayload(payload);
    try {
      sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }

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

  // Handle relaxing a hard filter from FilterRelaxationModal
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

  // Shortlist management
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

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 bg-black/90 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div
            onClick={() => {
              setActiveTab("advisor");
              setAdvisorResults(null);
            }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-black flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition">
              <Compass className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-white tracking-tight">
                  YKS Tercih Asistanı
                </h1>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Kişiselleştirilmiş Lisans Tercih Danışmanı
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab("advisor")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === "advisor"
                  ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Tercih Danışmanı</span>
            </button>

            <button
              onClick={() => setActiveTab("explorer")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === "explorer"
                  ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Program Rehberi</span>
            </button>

            <button
              onClick={() => setActiveTab("map")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === "map"
                  ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Türkiye Haritası</span>
            </button>

            <button
              onClick={() => setActiveTab("trends")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === "trends"
                  ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>YKS Trend Borsası</span>
            </button>

            <button
              onClick={() => setActiveTab("mentor")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer relative ${
                activeTab === "mentor"
                  ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>AI Danışman</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === "advisor" ? (
          loadingMeta ? (
            <div className="py-24 text-center text-slate-400">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-3"></div>
              <p className="text-sm">Tercih danışmanı verileri yükleniyor...</p>
            </div>
          ) : !metadata ? (
            <div className="py-16 text-center text-rose-400">
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
              loading={loadingAdvisor}
            />
          )
        ) : activeTab === "explorer" ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-zinc-300">
                <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                <span>
                  <strong className="text-white">Program Rehberi & Yapay Zeka Analiz Paneli:</strong> Tüm Türkiye lisans programlarını inceleyebilir, geçmiş kontenjan trendlerini ve gelecek dönem yapay zeka taban sıralaması projeksiyonlarını keşfedebilirsiniz.
                </span>
              </div>
            </div>
            <ProgramExplorer
              initialQuery={cityFilterFromMap}
              onSelectProgram={(prog) => setSelectedProgram(prog)}
            />
          </div>
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

      {/* Floating Comparison & 24-List Drawer */}
      <ComparisonDrawer
        shortlist={shortlist}
        studentRank={advisorResults?.student_rank || (formPayload?.rank ? Number(formPayload?.rank) : undefined)}
        onRemove={handleRemoveFromShortlist}
        onClear={handleClearShortlist}
        isOpen={comparisonModalOpen}
        onOpenModal={() => setComparisonModalOpen(true)}
        onCloseModal={() => setComparisonModalOpen(false)}
        onOpenAuditModal={() => setAuditModalOpen(true)}
      />

      {/* 24-Choice Preference List Audit & PDF Modal */}
      {auditModalOpen && (
        <PreferenceListAuditModal
          shortlist={shortlist}
          studentRank={advisorResults?.student_rank || (formPayload?.rank ? Number(formPayload?.rank) : undefined)}
          scoreType={advisorResults?.score_type || formPayload?.score_type || "SAY"}
          onReorder={(newList) => setShortlist(newList)}
          onRemove={handleRemoveFromShortlist}
          onClear={handleClearShortlist}
          onClose={() => setAuditModalOpen(false)}
        />
      )}

      {/* Program Detail Modal */}
      {selectedProgram && (
        <ProgramDetailModal
          program={selectedProgram}
          studentRank={advisorResults?.student_rank || (formPayload?.rank ? Number(formPayload?.rank) : undefined)}
          onClose={() => setSelectedProgram(null)}
          onOpenSimulator={(prog) => setSimulationProgram(prog)}
        />
      )}

      {/* What-If Quota Sensitivity Simulator Modal (Highest stacking level) */}
      {simulationProgram && (
        <WhatIfSimulatorModal
          program={simulationProgram}
          studentRank={advisorResults?.student_rank || (formPayload?.rank ? Number(formPayload?.rank) : undefined)}
          onClose={() => setSimulationProgram(null)}
        />
      )}

      {/* Floating AI Mentor Quick-Access Trigger */}
      {activeTab !== "mentor" && (
        <button
          onClick={() => setActiveTab("mentor")}
          className="fixed bottom-6 right-6 z-40 px-4 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold shadow-2xl shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer border-2 border-black group"
          title="AI Tercih Danışmanına Sor"
        >
          <div className="relative">
            <Bot className="w-5 h-5 stroke-[2.4]" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-black rounded-full animate-ping" />
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-black leading-tight">AI Danışmana Sor</div>
            <div className="text-[10px] opacity-80 font-medium">Rehberlik & Analiz</div>
          </div>
        </button>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-black py-6 text-center text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 YKS Tercih Asistanı • Resmi YÖK Atlas ve ÖSYM Açık Verileriyle Desteklenmektedir.</p>
          <p className="text-zinc-500">
            Merkezi YKS Lisans Yerleştirme Karar Destek Asistanı
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
