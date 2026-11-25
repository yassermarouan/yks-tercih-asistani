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
import { AiChatMentor } from "./components/AiChatMentor";
import {
  Compass,
  BookOpen,
  MessageSquare,
  ListOrdered,
} from "lucide-react";

const SHORTLIST_STORAGE_KEY = "yks_shortlist_programs";
const FORM_STORAGE_KEY = "yks_saved_form_payload";

export function App() {
  const [activeTab, setActiveTab] = useState<"advisor" | "explorer" | "mentor">("advisor");

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

  // Handle relaxing filter if no matches
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div
            onClick={() => {
              setActiveTab("advisor");
              setAdvisorResults(null);
            }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs transition group-hover:bg-blue-700">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
                YKS Tercih Rehberi
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Üniversite Tercih ve Danışmanlık Platformu
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("advisor")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === "advisor"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Tercih Danışmanı</span>
            </button>

            <button
              onClick={() => setActiveTab("explorer")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === "explorer"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Program Arama</span>
            </button>

            <button
              onClick={() => setActiveTab("mentor")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === "mentor"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Rehberlik Danışmanı</span>
            </button>
          </div>

          {/* Shortlist Counter Button in Header */}
          {shortlist.length > 0 && (
            <button
              onClick={() => setAuditModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-semibold transition cursor-pointer"
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Listen ({shortlist.length}/24)</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === "advisor" ? (
          loadingMeta ? (
            <div className="py-24 text-center text-slate-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-blue-600 mb-3" />
              <p className="text-sm">Tercih verileri yükleniyor...</p>
            </div>
          ) : !metadata ? (
            <div className="py-16 text-center text-amber-700 bg-amber-50 rounded-2xl p-6 border border-amber-200 max-w-lg mx-auto">
              <p className="text-sm">Tercih verileri yüklenemedi. Lütfen internet bağlantınızı kontrol edip sayfayı yenileyiniz.</p>
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
            <ProgramExplorer
              onSelectProgram={(prog) => setSelectedProgram(prog)}
            />
          </div>
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

      {/* Floating Comparison Bar & Modal */}
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

      {/* What-If Simulator Modal */}
      {simulationProgram && (
        <WhatIfSimulatorModal
          program={simulationProgram}
          studentRank={advisorResults?.student_rank || (formPayload?.rank ? Number(formPayload?.rank) : undefined)}
          onClose={() => setSimulationProgram(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 YKS Tercih Rehberi • Üniversite Tercih ve Danışmanlık Platformu</p>
          <p className="text-slate-400">
            Resmi ÖSYM ve YÖK Atlas verileri esas alınarak hazırlanmıştır.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
