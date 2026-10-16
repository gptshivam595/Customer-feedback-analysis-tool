import { z } from 'zod';

function normalizeSentiment(val: unknown): 'positive' | 'negative' | 'mixed' | 'neutral' | 'unclassified' {
  if (typeof val !== 'string') return 'negative';
  const low = val.trim().toLowerCase();
  if (low.includes('pos')) return 'positive';
  if (low.includes('neg')) return 'negative';
  if (low.includes('mix')) return 'mixed';
  if (low.includes('neut')) return 'neutral';
  return 'unclassified';
}

function normalizeSeverity(val: unknown): 'High' | 'Medium' | 'Low' | 'Unknown' {
  if (typeof val !== 'string') return 'Medium';
  const low = val.trim().toLowerCase();
  if (low.includes('high') || low.includes('crit') || low.includes('sev')) return 'High';
  if (low.includes('med') || low.includes('mod')) return 'Medium';
  if (low.includes('low') || low.includes('min')) return 'Low';
  if (low.includes('unk') || low.includes('none') || low.includes('n/a')) return 'Unknown';
  return 'Medium';
}

function normalizeClassification(val: unknown): 'first_hand_customer_review' | 'editorial_review' | 'aggregated_review_summary' | 'competitor_comparison' | 'product_description' | 'unclear' {
  if (typeof val !== 'string') return 'first_hand_customer_review';
  const low = val.trim().toLowerCase();
  if (low.includes('editorial')) return 'editorial_review';
  if (low.includes('aggreg') || low.includes('summary')) return 'aggregated_review_summary';
  if (low.includes('compet') || low.includes('comparison')) return 'competitor_comparison';
  if (low.includes('product') || low.includes('description')) return 'product_description';
  if (low.includes('unclear')) return 'unclear';
  return 'first_hand_customer_review';
}

function normalizeJourneyStage(val: unknown):
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
  | 'General or unclear' {
  if (typeof val !== 'string') return 'General or unclear';
  const low = val.trim().toLowerCase();
  if (low.includes('bill') || low.includes('account') || low.includes('pricing') || low.includes('cancel') || low.includes('refund')) {
    return 'Billing and account management';
  }
  if (low.includes('permission') || low.includes('integrat') || low.includes('calendar') || low.includes('consent') || low.includes('tenant')) {
    return 'Permissions and integrations';
  }
  if (low.includes('during') || low.includes('in-meeting') || low.includes('live') || low.includes('call')) {
    return 'During meeting';
  }
  if (low.includes('signup') || low.includes('sign up') || low.includes('onboard') || low.includes('login') || low.includes('register')) {
    return 'Signup and onboarding';
  }
  if (low.includes('post') || low.includes('review') || low.includes('transcript') || low.includes('notes') || low.includes('summary')) {
    return 'Post-meeting review';
  }
  if (low.includes('action') || low.includes('follow')) {
    return 'Follow-up and action';
  }
  if (low.includes('search') || low.includes('retriev')) {
    return 'Search and retrieval';
  }
  if (low.includes('shar') || low.includes('collab')) {
    return 'Sharing and collaboration';
  }
  if (low.includes('pre') || low.includes('schedul')) {
    return 'Pre-meeting setup';
  }
  if (low.includes('discover') || low.includes('evaluat')) {
    return 'Discovery and evaluation';
  }
  return 'General or unclear';
}

function normalizeConfidence(val: unknown): number {
  if (typeof val === 'number') {
    if (val > 1 && val <= 100) return Math.round((val / 100) * 100) / 100;
    if (val >= 0 && val <= 1) return Math.round(val * 100) / 100;
  }
  if (typeof val === 'string') {
    const parsed = parseFloat(val.replace('%', ''));
    if (!isNaN(parsed)) {
      if (parsed > 1 && parsed <= 100) return Math.round((parsed / 100) * 100) / 100;
      if (parsed >= 0 && parsed <= 1) return Math.round(parsed * 100) / 100;
    }
  }
  return 0.9;
}

function normalizeSecondaryThemes(val: unknown): string[] {
  if (Array.isArray(val)) {
    return val.map(String).filter(Boolean);
  }
  if (typeof val === 'string' && val.trim().length > 0) {
    return val.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

function normalizeBoolean(val: unknown): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    const low = val.trim().toLowerCase();
    return low === 'true' || low === 'yes' || low === '1';
  }
  return false;
}

export const SingleReviewClassificationSchema = z.object({
  review_id: z.preprocess(v => String(v ?? ''), z.string()),
  product_name: z.preprocess(v => (v ? String(v) : 'Read AI'), z.string()).default('Read AI'),
  review_classification: z.preprocess(normalizeClassification, z.enum([
    'first_hand_customer_review',
    'editorial_review',
    'aggregated_review_summary',
    'competitor_comparison',
    'product_description',
    'unclear',
  ])),
  sentiment: z.preprocess(normalizeSentiment, z.enum(['positive', 'negative', 'mixed', 'neutral', 'unclassified'])),
  sentiment_reason: z.preprocess(v => String(v ?? 'Feedback analyzed from review text.'), z.string()).default(''),
  primary_theme: z.preprocess(v => String(v ?? 'Ease of use'), z.string()).default('Ease of use'),
  secondary_themes: z.preprocess(normalizeSecondaryThemes, z.array(z.string())).default([]),
  user_journey_stage: z.preprocess(normalizeJourneyStage, z.enum([
    'Discovery and evaluation',
    'Signup and onboarding',
    'Permissions and integrations',
    'Pre-meeting setup',
    'During meeting',
    'Post-meeting review',
    'Search and retrieval',
    'Sharing and collaboration',
    'Follow-up and action',
    'Billing and account management',
    'General or unclear',
  ])),
  user_problem: z.preprocess(v => (v ? String(v) : null), z.string().nullable()).default(null),
  product_strength: z.preprocess(v => (v ? String(v) : null), z.string().nullable()).default(null),
  severity: z.preprocess(normalizeSeverity, z.enum(['High', 'Medium', 'Low', 'Unknown'])),
  evidence_excerpt: z.preprocess(v => String(v ?? ''), z.string()).default(''),
  product_implication: z.preprocess(v => String(v ?? ''), z.string()).default(''),
  recommended_improvement: z.preprocess(v => String(v ?? ''), z.string()).default(''),
  confidence: z.preprocess(normalizeConfidence, z.number().min(0).max(1)).default(0.9),
  needs_human_review: z.preprocess(normalizeBoolean, z.boolean()).default(false),
  supporting_evidence: z.preprocess(v => String(v ?? ''), z.string()).default(''),
});

export const BatchAnalysisResponseSchema = z.preprocess((val: any) => {
  if (Array.isArray(val)) {
    return { reviews: val };
  }
  if (val && typeof val === 'object') {
    if (Array.isArray(val.reviews)) return val;
    if (Array.isArray(val.data)) return { reviews: val.data };
    if (Array.isArray(val.result)) return { reviews: val.result };
    if (Array.isArray(val.items)) return { reviews: val.items };
  }
  return val;
}, z.object({
  reviews: z.array(SingleReviewClassificationSchema),
}));

export type ValidatedBatchResponse = z.infer<typeof BatchAnalysisResponseSchema>;
