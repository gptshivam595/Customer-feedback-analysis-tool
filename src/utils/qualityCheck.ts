import { AnalyzedReview } from '../types';

/**
 * Stage 4 Quality Assurance pass.
 * Deterministically checks:
 * 1. Whether evidence_excerpt exists in original_text (exact or high substring match)
 * 2. Sentiment polarity vs severe negative keywords
 * 3. Theme consistency
 * 4. Ensures no fabricated quotes
 */
export function runQualityAssurance(review: AnalyzedReview): AnalyzedReview {
  let modified = { ...review };
  const origLower = review.original_text.toLowerCase();
  const excerptLower = review.evidence_excerpt.trim().toLowerCase();

  // Check 1: Evidence Excerpt Grounding
  if (!excerptLower || !origLower.includes(excerptLower)) {
    // If the model truncated or paraphrased slightly, try finding the closest sentence in original_text
    const sentences = review.original_text.split(/[.!?\n]/).map(s => s.trim()).filter(s => s.length > 10);
    const bestMatchingSentence = sentences.find(s => {
      const sLower = s.toLowerCase();
      return excerptLower.includes(sLower.slice(0, Math.min(25, sLower.length)));
    });

    if (bestMatchingSentence) {
      modified.evidence_excerpt = bestMatchingSentence;
    } else {
      // Excerpt not found in original text -> fallback to first substantial sentence of original text
      const fallbackSentence = sentences[0] || review.original_text.slice(0, 120);
      modified.evidence_excerpt = fallbackSentence;
      modified.needs_human_review = true;
      modified.confidence = Math.max(0.5, modified.confidence - 0.2);
    }
  }

  // Check 2: Severe negative keywords vs positive classification
  const extremeNegatives = ['malware', 'virus', 'spyware', 'scam', 'unauthorized', 'stole', 'stolen', 'illegal', 'fck', 'terrible', 'worst'];
  const hasExtremeNegative = extremeNegatives.some(kw => origLower.includes(kw));

  if (hasExtremeNegative && modified.sentiment === 'positive') {
    // Flag disagreement
    modified.sentiment = 'negative';
    modified.severity = 'High';
    modified.sentiment_reason = 'Corrected by QA rule: text contains explicit security/malware criticism.';
    modified.needs_human_review = true;
  }

  // Check 3: If privacy/virus is mentioned, primary theme should align with Privacy & consent or Meeting participation & auto-join
  if ((origLower.includes('virus') || origLower.includes('spyware') || origLower.includes('without permission') || origLower.includes('auto join')) &&
      (modified.primary_theme === 'Ease of use' || modified.primary_theme === 'Unknown')) {
    modified.primary_theme = origLower.includes('auto join') || origLower.includes('meeting')
      ? 'Meeting participation and auto-join'
      : 'Privacy and consent';
  }

  // Check 4: Check confidence bounds
  if (modified.confidence < 0) modified.confidence = 0;
  if (modified.confidence > 1) modified.confidence = 1;

  return modified;
}
