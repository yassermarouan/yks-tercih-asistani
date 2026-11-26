import React, { useState } from "react";
import type { RecommendedProgram } from "../types";
import { formatRank } from "../api";
import {
  X,
  FileCheck2,
  Printer,
  ArrowUp,
  ArrowDown,
  Trash2,
  AlertTriangle,
  Wand2,
} from "lucide-react";

interface Props {
  shortlist: RecommendedProgram[];
  studentRank?: number;
  scoreType?: string;
  onReorder: (newList: RecommendedProgram[]) => void;
  onRemove: (programCode: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export const PreferenceListAuditModal: React.FC<Props> = ({
  shortlist,
  studentRank,
  scoreType,
  onReorder,
  onRemove,
  onClear,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"list" | "audit">("audit");

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= shortlist.length) return;

    const copy = [...shortlist];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    onReorder(copy);
  };

  const handleAutoSort = () => {
    const copy = [...shortlist];
    copy.sort((a, b) => {
      const order = { reach: 1, target: 2, safe: 3, insufficient_data: 4 };
      const catA = order[a.category] || 5;
      const catB = order[b.category] || 5;
      if (catA !== catB) return catA - catB;
      return (a.latest_rank || 9999999) - (b.latest_rank || 9999999);
    });
    onReorder(copy);
  };

  const auditWarnings: {
    type: "dead_choice" | "safe_missing" | "excess_reach" | "score_mismatch";
    title: string;
    message: string;
    indices?: number[];
  }[] = [];

  for (let i = 0; i < shortlist.length - 1; i++) {
    const current = shortlist[i];
    const next = shortlist[i + 1];

    if (current.latest_rank && next.latest_rank && current.latest_rank > next.latest_rank * 1.15) {
      auditWarnings.push({
        type: "dead_choice",
        title: `Ölü Tercih Riski: ${i + 1}. ve ${i + 2}. Tercihler`,
        message: `${i + 1}. sıradaki ${current.program_name} (${formatRank(current.latest_rank)}), ${i + 2}. sıradaki ${next.program_name} (${formatRank(next.latest_rank)}) programından daha geride görünüyor.`,
        indices: [i, i + 1],
      });
    }
  }

  const countReach = shortlist.filter((it) => it.category === "reach").length;
  const countTarget = shortlist.filter((it) => it.category === "target").length;
  const countSafe = shortlist.filter((it) => it.category === "safe").length;

  if (shortlist.length >= 3 && countSafe === 0) {
    auditWarnings.push({
      type: "safe_missing",
      title: "Güvenli Seçenek Eksik",
      message: "Listenizin son sıralarına yerleşmesi daha kolay olan programlar eklemeniz önerilir.",
    });
  }

  if (shortlist.length >= 5 && countReach / shortlist.length > 0.5) {
    auditWarnings.push({
      type: "excess_reach",
      title: "Yüksek Riskli Tercih Oranı",
      message: "Listenizin orta kısmını sıralamanıza yakın programlarla dengelemeniz önerilir.",
    });
  }

  if (scoreType) {
    const mismatches = shortlist.filter((it) => it.score_type !== scoreType);
    if (mismatches.length > 0) {
      auditWarnings.push({
        type: "score_mismatch",
        title: "Farklı Puan Türü",
        message: `Seçtiğiniz ${mismatches.length} program hedef puan türünüzden (${scoreType}) farklıdır.`,
      });
    }
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-[#171A12]/40 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-3xl bg-gradient-to-b from-[#F2F3EC] to-[#ECEEE3] dark:bg-none dark:bg-[#111114] border border-[#D0D5C6] dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
        <div className="sticky top-0 z-20 bg-[#F0F1E9]/95 dark:bg-[#111114]/95 backdrop-blur border-b border-[#D0D5C6] dark:border-zinc-800 px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-[#171A12] dark:text-zinc-100">
              Tercih Listem ({shortlist.length}/24)
            </h3>
            <p className="text-xs text-[#6B7065] dark:text-zinc-400">
              Tercihlerinizi sıralayın, riskleri kontrol edin ve yazdırın.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              disabled={shortlist.length === 0}
              className="px-3 py-1.5 rounded-lg bg-[#C6F432] hover:bg-[#b5e422] text-[#171A12] font-semibold text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Yazdır</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-[#DFE4D5] dark:bg-zinc-900 hover:bg-[#DFE4D5] dark:hover:bg-zinc-800 border border-[#D0D5C6] dark:border-zinc-800 text-[#6B7065] dark:text-zinc-400 hover:text-[#171A12] dark:hover:text-zinc-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-5 py-3 bg-[#E8EBE0] dark:bg-[#09090b] border-b border-[#D0D5C6] dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("audit")}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                activeTab === "audit"
                  ? "bg-[#C6F432] text-[#171A12] font-semibold"
                  : "bg-[#F0F1E9] dark:bg-zinc-900 border border-[#D0D5C6] dark:border-zinc-800 text-[#6B7065] dark:text-zinc-400 hover:text-[#171A12] dark:hover:text-zinc-100"
              }`}
            >
              Liste Kontrolü ({auditWarnings.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("list")}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                activeTab === "list"
                  ? "bg-[#C6F432] text-[#171A12] font-semibold"
                  : "bg-[#F0F1E9] dark:bg-zinc-900 border border-[#D0D5C6] dark:border-zinc-800 text-[#6B7065] dark:text-zinc-400 hover:text-[#171A12] dark:hover:text-zinc-100"
              }`}
            >
              Sıralama ({shortlist.length})
            </button>
          </div>

          <div className="flex items-center gap-3">
            {shortlist.length > 1 && (
              <button
                type="button"
                onClick={handleAutoSort}
                className="px-3 py-1.5 rounded-lg bg-[#F0F1E9] dark:bg-zinc-900 hover:bg-[#E5EDC8]/70 dark:hover:bg-zinc-800 text-[#526B19] dark:text-emerald-400 font-medium flex items-center gap-1.5 border border-[#D0D5C6] dark:border-zinc-800 transition cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Otomatik Sırala</span>
              </button>
            )}

            {shortlist.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm("Tercih listenizdeki tüm programlar temizlensin mi?")) onClear();
                }}
                className="text-xs text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
              >
                Temizle
              </button>
            )}
          </div>
        </div>

        <div className="overflow-y-auto p-5 space-y-4">
          {shortlist.length === 0 ? (
            <div className="py-16 text-center text-[#6B7065] space-y-2">
              <FileCheck2 className="w-10 h-10 text-[#6B7065] dark:text-zinc-600 mx-auto" />
              <h4 className="text-sm font-medium text-[#171A12] dark:text-zinc-200">Listenizde henüz program yok</h4>
              <p className="text-xs text-[#6B7065] max-w-sm mx-auto">
                Önerilerden veya program rehberinden beğendiğiniz bölümleri ekleyebilirsiniz.
              </p>
            </div>
          ) : activeTab === "audit" ? (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  auditWarnings.length === 0
                    ? "bg-[#E5EDC8] dark:bg-emerald-500/10 border-[#C5D496] dark:border-emerald-500/25"
                    : "bg-amber-500/12 dark:bg-amber-500/10 border-amber-600/25 dark:border-amber-500/25"
                }`}
              >
                {auditWarnings.length === 0 ? (
                  <>
                    <FileCheck2 className="w-5 h-5 text-[#526B19] dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-[#171A12] dark:text-zinc-100">
                        Listenizde kritik bir sorun görünmüyor
                      </h4>
                      <p className="text-xs text-[#6B7065] dark:text-zinc-400 mt-0.5">
                        Tercihleriniz sıralama mantığına uygun görünüyor.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-[#171A12] dark:text-zinc-100">
                        {auditWarnings.length} Dikkat Edilmesi Gereken Nokta
                      </h4>
                      <p className="text-xs text-[#6B7065] dark:text-zinc-400 mt-0.5">
                        Aşağıdaki uyarıları inceleyebilir veya Otomatik Sırala ile düzenleyebilirsiniz.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {auditWarnings.map((warn, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[#E8EBE0] dark:bg-[#09090b] border border-[#D0D5C6] dark:border-zinc-800/80 space-y-1"
                >
                  <div className="text-xs font-medium text-amber-600 dark:text-amber-400">{warn.title}</div>
                  <p className="text-xs text-[#171A12] dark:text-zinc-300 leading-relaxed">{warn.message}</p>
                </div>
              ))}

              <div className="grid grid-cols-3 gap-3 text-center text-xs pt-2">
                <div className="p-3 rounded-xl bg-[#E8EBE0] dark:bg-[#09090b] border border-[#D0D5C6] dark:border-zinc-800/80">
                  <span className="text-[11px] text-[#6B7065] block">Daha Rekabetçi</span>
                  <span className="text-base font-mono font-semibold text-amber-600 dark:text-amber-400">
                    {countReach}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#E8EBE0] dark:bg-[#09090b] border border-[#D0D5C6] dark:border-zinc-800/80">
                  <span className="text-[11px] text-[#6B7065] block">Sıralamana Yakın</span>
                  <span className="text-base font-mono font-semibold text-[#526B19] dark:text-emerald-400">
                    {countTarget}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#E8EBE0] dark:bg-[#09090b] border border-[#D0D5C6] dark:border-zinc-800/80">
                  <span className="text-[11px] text-[#6B7065] block">Daha Ulaşılabilir</span>
                  <span className="text-base font-mono font-semibold text-teal-600 dark:text-teal-400">
                    {countSafe}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {shortlist.map((prog, index) => {
                const isDeadChoice = auditWarnings.some(
                  (w) => w.type === "dead_choice" && w.indices?.includes(index)
                );

                return (
                  <div
                    key={prog.program_code}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isDeadChoice
                        ? "bg-amber-500/12 dark:bg-amber-500/10 border-amber-600/35 dark:border-amber-500/30"
                        : "bg-[#E8EBE0] dark:bg-[#09090b] border-[#D0D5C6] dark:border-zinc-800/80"
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-[#D0D5C6] dark:bg-zinc-800 text-[#171A12] dark:text-zinc-200 font-mono text-xs font-medium flex items-center justify-center shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-sm font-medium text-[#171A12] dark:text-zinc-100 truncate">
                          {prog.program_name}
                        </h4>
                        <p className="text-xs text-[#6B7065] dark:text-zinc-400 truncate">
                          {prog.university_name} {prog.city && `• ${prog.city}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <span className="text-xs font-mono text-[#171A12] dark:text-zinc-300">
                        {prog.latest_rank ? formatRank(prog.latest_rank) : "—"}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMove(index, "up")}
                          disabled={index === 0}
                          className="p-1.5 rounded-lg bg-[#F0F1E9] dark:bg-zinc-900 hover:bg-[#E5EDC8]/70 dark:hover:bg-zinc-800 border border-[#D0D5C6] dark:border-zinc-800 text-[#171A12] dark:text-zinc-300 disabled:opacity-25 cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(index, "down")}
                          disabled={index === shortlist.length - 1}
                          className="p-1.5 rounded-lg bg-[#F0F1E9] dark:bg-zinc-900 hover:bg-[#E5EDC8]/70 dark:hover:bg-zinc-800 border border-[#D0D5C6] dark:border-zinc-800 text-[#171A12] dark:text-zinc-300 disabled:opacity-25 cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemove(prog.program_code)}
                          className="p-1.5 rounded-lg bg-[#F0F1E9] dark:bg-zinc-900 hover:bg-rose-50 dark:hover:bg-rose-500/20 border border-[#D0D5C6] dark:border-zinc-800 text-[#6B7065] hover:text-rose-600 dark:hover:text-rose-300 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Printable A4 Form */}
        <div className="hidden print:block fixed inset-0 bg-white text-black p-8 font-serif z-[9999]">
          <div className="text-center pb-4 border-b-2 border-black space-y-1">
            <h1 className="text-xl font-bold uppercase tracking-wider">
              T.C. Yükseköğretim Kurumları Sınavı (YKS)
            </h1>
            <h2 className="text-base font-semibold">Aday Tercih Listesi (Taslak)</h2>
            <div className="flex justify-between text-xs pt-2">
              <span>
                <strong>Sıralama:</strong> {studentRank ? formatRank(studentRank) : "Belirtilmedi"} ({scoreType || "SAY"})
              </span>
              <span>
                <strong>Tarih:</strong> {new Date().toLocaleDateString("tr-TR")}
              </span>
              <span>
                <strong>Toplam Tercih:</strong> {shortlist.length} / 24
              </span>
            </div>
          </div>

          <table className="w-full text-left text-xs mt-4 border-collapse border border-black">
            <thead>
              <tr className="bg-gray-100 border-b border-black">
                <th className="p-1.5 border border-black w-10 text-center">S.No</th>
                <th className="p-1.5 border border-black w-24">Program Kodu</th>
                <th className="p-1.5 border border-black">Üniversite Adı</th>
                <th className="p-1.5 border border-black">Program Adı</th>
                <th className="p-1.5 border border-black w-16">Şehir</th>
                <th className="p-1.5 border border-black w-12 text-center">Puan</th>
                <th className="p-1.5 border border-black w-20 text-right">Taban Sıra</th>
              </tr>
            </thead>
            <tbody>
              {shortlist.map((prog, idx) => (
                <tr key={prog.program_code} className="border-b border-black">
                  <td className="p-1.5 border border-black text-center font-bold">{idx + 1}</td>
                  <td className="p-1.5 border border-black font-mono">{prog.program_code}</td>
                  <td className="p-1.5 border border-black font-semibold">{prog.university_name}</td>
                  <td className="p-1.5 border border-black">{prog.program_name}</td>
                  <td className="p-1.5 border border-black">{prog.city || "—"}</td>
                  <td className="p-1.5 border border-black text-center font-bold">{prog.score_type}</td>
                  <td className="p-1.5 border border-black text-right font-mono">
                    {prog.latest_rank ? formatRank(prog.latest_rank) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
