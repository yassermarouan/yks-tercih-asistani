import type {
  SearchResponse,
  Program,
  PredictionResponse,
  ExplanationResponse,
  EvaluationResponse,
  AdvisorMetadata,
  StudentPreferencePayload,
  AdvisorResponse,
  SimulationResponse,
} from "./types";

const API_BASE = "/api";

export async function searchPrograms(
  query: string = "",
  scoreType: string = "ALL",
  page: number = 1,
  pageSize: number = 20
): Promise<SearchResponse> {
  const params = new URLSearchParams({
    q: query,
    score_type: scoreType,
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  const res = await fetch(`${API_BASE}/programs?${params}`);
  if (!res.ok) throw new Error("Programlar yüklenirken bir hata oluştu.");
  return res.json();
}

export async function getProgramDetail(programCode: string): Promise<Program> {
  const res = await fetch(`${API_BASE}/programs/${encodeURIComponent(programCode)}`);
  if (!res.ok) throw new Error("Program detayları yüklenemedi.");
  return res.json();
}

export async function getPrediction(programCode: string): Promise<PredictionResponse> {
  const res = await fetch(`${API_BASE}/programs/${encodeURIComponent(programCode)}/prediction`);
  if (!res.ok) throw new Error("Model tahmini ve SHAP hesaplanırken bir hata oluştu.");
  return res.json();
}

export async function generateExplanation(
  programCode: string,
  studentRank?: number
): Promise<ExplanationResponse> {
  const res = await fetch(`${API_BASE}/programs/${encodeURIComponent(programCode)}/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ student_rank: studentRank }),
  });
  if (!res.ok) throw new Error("Açıklama oluşturulurken bir hata oluştu.");
  return res.json();
}

export async function simulateProgramQuota(
  programCode: string,
  simulatedQuota: number,
  studentRank?: number
): Promise<SimulationResponse> {
  const res = await fetch(`${API_BASE}/programs/${encodeURIComponent(programCode)}/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      simulated_quota: simulatedQuota,
      student_rank: studentRank,
    }),
  });
  if (!res.ok) throw new Error("Kontenjan simülasyonu çalıştırılırken bir hata oluştu.");
  return res.json();
}

export async function generateSimulationExplanation(
  programCode: string,
  simulatedQuota: number,
  studentRank?: number
): Promise<ExplanationResponse> {
  const res = await fetch(
    `${API_BASE}/programs/${encodeURIComponent(programCode)}/simulate/explain`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        simulated_quota: simulatedQuota,
        student_rank: studentRank,
      }),
    }
  );
  if (!res.ok) throw new Error("Simülasyon açıklaması oluşturulurken bir hata oluştu.");
  return res.json();
}

export async function getEvaluation(): Promise<EvaluationResponse> {
  const res = await fetch(`${API_BASE}/evaluation`);
  if (!res.ok) throw new Error("Değerlendirme metrikleri yüklenemedi.");
  return res.json();
}

export async function getAdvisorMetadata(): Promise<AdvisorMetadata> {
  const res = await fetch(`${API_BASE}/advisor/metadata`);
  if (!res.ok) throw new Error("Tercih formu seçenekleri yüklenemedi.");
  return res.json();
}

export async function recommendPrograms(payload: StudentPreferencePayload): Promise<AdvisorResponse> {
  const res = await fetch(`${API_BASE}/advisor/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Tercih önerileri hesaplanırken hata oluştu.");
  return res.json();
}

/**
 * Format numbers with Turkish locale separator (e.g. 174.972)
 */
export function formatRank(val: number | null | undefined, decimals: number = 0): string {
  if (val === null || val === undefined || isNaN(val)) return "—";
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val);
}
