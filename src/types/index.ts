export type ReviewClassification =
  | 'first_hand_customer_review'
  | 'editorial_review'
  | 'aggregated_review_summary'
  | 'competitor_comparison'
  | 'product_description'
  | 'unclear';

export type Sentiment = 'positive' | 'negative' | 'mixed' | 'neutral' | 'unclassified';

export type Severity = 'High' | 'Medium' | 'Low' | 'Unknown';

export type UserJourneyStage =
  | 'Discovery and evaluation'
  | 'Signup and onboarding'
  | 'Permissions and integrations'
  | 'Pre-meeting setup'
  | 'During meeting'
  | 'Post-meeting review'
  | 'Search and retrieval'
  | 'Sharing and collaboration'
  | 'Follow-up and action'
  | 'Billing and account management'
  | 'General or unclear';

export const THEME_TAXONOMY = [
  'Ease of use',
  'Onboarding and setup',
  'Login and authentication',
  'Reliability and availability',
  'Transcription accuracy',
  'Speaker identification',
  'Summary quality',
  'Action-item quality',
  'Recording and playback',
  'Search and retrieval',
  'Integrations',
  'Collaboration and sharing',
  'Privacy and consent',
  'Meeting participation and auto-join',
  'Performance',
  'Customer support',
  'Pricing and billing',
  'Accessibility and language support',
  'Feature requests',
  'Other',
  'Unknown',
] as const;

export type Theme = (typeof THEME_TAXONOMY)[number] | string;

export interface DocumentRecord {
  id: string;
  name: string;
  size: number;
  content_hash: string;
  platform: string;
  status: 'ready' | 'extracting' | 'extracted' | 'error' | 'warning';
  raw_text: string;
  review_count_detected: number;
  extracted_at: string;
  warnings: string[];
  is_default: boolean;
  selected_for_analysis: boolean;
}

export interface CandidateReview {
  review_id: string;
  source_document_id: string;
  source_document: string;
  source_reference: string;
  platform: string;
  author: string | null;
  review_date: string | null;
  raw_text: string;
  confidence: number;
  needs_human_review: boolean;
  detected_via: 'deterministic_pattern' | 'llm_segmentation' | 'curated_source';
}

export interface AnalyzedReview {
  review_id: string;
  source_document: string;
  source_document_id: string;
  source_reference: string;
  platform: string;
  product_name: string;
  author: string | null;
  review_date: string | null;
  original_text: string;
  review_classification: ReviewClassification;
  sentiment: Sentiment;
  sentiment_reason: string;
  primary_theme: string;
  secondary_themes: string[];
  user_journey_stage: UserJourneyStage;
  user_problem: string | null;
  product_strength: string | null;
  severity: Severity;
  evidence_excerpt: string;
  product_implication: string;
  recommended_improvement: string;
  confidence: number;
  needs_human_review: boolean;
  duplicate_status: 'unique' | 'exact_duplicate' | 'potential_duplicate';
  duplicate_of_id?: string;
  supporting_evidence: string;
  user_edited?: boolean;
}

export interface PrioritizationWeights {
  frequency: number; // e.g. 0.40
  severity: number;  // e.g. 0.30
  journey_impact: number; // e.g. 0.20
  confidence: number; // e.g. 0.10
}

export interface PrioritizedOpportunity {
  rank: number;
  theme: string;
  problem_statement: string;
  unique_reviews_count: number;
  sample_percentage: number;
  severity: Severity;
  journey_stage: UserJourneyStage;
  priority_score: number;
  confidence: number;
  representative_quotes: string[];
  source_references: string[];
  recommended_improvement: string;
  limitations: string;
}

export interface ThemeSummary {
  theme: string;
  unique_review_count: number;
  sample_percentage: number;
  positive_count: number;
  negative_count: number;
  mixed_count: number;
  neutral_count: number;
  avg_severity_score: number;
  priority_score: number;
  supporting_review_ids: string[];
  evidence_summary: string;
}

export interface StrengthItem {
  theme: string;
  review_count: number;
  sample_percentage: number;
  why_valued: string;
  behavior_to_preserve: string;
  quotes: string[];
  supporting_review_ids: string[];
}

export interface AnalysisRun {
  id: string;
  timestamp: string;
  status:
    | 'idle'
    | 'extracting'
    | 'segmenting'
    | 'classifying'
    | 'validating'
    | 'aggregating'
    | 'generating_insights'
    | 'completed'
    | 'failed'
    | 'partially_completed'
    | 'cancelled';
  progress_percent: number;
  current_step_label: string;
  total_documents_included: number;
  total_candidates_detected: number;
  total_unique_reviews: number;
  total_duplicates_excluded: number;
  needs_review_count: number;
  sentiment_breakdown: {
    positive: number;
    negative: number;
    mixed: number;
    neutral: number;
    unclassified: number;
  };
  executive_summary: string;
  strengths: StrengthItem[];
  opportunities: PrioritizedOpportunity[];
  theme_summaries: ThemeSummary[];
  journey_stage_counts: Record<string, number>;
  model_used: string;
  prompt_version: string;
  warnings: string[];
}

export interface AppSettings {
  model_name: string;
  batch_size: number;
  custom_instructions: string;
  weights: PrioritizationWeights;
}
