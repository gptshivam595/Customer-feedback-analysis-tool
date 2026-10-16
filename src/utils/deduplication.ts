import { AnalyzedReview, CandidateReview } from '../types';

/**
 * Normalizes text for exact duplicate detection.
 * Removes excess whitespace, punctuation, and converts to lowercase.
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate Jaccard word-set similarity between two texts.
 */
export function calculateJaccardSimilarity(textA: string, textB: string): number {
  const wordsA = new Set(normalizeText(textA).split(' ').filter(w => w.length > 2));
  const wordsB = new Set(normalizeText(textB).split(' ').filter(w => w.length > 2));

  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) intersection++;
  }

  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : intersection / union;
}

export interface DeduplicationResult<T extends { raw_text?: string; original_text?: string; review_id: string }> {
  items: Array<T & { duplicate_status: 'unique' | 'exact_duplicate' | 'potential_duplicate'; duplicate_of_id?: string }>;
  exact_duplicate_count: number;
  potential_duplicate_count: number;
  unique_count: number;
}

/**
 * Runs 2-stage deduplication on a list of candidate or analyzed reviews.
 */
export function deduplicateReviews<T extends { raw_text?: string; original_text?: string; review_id: string }>(
  records: T[]
): DeduplicationResult<T> {
  const seenExactMap = new Map<string, string>(); // normalizedText -> first review_id
  const seenNormalizedList: Array<{ id: string; norm: string; text: string }> = [];

  let exactDupCount = 0;
  let potDupCount = 0;

  const processed = records.map(record => {
    const raw = (record.original_text || record.raw_text || '').trim();
    const norm = normalizeText(raw);

    // Stage 1: Exact duplicate
    if (seenExactMap.has(norm)) {
      const originalId = seenExactMap.get(norm)!;
      exactDupCount++;
      return {
        ...record,
        duplicate_status: 'exact_duplicate' as const,
        duplicate_of_id: originalId,
      };
    }

    // Stage 2: Potential semantic / high-similarity duplicate (Jaccard >= 0.82)
    let potentialMatchId: string | undefined;
    for (const prior of seenNormalizedList) {
      const sim = calculateJaccardSimilarity(raw, prior.text);
      if (sim >= 0.82) {
        potentialMatchId = prior.id;
        break;
      }
    }

    if (potentialMatchId) {
      potDupCount++;
      return {
        ...record,
        duplicate_status: 'potential_duplicate' as const,
        duplicate_of_id: potentialMatchId,
      };
    }

    // Mark as first seen
    seenExactMap.set(norm, record.review_id);
    seenNormalizedList.push({ id: record.review_id, norm, text: raw });

    return {
      ...record,
      duplicate_status: 'unique' as const,
    };
  });

  return {
    items: processed,
    exact_duplicate_count: exactDupCount,
    potential_duplicate_count: potDupCount,
    unique_count: records.length - exactDupCount,
  };
}
