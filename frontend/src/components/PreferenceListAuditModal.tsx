import React, { useState } from "react";
import type { RecommendedProgram } from "../types";
import { formatRank } from "../api";
import {
  X,
  Printer,
  ArrowUp,
  ArrowDown,
  Trash2,
  AlertTriangle,
  Wand2,
  CheckCircle2,
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
  const [activeTab, setActiveTab] = useState<"list" | "audit">("list");

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
      const order = { reach: 1, target: 2, safe: 3, insufficient_data: 4 };
      const catA = order[a.category] || 5;
      const catB = order[b.category] || 5;
      if (catA !== catB) return catA - catB;

      const rankA = a.latest_rank || 9999999;
      const rankB = b.latest_rank || 9999999;
      return rankA - rankB;
    });
    onReorder(copy);
  };

  // Audit warnings
  const auditWarnings: { type: "dead_choice" | "safe_missing" | "excess_reach" | "score_mismatch"; title: string; message: string; indices?: number[] }[] = [];

  // Dead choice detection
  for (let i = 0; i < shortlist.length - 1; i++) {
    const current = shortlist[i];
    const next = shortlist[i + 1];

    if (current.latest_rank && next.latest_rank) {
      if (current.latest_rank > next.latest_rank * 1.15) {
        auditWarnings.push({
          type: "dead_choice",
          title: `Sıralama Uyumsuzluğu: ${i + 1}. ve ${i + 2}. Tercihler`,
          message: `${i + 1}. sıradaki ${current.program_name} (${formatRank(current.latest_rank)} taban sıra), ` +
            `${i + 2}. sıradaki ${next.program_name} (${formatRank(next.latest_rank)} taban sıra) programından daha geridedir. ` +
            `ÖSYM merkezi yerleştirmede tercihlere sırayla baktığı için üst sıraya daha çok istediğiniz veya daha rekabetçi bir bölümü koymanız önerilir.`,
          indices: [i, i + 1],
        });
      }
    }
  }

  // Portfolio Balance Checks
  const countReach = shortlist.filter((it) => it.category === "reach").length;
  const countTarget = shortlist.filter((it) => it.category === "target").length;
  const countSafe = shortlist.filter((it) => it.category === "safe").length;

  if (shortlist.length >= 3 && countSafe === 0) {
    auditWarnings.push({
      type: "safe_missing",
      title: "Güvenli Tercih Önerisi",
      message: "Listenizde henüz sıralamanızın altında kalan 'Güvenli Tercih' bulunmuyor. Olası dalgalanmalara karşı listenizin son sıralarına güvenli tercihler eklemeniz tavsiye edilir.",
    });
  }

  if (shortlist.length >= 5 && countReach / shortlist.length > 0.5) {
    auditWarnings.push({
      type: "excess_reach",
      title: "Yüksek Risk Oranı",
      message: `Listenizin büyük kısmı sıralamanızın üzerinde kalan hedeflerden oluşuyor. Listenizi dengeli tercihlerle güçlendirmeniz önerilir.`,
    });
  }

  if (scoreType) {
    const mismatches = shortlist.filter((it) => it.score_type !== scoreType);
    if (mismatches.length > 0) {
      auditWarnings.push({
        type: "score_mismatch",
        title: "Farklı Puan Türü",
        message: `Seçtiğiniz ${mismatches.length} program hedef puan türünüzden (${scoreType}) farklıdır (${mismatches.map((m) => m.score_type).join(", ")}).`,
      });
    }
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Tercih Listeniz ({shortlist.length}/24)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Listenizdeki programları sıralayabilir, sıralama uyumunu kontrol edebilir ve yazdırabilirsiniz.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={shortlist.length === 0}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              title="Yazdır veya PDF Kaydet"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Yazdır / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Controls & Actions */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("list")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                activeTab === "list"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tercih Sıralamam ({shortlist.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("audit")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === "audit"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Uyum ve Kontrol</span>
              {auditWarnings.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {shortlist.length > 1 && (
              <button
                type="button"
                onClick={handleAutoSort}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 transition cursor-pointer"
                title="Programları sıralama ve kategori hiyerarşisine göre otomatik dizer"
              >
                <Wand2 className="w-3 h-3" />
                <span>Otomatik Sırala</span>
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
                className="text-xs text-slate-400 hover:text-rose-600 cursor-pointer"
              >
                Listeyi Temizle
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-4">
          {shortlist.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <p className="font-semibold text-slate-800">Henüz listenize program eklemediniz.</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Tercih Danışmanı veya Program Arama ekranından ilgilendiğiniz bölümlerde <strong>&quot;Listeme Ekle&quot;</strong> butonuna basabilirsiniz.
              </p>
            </div>
          ) : activeTab === "list" ? (
            <div className="space-y-2.5">
              {shortlist.map((prog, index) => {
                const isWarning = auditWarnings.some(
                  (w) => w.type === "dead_choice" && w.indices?.includes(index)
                );

                return (
                  <div
                    key={prog.program_code}
                    className={`p-3.5 sm:p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isWarning
                        ? "bg-amber-50/50 border-amber-200"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>

                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-semibold text-slate-500 uppercase">
                            {prog.university_name} {prog.city ? `• ${prog.city}` : ""}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.2 rounded bg-slate-100 text-slate-600">
                            {prog.score_type}
                          </span>
                          {isWarning && (
                            <span className="text-[10px] font-semibold px-2 py-0.2 rounded bg-amber-100 text-amber-800">
                              Sıralama Kontrolü Önerilir
                            </span>
                          )}
                        </div>

                        <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                          {prog.program_name}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                          Taban Sıra
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {prog.latest_rank ? formatRank(prog.latest_rank) : "Açıklanmadı"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMove(index, "up")}
                          disabled={index === 0}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 transition cursor-pointer"
                          title="Yukarı Taşı"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMove(index, "down")}
                          disabled={index === shortlist.length - 1}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 transition cursor-pointer"
                          title="Aşağı Taşı"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onRemove(prog.program_code)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition ml-1 cursor-pointer"
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
          ) : (
            <div className="space-y-4">
              {/* Audit Status */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  auditWarnings.length === 0
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-amber-50 border-amber-200 text-amber-900"
                }`}
              >
                {auditWarnings.length === 0 ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold">Listenizde Sıralama Hiyerarşisi Düzgün</h4>
                      <p className="text-xs text-emerald-800 mt-0.5">
                        Tercihleriniz başarı sıralamasına ve genel yerleştirme mantığına uygun bir dengede dizilmiştir.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold">{auditWarnings.length} Tavsiye Tespit Edildi</h4>
                      <p className="text-xs text-amber-800 mt-0.5">
                        Aşağıdaki maddeleri inceleyerek listenizi daha verimli hale getirebilirsiniz.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Warning Items */}
              {auditWarnings.map((warn, wIdx) => (
                <div key={wIdx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-xs font-semibold text-slate-900 block">
                    {warn.title}
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {warn.message}
                  </p>
                </div>
              ))}

              {/* Category Counts Breakdown */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-semibold text-slate-700 block uppercase">
                  Liste Dağılımı ({shortlist.length} Tercih)
                </span>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500 block text-[11px]">Hedef Tercihler</span>
                    <strong className="text-base text-amber-800 block">{countReach}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500 block text-[11px]">Dengeli Tercihler</span>
                    <strong className="text-base text-blue-800 block">{countTarget}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500 block text-[11px]">Güvenli Tercihler</span>
                    <strong className="text-base text-emerald-800 block">{countSafe}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>ÖSYM kılavuzuna göre en fazla 24 tercih yapılabilmektedir.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold cursor-pointer"
          >
            Kapat
          </button>
        </div>

        {/* PRINTABLE TEMPLATE (Clean A4 for students & parents) */}
        <div className="hidden print:block fixed inset-0 bg-white text-black p-8 font-sans z-[9999]">
          <div className="text-center pb-4 border-b border-black space-y-1">
            <h1 className="text-lg font-bold uppercase">
              YKS Üniversite Tercih Listesi
            </h1>
            <div className="flex justify-between text-xs pt-2">
              <span>
                <strong>Aday Başarı Sırası:</strong> {studentRank ? formatRank(studentRank) : "—"} ({scoreType || "SAY"})
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
        </div>
      </div>
    </div>
  );
};
