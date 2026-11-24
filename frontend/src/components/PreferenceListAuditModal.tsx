import React, { useState } from "react";
import type { RecommendedProgram } from "../types";
import { formatRank } from "../api";
import {
  X,
  FileCheck2,
  Printer,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Trash2,
  AlertTriangle,
  Building2,
  MapPin,
  HelpCircle,
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

  // Move item up/down
  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= shortlist.length) return;

    const copy = [...shortlist];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    onReorder(copy);
  };

  // Auto-sort by strategic placement logic
  const handleAutoSort = () => {
    const copy = [...shortlist];
    copy.sort((a, b) => {
      // Order categories: reach first, then target, then safe
      const order = { reach: 1, target: 2, safe: 3, insufficient_data: 4 };
      const catA = order[a.category] || 5;
      const catB = order[b.category] || 5;
      if (catA !== catB) return catA - catB;

      // Within category, order by rank ascending (better rank first)
      const rankA = a.latest_rank || 9999999;
      const rankB = b.latest_rank || 9999999;
      return rankA - rankB;
    });
    onReorder(copy);
  };

  // AUDIT ENGINE: Detect traps & portfolio risks
  const auditWarnings: { type: "dead_choice" | "safe_missing" | "excess_reach" | "score_mismatch"; title: string; message: string; indices?: number[] }[] = [];

  // 1. Dead Choice Detection: choice i rank is significantly worse than choice i+1
  for (let i = 0; i < shortlist.length - 1; i++) {
    const current = shortlist[i];
    const next = shortlist[i + 1];

    if (current.latest_rank && next.latest_rank) {
      // In YKS, higher number = worse rank. If current rank is 15% worse than next rank:
      if (current.latest_rank > next.latest_rank * 1.15) {
        auditWarnings.push({
          type: "dead_choice",
          title: `Ölü Tercih Riski: ${i + 1}. ve ${i + 2}. Tercihler`,
          message: `${i + 1}. sıradaki ${current.program_name} (${formatRank(current.latest_rank)} taban sıra), ` +
            `${i + 2}. sıradaki ${next.program_name} (${formatRank(next.latest_rank)} taban sıra) programından daha geridedir. ` +
            `ÖSYM merkezi yerleştirmede önce ${i + 1}. tercihe bakacağı için, ${i + 2}. sıradaki daha iyi bölüme puanın yetse bile yerleşemezsin!`,
          indices: [i, i + 1],
        });
      }
    }
  }

  // 2. Portfolio Balance Checks
  const countReach = shortlist.filter((it) => it.category === "reach").length;
  const countTarget = shortlist.filter((it) => it.category === "target").length;
  const countSafe = shortlist.filter((it) => it.category === "safe").length;

  if (shortlist.length >= 3 && countSafe === 0) {
    auditWarnings.push({
      type: "safe_missing",
      title: "Güvenli Liman (Açıkta Kalmama Sigortası) Eksik",
      message: "Listenizde hiç 'Daha Ulaşılabilir' (güvenli liman) tercih bulunmuyor. YKS sıralamalarının olası dalgalanmalarına karşı listenin son 3-4 sırasına sıralamanızın belirgin gerisinde programlar eklemeniz tavsiye edilir.",
    });
  }

  if (shortlist.length >= 5 && countReach / shortlist.length > 0.5) {
    auditWarnings.push({
      type: "excess_reach",
      title: "Aşırı Yüksek Riskli Tercih Oranı",
      message: `Listenizin %${Math.round((countReach / shortlist.length) * 100)}'i 'Daha Rekabetçi' dilimden oluşuyor. Listenin orta kısmını 'Sıralamana Yakın' ideal hedeflerle güçlendirmeniz önerilir.`,
    });
  }

  // 3. Score type mismatches
  if (scoreType) {
    const mismatches = shortlist.filter((it) => it.score_type !== scoreType);
    if (mismatches.length > 0) {
      auditWarnings.push({
        type: "score_mismatch",
        title: "Farklı Puan Türü Çakışması",
        message: `Seçtiğiniz ${mismatches.length} program hedef puan türünüzden (${scoreType}) farklıdır (${mismatches.map((m) => m.score_type).join(", ")}). Bu programlar için ilgili puan türünde yeterli sıralamanız olduğundan emin olun.`,
      });
    }
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-6 py-4 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
                <FileCheck2 className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                ÖSYM 24 Tercih Listesi & Hata Denetimi
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Aday Tercih Listesi Yönetimi
            </h3>

            <p className="text-xs text-slate-400">
              Listenizdeki programları sıralayın, ölü tercihleri tespit edin ve resmi A4 PDF formatında yazdırın.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={shortlist.length === 0}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 disabled:opacity-40"
              title="Resmi ÖSYM Tercih Formu Çıktısı Al"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">PDF Olarak Yazdır</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Controls & Quick Summary Bar */}
        <div className="px-6 py-3 bg-slate-950/70 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("audit")}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                activeTab === "audit"
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-slate-800 text-slate-300 hover:text-white"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Hata Denetimi ({auditWarnings.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("list")}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                activeTab === "list"
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-slate-800 text-slate-300 hover:text-white"
              }`}
            >
              <span>Tercih Sıralamam ({shortlist.length}/24)</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {shortlist.length > 1 && (
              <button
                type="button"
                onClick={handleAutoSort}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 font-semibold flex items-center gap-1.5 border border-slate-700 transition"
                title="Ölü tercihleri önlemek için sıralamaya göre otomatik düzenler"
              >
                <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Akıllı Sırala (Ölü Tercihleri Çöz)</span>
              </button>
            )}

            {shortlist.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm("Tercih listenizdeki tüm programlar temizlensin mi?")) {
                    onClear();
                  }
                }}
                className="text-xs text-rose-400 hover:text-rose-300"
              >
                Listeyi Temizle
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          {shortlist.length === 0 ? (
            <div className="py-20 text-center text-slate-400 space-y-3">
              <FileCheck2 className="w-12 h-12 text-slate-600 mx-auto" />
              <h4 className="text-base font-bold text-slate-200">
                Tercih Listenizde Henüz Program Yok
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Tercih Danışmanı veya Program Rehberi&apos;nden program kartlarındaki <strong>&quot;Listeme Ekle&quot;</strong> butonunu kullanarak 24&apos;e kadar tercih ekleyebilirsiniz.
              </p>
            </div>
          ) : (
            <>
              {/* AUDIT SUMMARY TAB */}
              {activeTab === "audit" && (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div
                    className={`p-4 rounded-2xl border flex items-start gap-3 ${
                      auditWarnings.length === 0
                        ? "bg-emerald-950/20 border-emerald-500/30"
                        : "bg-amber-950/20 border-amber-500/30"
                    }`}
                  >
                    {auditWarnings.length === 0 ? (
                      <>
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                          <FileCheck2 className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-sm font-bold text-white">
                            Harika! Listenizde Kritik Hata veya Ölü Tercih Bulunmadı.
                          </h4>
                          <p className="text-xs text-slate-300">
                            Tercihleriniz başarı sırası hiyerarşisine ve ÖSYM yerleştirme mantığına uygun bir düzende sıralanmıştır.
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/20">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-sm font-bold text-white">
                            Dikkat: Listenizde {auditWarnings.length} Olası Tercih Riski Tespit Edildi
                          </h4>
                          <p className="text-xs text-slate-300">
                            Aşağıdaki uyarıları inceleyebilir veya <strong>&quot;Akıllı Sırala&quot;</strong> butonuyla listeyi otomatik olarak ideal mantığa getirebilirsiniz.
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Audit Warning Cards */}
                  {auditWarnings.map((warn, wIdx) => (
                    <div
                      key={wIdx}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" />
                          {warn.title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {warn.message}
                      </p>
                    </div>
                  ))}

                  {/* Portfolio Balance Stats */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      Listenizin Portföy Dağılımı ({shortlist.length} Tercih)
                    </h5>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-semibold">Daha Rekabetçi</span>
                        <span className="text-base font-bold font-mono text-amber-400 block mt-0.5">
                          {countReach}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          (%{Math.round((countReach / shortlist.length) * 100) || 0})
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-semibold">Sıralamana Yakın</span>
                        <span className="text-base font-bold font-mono text-indigo-400 block mt-0.5">
                          {countTarget}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          (%{Math.round((countTarget / shortlist.length) * 100) || 0})
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-semibold">Daha Ulaşılabilir</span>
                        <span className="text-base font-bold font-mono text-emerald-400 block mt-0.5">
                          {countSafe}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          (%{Math.round((countSafe / shortlist.length) * 100) || 0})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* LIST MANAGEMENT TAB */}
              {activeTab === "list" && (
                <div className="space-y-3">
                  {shortlist.map((prog, index) => {
                    const isDeadChoice = auditWarnings.some(
                      (w) => w.type === "dead_choice" && w.indices?.includes(index)
                    );

                    return (
                      <div
                        key={prog.program_code}
                        className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isDeadChoice
                            ? "bg-amber-950/20 border-amber-500/40"
                            : "bg-slate-950 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        {/* Index & Name */}
                        <div className="flex items-start gap-3">
                          <span className="w-7 h-7 rounded-xl bg-slate-800 text-white font-mono text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                            {index + 1}
                          </span>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                                {prog.program_code}
                              </span>

                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  prog.category === "reach"
                                    ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                                    : prog.category === "target"
                                    ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
                                    : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                                }`}
                              >
                                {prog.category_label}
                              </span>

                              {isDeadChoice && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  Ölü Tercih Riski
                                </span>
                              )}
                            </div>

                            <h4 className="text-sm font-bold text-white">
                              {prog.program_name}
                            </h4>

                            <p className="text-xs text-slate-400 flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-slate-500" />
                              <span>{prog.university_name}</span>
                              {prog.city && (
                                <span className="flex items-center gap-1 text-slate-500">
                                  • <MapPin className="w-3 h-3" /> {prog.city}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Rank & Reorder Controls */}
                        <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                          <div className="text-left sm:text-right">
                            <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                              Taban Sıra
                            </span>
                            <span className="text-xs font-mono font-bold text-white">
                              {prog.latest_rank ? formatRank(prog.latest_rank) : "—"}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMove(index, "up")}
                              disabled={index === 0}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-20 transition"
                              title="Yukarı Taşı"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleMove(index, "down")}
                              disabled={index === shortlist.length - 1}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-20 transition"
                              title="Aşağı Taşı"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => onRemove(prog.program_code)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/30 text-slate-400 hover:text-rose-300 transition ml-1"
                              title="Listeden Çıkar"
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
            </>
          )}

          {/* Legal Disclaimer */}
          <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 text-[11px] text-slate-400 text-center flex items-center justify-center gap-2">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>
              Bu denetim resmi ÖSYM tercih kuralları ve başarı sıralaması matematiği referans alınarak rehberlik amacıyla yapılmıştır.
            </span>
          </div>
        </div>

        {/* PRINTABLE OFFICIAL ÖSYM FORMATTED CONTAINER (Hidden on screen, visible only when printing) */}
        <div className="hidden print:block fixed inset-0 bg-white text-black p-8 font-serif z-[9999]">
          <div className="text-center pb-4 border-b-2 border-black space-y-1">
            <h1 className="text-xl font-bold uppercase tracking-wider">
              T.C. Yükseköğretim Kurumları Sınavı (YKS)
            </h1>
            <h2 className="text-base font-semibold">
              Merkezi Yerleştirme Aday Tercih Bildirim Formu (Taslak)
            </h2>
            <div className="flex justify-between text-xs pt-2">
              <span>
                <strong>Aday Başarı Sırası:</strong> {studentRank ? formatRank(studentRank) : "Belirtilmedi"} ({scoreType || "SAY"})
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
                <th className="p-1.5 border border-black w-20 text-right">Son Taban Sıra</th>
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

          <div className="mt-8 pt-4 border-t border-black flex justify-between text-xs">
            <div>
              <p className="italic">
                * Bu liste, &quot;YKS Tercih Asistanı&quot; Açıklanabilir Yapay Zeka karar destek sistemi ile hazırlanmıştır.
              </p>
              <p className="mt-1 font-semibold">
                ÖSYM Aday İşlemleri Sistemi (AİS) üzerinden resmi olarak onaylanması gerekmektedir.
              </p>
            </div>
            <div className="text-right pr-4">
              <p>Aday / Danışman İmzası:</p>
              <div className="w-32 h-10 border-b border-black mt-2"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
