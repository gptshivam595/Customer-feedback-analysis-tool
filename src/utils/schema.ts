import { z } from 'zod';

export const SingleReviewClassificationSchema = z.object({
  review_id: z.string(),
  product_name: z.string().default('Read AI'),
  review_classification: z.enum([
    'first_hand_customer_review',
    'editorial_review',
    'aggregated_review_summary',
    'competitor_comparison',
    'product_description',
    'unclear',
  ]),
  sentiment: z.enum(['positive', 'negative', 'mixed', 'neutral', 'unclassified']),
  sentiment_reason: z.string(),
  primary_theme: z.string(),
  secondary_themes: z.array(z.string()).default([]),
  user_journey_stage: z.enum([
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
  ]),
  user_problem: z.string().nullable().default(null),
  product_strength: z.string().nullable().default(null),
  severity: z.enum(['High', 'Medium', 'Low', 'Unknown']),
  evidence_excerpt: z.string(),
  product_implication: z.string(),
  recommended_improvement: z.string(),
  confidence: z.number().min(0).max(1),
  needs_human_review: z.boolean(),
  supporting_evidence: z.string(),
});

export const BatchAnalysisResponseSchema = z.object({
  reviews: z.array(SingleReviewClassificationSchema),
});

export type ValidatedBatchResponse = z.infer<typeof BatchAnalysisResponseSchema>;
