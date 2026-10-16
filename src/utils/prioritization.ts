import { PrioritizationWeights, Severity, UserJourneyStage } from '../types';

export const DEFAULT_WEIGHTS: PrioritizationWeights = {
  frequency: 0.40,
  severity: 0.30,
  journey_impact: 0.20,
  confidence: 0.10,
};

/**
 * Maps User Journey Stage to baseline value-blocker impact (0 to 100).
 * Stages that trap user data, lock out accounts, or disrupt business meetings score highest.
 */
export function getJourneyStageImpactScore(stage: UserJourneyStage): number {
  switch (stage) {
    case 'Billing and account management':
      return 95; // unauthorized charges, cannot cancel, subscription trapped
    case 'Permissions and integrations':
      return 90; // invasive auto-calendar sync, unauthorized tenant bot propagation
    case 'During meeting':
      return 85; // bot invading live external client call, cannot eject
    case 'Signup and onboarding':
      return 75; // deceptive loop, forced calendar consent
    case 'Post-meeting review':
      return 60; // missing transcripts, audio/video lock
    case 'Follow-up and action':
      return 55; // missing action items
    case 'Search and retrieval':
      return 50; // hard to find past calls
    case 'Sharing and collaboration':
      return 45; // notes sharing loop
    case 'Pre-meeting setup':
      return 40; // scheduling links
    case 'Discovery and evaluation':
      return 30; // evaluation confusion
    case 'General or unclear':
    default:
      return 35;
  }
}

/**
 * Maps severity to normalized 0-100 score.
 * High (3) -> 100
 * Medium (2) -> 60
 * Low (1) -> 25
 * Unknown -> null (unscored)
 */
export function getSeverityScore(severity: Severity): number | null {
  switch (severity) {
    case 'High':
      return 100;
    case 'Medium':
      return 60;
    case 'Low':
      return 25;
    case 'Unknown':
      return null;
  }
}

/**
 * Calculates priority score using Section 9 heuristic:
 * priority_score = 0.40 * frequency_score + 0.30 * severity_score + 0.20 * journey_impact_score + 0.10 * confidence_score
 */
export function calculatePriorityScore(params: {
  frequencyRatio: number; // 0 to 1 (share of unique reviews)
  severity: Severity;
  journeyStage: UserJourneyStage;
  confidence: number; // 0 to 1
  weights?: PrioritizationWeights;
}): { score: number; isUnscoredSeverity: boolean; breakdown: { freq: number; sev: number; journey: number; conf: number } } {
  const weights = params.weights || DEFAULT_WEIGHTS;

  const freqScore = Math.min(100, Math.round(params.frequencyRatio * 100 * 2.5)); // scaled so 40%+ frequency hits near 100
  const sevScore = getSeverityScore(params.severity);
  const journeyScore = getJourneyStageImpactScore(params.journeyStage);
  const confScore = Math.round(params.confidence * 100);

  if (sevScore === null) {
    // Insufficient evidence for severity - redistribute weights across available dimensions
    const totalRemainingWeight = weights.frequency + weights.journey_impact + weights.confidence;
    const adjustedFreqWeight = weights.frequency / totalRemainingWeight;
    const adjustedJourneyWeight = weights.journey_impact / totalRemainingWeight;
    const adjustedConfWeight = weights.confidence / totalRemainingWeight;

    const partialScore = Math.round(
      adjustedFreqWeight * freqScore +
      adjustedJourneyWeight * journeyScore +
      adjustedConfWeight * confScore
    );

    return {
      score: partialScore,
      isUnscoredSeverity: true,
      breakdown: { freq: freqScore, sev: 0, journey: journeyScore, conf: confScore },
    };
  }

  const rawScore = Math.round(
    weights.frequency * freqScore +
    weights.severity * sevScore +
    weights.journey_impact * journeyScore +
    weights.confidence * confScore
  );

  return {
    score: Math.min(100, Math.max(0, rawScore)),
    isUnscoredSeverity: false,
    breakdown: { freq: freqScore, sev: sevScore, journey: journeyScore, conf: confScore },
  };
}
