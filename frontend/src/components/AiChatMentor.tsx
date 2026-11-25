import React, { useState, useRef, useEffect } from "react";
import type {
  ChatMessage,
  StudentPreferencePayload,
  RecommendedProgram,
} from "../types";
import { sendChatMessage, formatRank } from "../api";
import {
  Send,
  User,
  Trash2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from "lucide-react";

interface Props {
  studentProfile?: StudentPreferencePayload | null;
  shortlist: RecommendedProgram[];
  onAddToShortlist: (prog: RecommendedProgram) => void;
  onOpenDetailModal: (progCode: string) => void;
  onOpenSimulationModal: (progCode: string) => void;
}

const DEFAULT_SUGGESTIONS = [
  "24 tercihimi nasıl dengeli dağıtmalıyım?",
  "Sayısal 45.000 ile hangi bölümler uygun?",
  "Ölü tercih yapmamak için nelere dikkat etmeliyim?",
  "Eşit Ağırlıkta 80.000 sıralamayla Hukuk mu YBS mi?",
];

export const AiChatMentor: React.FC<Props> = ({
  studentProfile,
  shortlist,
  onAddToShortlist,
  onOpenDetailModal,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: "welcome-1",
        role: "assistant",
        content: `Merhaba! Ben **YKS Rehberlik Danışmanınız**. 

Başarı sıranıza, hedeflediğiniz bölümlere ve şehirlerinize göre tercih listenizi en doğru ve dengeli şekilde oluşturmanıza yardımcı oluyorum.

Aklınızdaki bölümleri, sıralamanıza göre yerleşme durumunu veya 24 tercihinizi nasıl planlamanız gerektiğini sorabilirsiniz.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestions: DEFAULT_SUGGESTIONS,
      },
    ];
  });

  const [inputMessage, setInputMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [expandedReasonCode, setExpandedReasonCode] = useState<string | null>(null);
  const [studentRank, setStudentRank] = useState<number | null>(
    studentProfile?.rank ? Number(studentProfile.rank) : null
  );
  const [scoreType, setScoreType] = useState<string>(studentProfile?.score_type || "SAY");

  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        referenced_programs: res.referenced_programs,
        suggestions: res.suggestions,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `assistant-err-${Date.now()}`,
        role: "assistant",
        content: "Üzgünüm, yanıt hazırlanırken geçici bir hata oluştu. Lütfen tekrar deneyiniz.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome-reset",
        role: "assistant",
        content: "Sohbet sıfırlandı. Tercihleriniz hakkında dilediğiniz soruyu sorabilirsiniz.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestions: DEFAULT_SUGGESTIONS,
      },
    ]);
  };

  // Helper to render formatted Markdown text
  const renderFormattedContent = (content: string) => {
    const lines = content.split("\n");
    return (
      <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
        {lines.map((line, idx) => {
          if (line.startsWith("### ")) {
            return (
              <h4 key={idx} className="text-sm font-bold text-slate-900 pt-2 pb-0.5">
                {line.replace("### ", "")}
              </h4>
            );
          }
          if (line.startsWith("## ")) {
            return (
              <h3 key={idx} className="text-base font-bold text-slate-900 pt-2">
                {line.replace("## ", "")}
              </h3>
            );
          }
          if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
            const clean = line.trim().replace(/^[-*]\s+/, "");
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-blue-600 font-bold">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInline(clean) }} />
              </div>
            );
          }
          if (/^\d+\.\s+/.test(line.trim())) {
            return (
              <div key={idx} className="pl-2" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
            );
          }
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }
          return (
            <p key={idx} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
          );
        })}
      </div>
    );
  };

  const formatInline = (text: string) => {
    let res = text.replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="text-slate-900 font-bold">$1</strong>'
    );
    res = res.replace(
      /`([^`]+)`/g,
      '<code class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[11px]">$1</code>'
    );
    return res;
  };

  const isShortlisted = (code: string) => {
    return shortlist.some((s) => s.program_code === code);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] max-w-4xl mx-auto w-full bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
              Rehberlik Danışmanı
            </h2>
            <p className="text-xs text-slate-500">
              {studentRank ? `${scoreType} • ${formatRank(studentRank)}. Sıra` : "Üniversite Tercih Danışmanı"}
            </p>
          </div>
        </div>

        <button
          onClick={clearChat}
          title="Sohbeti Temizle"
          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 mt-0.5 ${
                  isUser ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 font-bold"
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : "R"}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs sm:text-sm ${
                  isUser
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : "bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-none space-y-3"
                }`}
              >
                {renderFormattedContent(msg.content)}

                {/* Referenced Program Cards */}
                {msg.referenced_programs && msg.referenced_programs.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200 space-y-2.5">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase block">
                      Bahsedilen Bölümler ({msg.referenced_programs.length})
                    </span>

                    <div className="grid grid-cols-1 gap-2">
                      {msg.referenced_programs.map((p) => {
                        const inShortlist = isShortlisted(p.program_code);
                        const isReasonOpen = expandedReasonCode === p.program_code;

                        const badgeClass =
                          p.category === "reach"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : p.category === "safe"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-blue-50 text-blue-800 border-blue-200";

                        return (
                          <div
                            key={p.program_code}
                            className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-2 shadow-xs"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <div>
                                <h5 className="font-bold text-slate-900">{p.program_name}</h5>
                                <p className="text-[11px] text-slate-500">
                                  {p.university_name} {p.city ? `• ${p.city}` : ""}
                                </p>
                              </div>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded border self-start sm:self-auto ${badgeClass}`}
                              >
                                {p.category_label}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                              <span>
                                2026 Tahmini Sıra: <strong>{formatRank(p.predicted_rank)}</strong>
                              </span>
                              <span>
                                Son Taban Sıra: {formatRank(p.latest_rank)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              {p.xai_explanation ? (
                                <button
                                  type="button"
                                  onClick={() => setExpandedReasonCode(isReasonOpen ? null : p.program_code)}
                                  className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                                >
                                  <span>{isReasonOpen ? "Gerekçeyi Gizle" : "Gerekçeyi Gör"}</span>
                                  {isReasonOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                              ) : <span />}

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => onOpenDetailModal(p.program_code)}
                                  className="text-[11px] text-slate-600 hover:text-slate-900 cursor-pointer font-medium"
                                >
                                  Detay
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onAddToShortlist({
                                      program_code: p.program_code,
                                      university_name: p.university_name,
                                      program_name: p.program_name,
                                      score_type: scoreType,
                                      category: p.category,
                                      category_label: p.category_label,
                                      category_description: "",
                                      preference_fit_score: 80,
                                      rank_fit_score: 80,
                                      total_score: 80,
                                      trade_offs: [],
                                      explanation: p.xai_explanation || "",
                                      history: [],
                                    })
                                  }
                                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                                    inShortlist
                                      ? "bg-blue-600 border-blue-600 text-white"
                                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                  }`}
                                >
                                  {inShortlist ? "Listede" : "Listeye Ekle"}
                                </button>
                              </div>
                            </div>

                            {isReasonOpen && p.xai_explanation && (
                              <div className="p-2.5 rounded-lg bg-slate-50 text-[11px] text-slate-700 leading-relaxed border border-slate-100">
                                {p.xai_explanation}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 pl-9">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
            <span className="ml-1">Danışman yazıyor...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Questions */}
      {messages.length > 0 && messages[messages.length - 1].suggestions && (
        <div className="p-3 bg-slate-50 border-t border-slate-100 overflow-x-auto no-scrollbar flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap pl-1">
            Örnek Sorular:
          </span>
          {messages[messages.length - 1].suggestions?.map((sug, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(sug)}
              className="text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition whitespace-nowrap cursor-pointer shadow-2xs"
            >
              {sug}
            </button>
          ))}
        </div>
      )}

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 sm:p-4 bg-white border-t border-slate-100 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Rehberlik danışmanına sorunuzu yazınız..."
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition"
        />

        <button
          type="submit"
          disabled={!inputMessage.trim() || loading}
          className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 transition cursor-pointer"
          title="Gönder"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
