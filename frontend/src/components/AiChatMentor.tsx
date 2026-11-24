import React, { useState, useRef, useEffect } from "react";
import type {
  ChatMessage,
  ChatReferencedProgram,
  StudentPreferencePayload,
  RecommendedProgram,
} from "../types";
import { sendChatMessage, formatRank, getProgramDetail } from "../api";
import {
  Bot,
  Send,
  User,
  Sparkles,
  Trash2,
  Building2,
  GraduationCap,
  Eye,
  Plus,
  Check,
  SlidersHorizontal,
  ShieldCheck,
  HelpCircle,
  MapPin,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Props {
  studentProfile?: StudentPreferencePayload | null;
  shortlist: RecommendedProgram[];
  onAddToShortlist: (prog: RecommendedProgram) => void;
  onOpenDetailModal: (progCode: string) => void;
  onOpenSimulationModal: (progCode: string) => void;
}

const DEFAULT_SUGGESTIONS = [
  "24 tercihimi Üst Hedef, İdeal ve Güvenli Liman olarak nasıl dağıtmalıyım?",
  "Sayısal 45.000 ile hangi Bilgisayar ve Yazılım Mühendislikleri gelir?",
  "Eşit Ağırlıkta 80.000 sıralamayla Hukuk mu YBS mi tercih etmeliyim?",
  "Ölü tercih nedir ve tercihlerimi sıralarken nelere dikkat etmeliyim?",
  "Öğrenci yaşam maliyeti ve barınma için hangi şehirleri önerirsin?",
  "2026'da taban sıralaması en çok yükselen (popüler) bölümler hangileri?",
];

export const AiChatMentor: React.FC<Props> = ({
  studentProfile,
  shortlist,
  onAddToShortlist,
  onOpenDetailModal,
  onOpenSimulationModal,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: "welcome-1",
        role: "assistant",
        content: `Merhaba! Ben **Akıllı YKS Tercih Danışmanın**. 🎓

Sana sadece kuru rakamlar vermek yerine; her bölümün **2026 beklenen taban sırasını, kontenjan değişimlerini, son yıllardaki talep artışlarını** ve **güvenli tercih aralığını** nedenleriyle birlikte açıklıyorum.

Bana YKS başarı sıranı, aklındaki bölümleri, şehirleri ya da 24 tercihi nasıl sıralaman gerektiğini sorabilirsin!`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestions: DEFAULT_SUGGESTIONS.slice(0, 3),
      },
    ];
  });

  const [inputMessage, setInputMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [expandedXaiCode, setExpandedXaiCode] = useState<string | null>(null);
  const [studentRank, setStudentRank] = useState<number | null>(
    studentProfile?.rank ? Number(studentProfile.rank) : null
  );
  const [scoreType, setScoreType] = useState<string>(studentProfile?.score_type || "SAY");
  const [profileExpanded, setProfileExpanded] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Sync profile if prop changes
  useEffect(() => {
    if (studentProfile?.rank) {
      setStudentRank(Number(studentProfile.rank));
    }
    if (studentProfile?.score_type) {
      setScoreType(studentProfile.score_type);
    }
  }, [studentProfile]);

  // Auto scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputMessage("");
    setLoading(true);

    try {
      // Build conversation history for API
      const conversationHistory = newHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await sendChatMessage({
        message: text,
        conversation_history: conversationHistory,
        student_context: {
          rank: studentRank,
          score_type: scoreType,
          preferred_cities: studentProfile?.preferred_cities || [],
          target_programs: studentProfile?.target_programs || [],
        },
      });

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        source: res.source,
        model: res.model,
        referenced_programs: res.referenced_programs,
        suggestions: res.suggestions,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `⚠️ Bir bağlantı sorunu oluştu: ${err.message || "Lütfen sorunuzu tekrar iletin."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestions: [
          "24 tercihi nasıl dağıtmalıyım?",
          "Ölü tercih nedir?",
        ],
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAddReferencedToShortlist = async (p: ChatReferencedProgram) => {
    try {
      const fullProg = await getProgramDetail(p.program_code);
      const recProg: RecommendedProgram = {
        ...fullProg,
        latest_rank: p.latest_rank,
        latest_quota: null,
        rank_distance: studentRank && p.latest_rank ? studentRank - p.latest_rank : 0,
        category: p.category,
        category_label: p.category_label,
        category_description: "",
        strategic_tier: p.category_label,
        preference_fit_score: 85,
        rank_fit_score: 85,
        total_score: 85,
        matches_notes: ["AI Danışman Tavsiyesi"],
        trade_offs: [],
        explanation: `${p.university_name} ${p.program_name} programı AI Tercih Danışmanı tarafından önerildi.`,
      };
      onAddToShortlist(recProg);
    } catch (e) {
      console.error("Program detayı alınamadı:", e);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome-reset",
        role: "assistant",
        content: "Sohbet sıfırlandı. Yeni bir tercih sorusuyla başlayabilirsin! 🎓",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestions: DEFAULT_SUGGESTIONS.slice(0, 3),
      },
    ]);
  };

  // Helper to render formatted Markdown text
  const renderFormattedContent = (content: string) => {
    const lines = content.split("\n");
    return (
      <div className="space-y-2 text-xs sm:text-sm leading-relaxed">
        {lines.map((line, idx) => {
          // Headers
          if (line.startsWith("### ")) {
            return (
              <h4 key={idx} className="text-sm sm:text-base font-bold text-white pt-2 border-b border-zinc-800 pb-1">
                {line.replace("### ", "")}
              </h4>
            );
          }
          if (line.startsWith("## ")) {
            return (
              <h3 key={idx} className="text-base sm:text-lg font-black text-emerald-400 pt-2">
                {line.replace("## ", "")}
              </h3>
            );
          }
          // Bullets
          if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
            const clean = line.trim().replace(/^[-*]\s+/, "");
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInline(clean) }} />
              </div>
            );
          }
          // Numbered lists (1. , 2. )
          if (/^\d+\.\s+/.test(line.trim())) {
            return (
              <div key={idx} className="pl-2" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
            );
          }
          // Empty line
          if (!line.trim()) {
            return <div key={idx} className="h-1.5" />;
          }
          // Regular paragraph
          return (
            <p key={idx} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
          );
        })}
      </div>
    );
  };

  // Basic inline formatting: **bold** and `code`
  const formatInline = (text: string) => {
    let res = text.replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="text-white font-extrabold">$1</strong>'
    );
    res = res.replace(
      /`([^`]+)`/g,
      '<code class="px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-[11px]">$1</code>'
    );
    return res;
  };

  const isShortlisted = (code: string) => {
    return shortlist.some((s) => s.program_code === code);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-5xl mx-auto w-full px-2 sm:px-4 animate-fade-in">
      {/* Top Header & Mentor Status */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 mb-3 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-black flex items-center justify-center font-bold shadow-lg shadow-emerald-500/20">
              <Bot className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-black rounded-full animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white tracking-tight">
                Akıllı YKS Tercih Danışmanı
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Uzman Rehberlik</span>
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
              <span>YÖK Atlas & Akıllı Tercih Rehberi</span>
              <span>•</span>
              <span className="text-zinc-500">13.581 Program Verisi</span>
            </p>
          </div>
        </div>

        {/* Right Controls: Profile Summary & Clear Chat */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setProfileExpanded(!profileExpanded)}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {studentRank ? `${scoreType} • ${formatRank(studentRank)}` : "Profil Ayarla"}
            </span>
          </button>

          <button
            onClick={clearChat}
            title="Sohbeti Temizle"
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Quick Profile Bar */}
      {profileExpanded && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-3 animate-fade-in text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="font-bold text-white flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-emerald-400" />
              Öğrenci Tercih Parametreleri
            </span>
            <span className="text-zinc-400 text-[11px]">
              AI yanıtları bu sıralamaya göre kişiselleştirilir.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1 text-[11px]">Puan Türü:</label>
              <div className="flex gap-2">
                {["SAY", "EA", "SÖZ", "DİL"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setScoreType(st)}
                    className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                      scoreType === st
                        ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                        : "bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1 text-[11px]">YKS Başarı Sıran:</label>
              <input
                type="number"
                value={studentRank || ""}
                onChange={(e) => setStudentRank(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Örn: 45000"
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 sm:pr-2">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 sm:gap-3 ${
                isUser ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  isUser
                    ? "bg-zinc-800 text-white"
                    : "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 stroke-[2.5]" />}
              </div>

              {/* Message Content Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 shadow-md ${
                  isUser
                    ? "bg-zinc-900 border border-zinc-800 text-white rounded-tr-none"
                    : "bg-zinc-950 border border-zinc-800/90 text-zinc-200 rounded-tl-none space-y-3"
                }`}
              >
                {/* Text Content */}
                {renderFormattedContent(msg.content)}

                {/* In-Chat Interactive Explainable AI Program Cards */}
                {msg.referenced_programs && msg.referenced_programs.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-zinc-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Önerilen Programlar ve Sıralama Analizi ({msg.referenced_programs.length})
                      </span>
                      <span className="text-[10px] text-zinc-500">YÖK Atlas & Tercih Analizi</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {msg.referenced_programs.map((p) => {
                        const inShortlist = isShortlisted(p.program_code);
                        const isXaiOpen = expandedXaiCode === p.program_code;

                        return (
                          <div
                            key={p.program_code}
                            className="p-3.5 rounded-xl bg-zinc-900/95 border border-zinc-800 hover:border-zinc-700 transition space-y-2.5 text-xs shadow-lg"
                          >
                            {/* Program Title & Category */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                              <div>
                                <h5 className="font-extrabold text-white text-xs sm:text-sm">{p.program_name}</h5>
                                <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                                  <span className="flex items-center gap-1 text-zinc-300 font-medium">
                                    <Building2 className="w-3 h-3 text-zinc-500" />
                                    {p.university_name}
                                  </span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-zinc-500" />
                                    {p.city}
                                  </span>
                                </div>
                              </div>

                              <span
                                className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold self-start sm:self-auto ${
                                  p.category === "reach"
                                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                    : p.category === "safe"
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                                }`}
                              >
                                {p.category_label}
                              </span>
                            </div>

                            {/* Prediction vs Last Year Numbers Grid */}
                            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                              <div className="bg-zinc-950/80 p-2 rounded-lg border border-zinc-800">
                                <span className="text-zinc-500 block text-[10px]">2025 Son Taban Sırası</span>
                                <span className="font-mono font-bold text-white">
                                  {formatRank(p.latest_rank)}
                                </span>
                              </div>

                              <div className="bg-emerald-950/30 p-2 rounded-lg border border-emerald-500/20">
                                <span className="text-emerald-400 font-semibold block text-[10px] flex items-center gap-1">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  2026 Beklenen Sıralama
                                </span>
                                <span className="font-mono font-extrabold text-emerald-300">
                                  {formatRank(p.predicted_rank)}
                                </span>
                              </div>
                            </div>

                            {/* Confidence Corridor & Dominant Factor Badges */}
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                              {p.interval_lower && p.interval_upper && (
                                <span className="px-2 py-0.5 rounded bg-zinc-950 text-zinc-300 border border-zinc-800 font-mono">
                                  Güvenli Tercih Aralığı: {formatRank(p.interval_lower)} – {formatRank(p.interval_upper)} (±%{p.margin_pct})
                                </span>
                              )}

                              {p.dominant_factor_label && (
                                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1">
                                  <Check className="w-2.5 h-2.5" />
                                  Belirleyici Neden: {p.dominant_factor_label}
                                </span>
                              )}
                            </div>

                            {/* Expandable Reasoning Button */}
                            {p.xai_explanation && (
                              <div>
                                <button
                                  onClick={() => setExpandedXaiCode(isXaiOpen ? null : p.program_code)}
                                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 transition cursor-pointer py-0.5"
                                >
                                  {isXaiOpen ? (
                                    <>
                                      <ChevronUp className="w-3.5 h-3.5" />
                                      <span>Gerekçe Analizini Gizle</span>
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="w-3.5 h-3.5" />
                                      <span>Bu Sıralama Neden Bekleniyor? (Gerekçeyi Gör)</span>
                                    </>
                                  )}
                                </button>

                                {isXaiOpen && (
                                  <div className="mt-2 p-3 rounded-xl bg-zinc-950 border border-emerald-500/30 text-xs text-zinc-300 space-y-2 animate-fade-in">
                                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                                      <ShieldCheck className="w-3.5 h-3.5" />
                                      <span>💡 Sıralamayı Etkileyen Temel Faktörler</span>
                                    </div>
                                    <p className="leading-relaxed text-[11px] text-zinc-300">
                                      {p.xai_explanation}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Card Action Buttons */}
                            <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
                              <span className="text-[10px] font-mono text-zinc-500">Kod: {p.program_code}</span>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => onOpenDetailModal(p.program_code)}
                                  title="Program Detayları"
                                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-medium flex items-center gap-1 text-[11px] transition cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>İncele</span>
                                </button>

                                <button
                                  onClick={() => onOpenSimulationModal(p.program_code)}
                                  title="Kontenjan Simülasyonu"
                                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-medium flex items-center gap-1 text-[11px] transition cursor-pointer"
                                >
                                  <span>Simüle Et</span>
                                </button>

                                <button
                                  onClick={() => handleAddReferencedToShortlist(p)}
                                  disabled={inShortlist}
                                  className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 text-[11px] transition cursor-pointer ${
                                    inShortlist
                                      ? "bg-zinc-800 text-emerald-400 border border-emerald-500/30"
                                      : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-500/20"
                                  }`}
                                >
                                  {inShortlist ? (
                                    <>
                                      <Check className="w-3 h-3" />
                                      <span>Listede</span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-3 h-3" />
                                      <span>Listeme Ekle</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Dynamic Follow-up Suggestions Chips */}
                {!isUser && msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-1.5">
                    {msg.suggestions.map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(sug)}
                        disabled={loading}
                        className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 text-[11px] text-zinc-300 hover:text-emerald-400 transition flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{sug}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Timestamp & Source */}
                <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
                  <span>{msg.timestamp}</span>
                  {!isUser && (
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" />
                      <span>{msg.source === "openai" ? "GPT-4o-mini & RAG" : "YÖK Atlas Doğrulamalı"}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing Loading Indicator */}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-black flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl rounded-tl-none p-4 text-xs text-zinc-400 flex items-center gap-2 shadow-md">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
              </div>
              <span>Danışman YÖK Atlas ve LightGBM modelini tarıyor...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Message Input Area */}
      <div className="mt-3 pt-3 border-t border-zinc-800">
        <div className="relative flex items-center">
          <textarea
            ref={inputRef}
            rows={1}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tercih danışmanına sor... (Örn: Sayısalda 42.000 sıralamam var, Hacettepe veya ODTÜ gelir mi?)"
            className="w-full pl-4 pr-14 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none max-h-32 shadow-xl"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || loading}
            className="absolute right-2.5 p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-black font-extrabold shadow-md shadow-emerald-500/20 transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-2 px-1">
          <span className="flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-zinc-400" />
            Enter ile gönder • Shift+Enter ile yeni satır
          </span>
          <span>13.581 Lisans Programı & Şehir Analitiği ile Entegre</span>
        </div>
      </div>
    </div>
  );
};
