export interface HistoryRecord {
  year: number;
  published_quota: number | null;
  closing_rank: number | null;
  quota_source?: string;
  rank_source_url?: string;
}

export interface Program {
  program_code: string;
  university_name: string;
  program_name: string;
  score_type: string;
  city?: string | null;
  faculty?: string | null;
  teaching_language?: string | null;
  scholarship?: string | null;
  education_type?: string | null;
  official_url?: string | null;
  history: HistoryRecord[];
}

export interface SearchResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: Program[];
}

export interface WaterfallStep {
  step: string;
  label: string;
  value?: number;
  input_val?: number;
  change: number;
  cumulative: number;
}

export interface PredictionResponse {
  status: "success" | "unsupported_score_type" | "missing_inputs";
  message?: string;
  score_type?: string;
  target_year?: number;
  model_label?: string;
  inputs?: {
    previous_closing_rank: number;
    input_rank_year?: number;
    published_quota: number;
    input_quota_year?: number;
    quota_change_pct?: number;
    rank_momentum_ratio?: number;
  };
  predictions?: {
    predicted_closing_rank: number;
    prediction_interval?: {
      lower: number;
      upper: number;
      margin_pct: number;
      confidence_level?: number;
    };
    latest_actual_closing_rank?: number | null;
    latest_actual_year?: number;
    actual_closing_rank?: number | null;
    baseline_prediction?: number;
    model_absolute_error?: number | null;
    baseline_absolute_error?: number | null;
  };
  shap?: {
    reference_value: number;
    signed_contributions: {
      previous_closing_rank: number;
      published_quota: number;
    };
    reproduced_prediction: number;
    verification_passed: boolean;
    dominant_feature: string;
    waterfall_steps: WaterfallStep[];
  };
}

export interface ExplanationResponse {
  source: string;
  model?: string;
  explanation: string;
  notice?: string;
}

export interface CandidateImpact {
  student_rank: number;
  base_category: "reach" | "target" | "safe";
  base_category_label: string;
  simulated_category: "reach" | "target" | "safe";
  simulated_category_label: string;
  category_changed: boolean;
  base_distance: number;
  simulated_distance: number;
}

export interface SimulationResponse {
  status: "success" | "unsupported_score_type" | "invalid_input" | "missing_inputs";
  message?: string;
  program_code?: string;
  program_name?: string;
  university_name?: string;
  previous_closing_rank?: number;
  original_quota?: number;
  simulated_quota?: number;
  quota_delta?: number;
  baseline_predicted_rank?: number;
  simulated_predicted_rank?: number;
  rank_delta?: number;
  original_shap_quota?: number;
  simulated_shap_quota?: number;
  simulated_prediction_interval?: {
    lower: number;
    upper: number;
    margin_pct: number;
  };
  sim_quota_change_pct?: number;
  candidate_impact?: CandidateImpact | null;
  interpretation?: string;
}

export interface EvaluationResponse {
  test_year: number;
  train_year: number;
  score_type: string;
  test_sample_size: number;
  random_forest_mae: number;
  baseline_mae: number;
  winner: "baseline" | "random_forest";
  difference: number;
  percentage_difference: number;
  methodology: {
    train_split: string;
    test_split: string;
    hyperparameters: string;
    features: string[];
  };
}

// ================= ADVISOR TYPES ================= //

export interface OptionItem {
  id: string;
  label: string;
}

export interface AdvisorMetadata {
  score_types: OptionItem[];
  popular_programs: string[];
  cities: string[];
  university_types: OptionItem[];
  teaching_languages: OptionItem[];
  scholarships: OptionItem[];
  priorities: OptionItem[];
  latest_dataset_year: number;
  tuition_data_verified: boolean;
}

export interface StudentPreferencePayload {
  score_type: string;
  rank: string | number;
  target_programs: string[];
  preferred_cities?: string[];
  cities_strict?: boolean;
  university_type?: string;
  university_type_strict?: boolean;
  teaching_language?: string;
  language_strict?: boolean;
  scholarship?: string;
  scholarship_strict?: boolean;
  max_tuition?: number | null;
  tuition_strict?: boolean;
  priority?: string;
}

export interface RelaxationSuggestion {
  criteria_key: string;
  label: string;
  reason: string;
  action_text: string;
  eliminated_count: number;
}

export interface RecommendedProgram {
  program_code: string;
  university_name: string;
  program_name: string;
  score_type: string;
  city?: string | null;
  faculty?: string | null;
  teaching_language?: string | null;
  scholarship?: string | null;
  education_type?: string | null;
  official_url?: string | null;
  latest_quota?: number | null;
  latest_rank?: number | null;
  latest_rank_year?: number;
  history: HistoryRecord[];
  rank_distance?: number | null;
  category: "reach" | "target" | "safe" | "insufficient_data";
  category_label: string;
  category_description: string;
  strategic_tier?: string;
  preference_fit_score: number;
  rank_fit_score: number;
  total_score: number;
  matches_notes?: string[];
  trade_offs: string[];
  explanation: string;
}

export interface AdvisorResponse {
  status: "success" | "no_matches" | "error";
  message?: string;
  total_matched?: number;
  student_rank?: number;
  score_type?: string;
  target_programs?: string[];
  priority?: string;
  items?: RecommendedProgram[];
  relaxation_suggestions?: RelaxationSuggestion[];
}

// ================= ANALYTICS & VISUALIZATION TYPES ================= //

export interface TopUniversityInCity {
  name: string;
  type: "Devlet" | "Vakıf";
  program_count: number;
}

export interface CitySummary {
  city_name: string;
  region: string;
  university_count: number;
  program_count: number;
  cost_tier: "high" | "medium" | "low";
  cost_label: string;
  rent_index_score: number;
  dorm_availability: string;
  living_cost_description: string;
  median_closing_rank: number | null;
  min_closing_rank: number | null;
  total_quota_2025: number;
  score_types_count: Record<string, number>;
  uni_types_count: Record<string, number>;
  top_universities: TopUniversityInCity[];
}

export interface RegionSummary {
  city_count: number;
  program_count: number;
  university_count: number;
}

export interface CitiesAnalyticsResponse {
  status: string;
  total_cities: number;
  cities: CitySummary[];
  regions_summary: Record<string, RegionSummary>;
}

export interface TrendProgram {
  program_code: string;
  university_name: string;
  program_name: string;
  score_type: string;
  city: string;
  rank_2023: number;
  rank_2024: number | null;
  rank_2025: number;
  quota_2025: number;
  rank_difference: number;
  change_pct: number;
}

export interface SectorTrend {
  sector_name: string;
  program_count: number;
  average_change_pct: number;
  direction: "up" | "down" | "neutral";
  median_rank_2025: number;
  trend_label: string;
}

export interface TrendAnalyticsResponse {
  status: string;
  score_type: string;
  sample_size: number;
  ticker_headlines: string[];
  top_gainers: TrendProgram[];
  top_decliners: TrendProgram[];
  sector_trends: SectorTrend[];
}
