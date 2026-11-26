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
  Trash2,
  Eye,
  Plus,
  Check,
  SlidersHorizontal,
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
  "24 tercihimi nasıl dağıtmalıyım?",
  "Sayısal 45.000 ile hangi Bilgisayar Mühendislikleri gelir?",
  "Ölü tercih nedir ve nasıl önlenir?",
];

export const AiChatMentor: React.FC<Props> = ({
  studentProfile,
  shortlist,
  onAddToShortlist,
  onOpenDetailModal,
  onOpenSimulationModal,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome-1",
      role: "assistant",
      content:
        "Merhaba! Ben **YKS Tercih Danışmanın**.\n\nBaşarı sıranı, aklındaki bölümleri, şehir tercihlerini ya da 24 tercihi nasıl sıralaman gerektiğini bana sorabilirsin.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      suggestions: DEFAULT_SUGGESTIONS,
    },
  ]);

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

  useEffect(() => {
    if (studentProfile?.rank) setStudentRank(Number(studentProfile.rank));
    if (studentProfile?.score_type) setScoreType(studentProfile.score_type);
  }, [studentProfile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputMessage("");
    setLoading(true);

    try {
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
        content: `Bir bağlantı sorunu oluştu: ${err.message || "Lütfen sorunuzu tekrar iletin."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestions: ["24 tercihi nasıl dağıtmalıyım?", "Ölü tercih nedir?"],
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
        matches_notes: ["Danışman Tavsiyesi"],
        trade_offs: [],
        explanation: `${p.university_name} ${p.program_name} programı tercih danışmanı tarafından önerildi.`,
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
        content: "Sohbet sıfırlandı. Yeni bir soruyla başlayabilirsin.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestions: DEFAULT_SUGGESTIONS,
      },
    ]);
  };

  const formatInline = (text: string) => {
    let res = text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#171A12] dark:text-zinc-100 font-semibold">$1</strong>');
    res = res.replace(
      /`([^`]+)`/g,
      '<code class="px-1.5 py-0.5 rounded bg-[#DFE4D5] dark:bg-zinc-800 text-[#526B19] dark:text-emerald-300 font-mono text-[11px]">$1</code>'
    );
    return res;
  };

  const renderFormattedContent = (content: string) => {
    const lines = content.split("\n");
    return (
      <div className="space-y-1.5 text-sm leading-relaxed">
        {lines.map((line, idx) => {
          if (line.startsWith("### ")) {
            return (
              <h4 key={idx} className="text-sm font-semibold text-[#171A12] dark:text-zinc-100 pt-2 border-b border-[#D0D5C6] dark:border-zinc-800 pb-1">
                {line.replace("### ", "")}
              </h4>
            );
          }
          if (line.startsWith("## ")) {
            return (
              <h3 key={idx} className="text-base font-semibold text-[#526B19] dark:text-emerald-400 pt-2">
                {line.replace("## ", "")}
              </h3>
            );
          }
          if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
            const clean = line.trim().replace(/^[-*]\s+/, "");
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-[#526B19] dark:text-emerald-400">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInline(clean) }} />
              </div>
            );
          }
          if (/^\d+\.\s+/.test(line.trim())) {
            return <div key={idx} className="pl-1" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />;
          }
          if (!line.trim()) return <div key={idx} className="h-1" />;
          return <p key={idx} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />;
        })}
      </div>
    );
  };

  const isShortlisted = (code: string) => shortlist.some((s) => s.program_code === code);

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] max-w-4xl mx-auto w-full">
      <div className="bg-gradient-to-b from-[#F2F3EC] to-[#ECEEE3] dark:bg-none dark:bg-[#111114] border border-[#D0D5C6] dark:border-zinc-800/80 rounded-2xl px-4 py-3 mb-3 flex items-center justify-between gap-3 shadow-[0_2px_10px_rgba(23,26,18,0.04)] dark:shadow-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#E5EDC8] dark:bg-emerald-500/15 text-[#526B19] dark:text-emerald-400 border border-[#C5D496] dark:border-emerald-500/25 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#171A12] dark:text-zinc-100">YKS Tercih Danışmanı</h2>
            <p className="text-[11px] text-[#6B7065]">Sıralamana ve hedeflerine göre birebir rehberlik</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setProfileExpanded(!profileExpanded)}
            className="px-3 py-1.5 rounded-lg bg-[#E8EBE0] dark:bg-[#09090b] border border-[#D0D5C6] dark:border-zinc-800 hover:border-[#B6BEA9] dark:hover:border-zinc-700 text-xs font-medium text-[#171A12] dark:text-zinc-300 flex items-center gap-1.5 transition cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#526B19] dark:text-emerald-400" />
            <span>{studentRank ? `${scoreType} • ${formatRank(studentRank)}` : "Profil Ayarla"}</span>
          </button>

          <button
            type="button"
            onClick={clearChat}
            title="Yeni Sohbet"
            className="p-2 rounded-lg bg-[#E8EBE0] dark:bg-[#09090b] border border-[#D0D5C6] dark:border-zinc-800 hover:bg-[#E5EDC8]/70 dark:hover:bg-zinc-800 text-[#6B7065] dark:text-zinc-400 hover:text-[#171A12] dark:hover:text-zinc-100 transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {profileExpanded && (
        <div className="bg-gradient-to-b from-[#F2F3EC] to-[#ECEEE3] dark:bg-none dark:bg-[#111114] border border-[#D0D5C6] dark:border-zinc-800/80 rounded-2xl p-4 mb-3 text-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#6B7065] dark:text-zinc-400 mb-1.5 text-[11px]">Puan Türü</label>
              <div className="flex gap-1.5">
                {["SAY", "EA", "SÖZ", "DİL"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setScoreType(st)}
                    className={`flex-1 py-1.5 rounded-lg font-medium text-xs transition cursor-pointer ${
                      scoreType === st
                        ? "bg-[#C6F432] text-[#171A12] font-semibold"
                        : "bg-[#E8EBE0] dark:bg-[#09090b] text-[#6B7065] dark:text-zinc-400 border border-[#D0D5C6] dark:border-zinc-800"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[#6B7065] dark:text-zinc-400 mb-1.5 text-[11px]">Başarı Sıran</label>
              <input
                type="number"
                value={studentRank || ""}
                onChange={(e) => setStudentRank(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Örn: 45000"
                className="w-full px-3 py-1.5 rounded-lg bg-[#E8EBE0] dark:bg-[#09090b] border border-[#D0D5C6] dark:border-zinc-800 text-[#171A12] dark:text-zinc-100 placeholder-[#6B7065]/75 font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  isUser
                    ? "bg-[#D0D5C6] dark:bg-zinc-800 text-[#171A12] dark:text-zinc-200"
                    : "bg-[#E5EDC8] dark:bg-emerald-500/15 text-[#526B19] dark:text-emerald-400 border border-[#C5D496] dark:border-emerald-500/25"
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 ${
                  isUser
                    ? "bg-[#DFE4D5] dark:bg-zinc-800/80 border border-[#D0D5C6] dark:border-zinc-700/60 text-[#171A12] dark:text-zinc-100"
                    : "bg-[#F0F1E9] dark:bg-[#111114] border border-[#D0D5C6] dark:border-zinc-800/80 text-[#171A12] dark:text-zinc-300 space-y-3 shadow-[0_2px_10px_rgba(23,26,18,0.04)] dark:shadow-none"
                }`}
              >
                {renderFormattedContent(msg.content)}

                {msg.referenced_programs && msg.referenced_programs.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#D0D5C6] dark:border-zinc-800/80 space-y-2.5">
                    <span className="text-[11px] font-medium text-[#6B7065] dark:text-zinc-400 block">
                      İlgili Programlar ({msg.referenced_programs.length})
                    </span>

                    <div className="space-y-2.5">
                      {msg.referenced_programs.map((p) => {
                        const inShortlist = isShortlisted(p.program_code);
                        const isXaiOpen = expandedXaiCode === p.program_code;

                        return (
                          <div
                            key={p.program_code}
                            className="p-3.5 rounded-xl bg-[#E8EBE0] dark:bg-[#09090b] border border-[#D0D5C6] dark:border-zinc-800/80 space-y-2.5 text-xs"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                              <div>
                                <h5 className="font-semibold text-[#171A12] dark:text-zinc-100 text-sm">{p.program_name}</h5>
                                <p className="text-[11px] text-[#6B7065] dark:text-zinc-400 mt-0.5">
                                  {p.university_name} • {p.city}
                                </p>
                              </div>

                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-medium self-start ${
                                  p.category === "reach"
                                    ? "bg-amber-500/12 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300"
                                    : p.category === "safe"
                                    ? "bg-teal-500/12 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300"
                                    : "bg-[#E5EDC8] dark:bg-emerald-500/10 text-[#526B19] dark:text-emerald-300"
                                }`}
                              >
                                {p.category_label}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div className="bg-[#F0F1E9] dark:bg-[#111114] p-2 rounded-lg border border-[#D0D5C6] dark:border-zinc-800/70">
                                <span className="text-[#6B7065] block">2025 Taban</span>
                                <span className="font-mono font-semibold text-[#171A12] dark:text-zinc-100">
                                  {formatRank(p.latest_rank)}
                                </span>
                              </div>
                              <div className="bg-[#F0F1E9] dark:bg-[#111114] p-2 rounded-lg border border-[#D0D5C6] dark:border-zinc-800/70">
                                <span className="text-[#526B19] dark:text-emerald-400 block">2026 Beklenen</span>
                                <span className="font-mono font-semibold text-[#526B19] dark:text-emerald-300">
                                  {formatRank(p.predicted_rank)}
                                </span>
                              </div>
                            </div>

                            {(p.interval_lower || p.dominant_factor_label) && (
                              <div className="flex flex-wrap gap-2 text-[11px] text-[#6B7065] dark:text-zinc-400">
                                {p.interval_lower && p.interval_upper && (
                                  <span className="font-mono">
                                    Aralık: {formatRank(p.interval_lower)} – {formatRank(p.interval_upper)}
                                  </span>
                                )}
                                {p.dominant_factor_label && (
                                  <span className="text-[#526B19] dark:text-emerald-400">• {p.dominant_factor_label}</span>
                                )}
                              </div>
                            )}

                            {p.xai_explanation && (
                              <div>
                                <button
                                  type="button"
                                  onClick={() => setExpandedXaiCode(isXaiOpen ? null : p.program_code)}
                                  className="text-[11px] text-[#526B19] dark:text-emerald-400 hover:underline font-medium flex items-center gap-1 transition cursor-pointer"
                                >
                                  <span>{isXaiOpen ? "Açıklamayı Gizle" : "Neden bu sıralama bekleniyor?"}</span>
                                  {isXaiOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>

                                {isXaiOpen && (
                                  <p className="mt-2 p-2.5 rounded-lg bg-[#F0F1E9] dark:bg-[#111114] border border-[#D0D5C6] dark:border-zinc-800/80 text-[11px] text-[#6B7065] dark:text-zinc-300 leading-relaxed">
                                    {p.xai_explanation}
                                  </p>
                                )}
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-[#D0D5C6] dark:border-zinc-800/60">
                              <span className="text-[11px] font-mono text-[#6B7065] dark:text-zinc-500">{p.program_code}</span>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => onOpenDetailModal(p.program_code)}
                                  className="px-2.5 py-1 rounded-lg bg-[#F0F1E9] dark:bg-zinc-900 hover:bg-[#E5EDC8]/70 dark:hover:bg-zinc-800 text-[#171A12] dark:text-zinc-300 border border-[#D0D5C6] dark:border-zinc-800 flex items-center gap-1 text-[11px] transition cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>İncele</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => onOpenSimulationModal(p.program_code)}
                                  className="px-2.5 py-1 rounded-lg bg-[#F0F1E9] dark:bg-zinc-900 hover:bg-[#E5EDC8]/70 dark:hover:bg-zinc-800 text-[#171A12] dark:text-zinc-300 border border-[#D0D5C6] dark:border-zinc-800 text-[11px] transition cursor-pointer"
                                >
                                  Simüle Et
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleAddReferencedToShortlist(p)}
                                  disabled={inShortlist}
                                  className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 text-[11px] transition cursor-pointer ${
                                    inShortlist
                                      ? "bg-[#E5EDC8] dark:bg-zinc-900 text-[#526B19] dark:text-emerald-400 border border-[#C5D496] dark:border-emerald-500/30"
                                      : "bg-[#C6F432] hover:bg-[#b5e422] text-[#171A12] font-semibold"
                                  }`}
                                >
                                  {inShortlist ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                  <span>{inShortlist ? "Listede" : "Ekle"}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {!isUser && msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-1.5">
                    {msg.suggestions.map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSendMessage(sug)}
                        disabled={loading}
                        className="px-2.5 py-1 rounded-lg bg-[#E8EBE0] dark:bg-[#09090b] border border-[#D0D5C6] dark:border-zinc-800 hover:border-[#B6BEA9] dark:hover:border-zinc-700 text-[11px] text-[#171A12] dark:text-zinc-300 transition cursor-pointer"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}

                <div className="text-[10px] text-[#6B7065] dark:text-zinc-500">{msg.timestamp}</div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#E5EDC8] dark:bg-emerald-500/15 text-[#526B19] dark:text-emerald-400 border border-[#C5D496] dark:border-emerald-500/25 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-gradient-to-b from-[#F2F3EC] to-[#ECEEE3] dark:bg-none dark:bg-[#111114] border border-[#D0D5C6] dark:border-zinc-800/80 rounded-2xl px-4 py-3 text-xs text-[#6B7065] dark:text-zinc-400 flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-[#D0D5C6] dark:border-zinc-600 border-t-emerald-500 rounded-full animate-spin" />
              <span>Yanıt hazırlanıyor...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="mt-3 pt-3 border-t border-[#D0D5C6] dark:border-zinc-800/80">
        <div className="relative flex items-center">
          <textarea
            ref={inputRef}
            rows={1}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Sorunuzu yazın... (Örn: Sayısal 42.000 ile ODTÜ veya Hacettepe gelir mi?)"
            className="w-full pl-4 pr-12 py-3 rounded-xl bg-[#F0F1E9] dark:bg-[#111114] border border-[#D0D5C6] dark:border-zinc-800 text-sm text-[#171A12] dark:text-zinc-100 placeholder-[#6B7065]/75 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-500 resize-none max-h-32"
          />

          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || loading}
            className="absolute right-2 p-2 rounded-lg bg-[#C6F432] hover:bg-[#b5e422] disabled:opacity-40 text-[#171A12] transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
