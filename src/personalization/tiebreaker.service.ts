/**
 * Tie-Breaker Service
 *
 * Applies personalization adjustments to candidates with close scores.
 * This is the ONLY place where personalization affects ranking.
 *
 * CRITICAL RULES:
 * 1. Only applied when confidenceScore >= 0.3
 * 2. Only affects candidates within ±0.03 score proximity
 * 3. Maximum adjustment capped at ±5%
 * 4. Original finalScore is NEVER modified - only ordering changes
 */

import { ScoringResult, TripOptionCandidate } from '../scoring/scoring.types';
import {
  InferredPreferences,
  PersonalizationAdjustment,
  PersonalizationContext,
  SCORE_PROXIMITY_THRESHOLD,
  CONFIDENCE_THRESHOLDS,
  DESTINATION_CATEGORIES,
  DestinationStyle,
} from './types';
import { getMaxAdjustment } from './confidence.service';

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Extended scoring result with personalization data
 */
export interface PersonalizedScoringResult extends ScoringResult {
  /** Personalized score (for sorting only, never exposed) */
  personalizedScore?: number;
  /** Original candidate data (needed for alignment calculations) */
  candidate?: TripOptionCandidate;
}

/**
 * Group candidates into score bands based on proximity
 * Candidates within ±threshold of each other are in the same band
 */
export function groupByScoreProximity(
  results: PersonalizedScoringResult[],
  threshold: number = SCORE_PROXIMITY_THRESHOLD
): PersonalizedScoringResult[][] {
  if (results.length === 0) return [];

  // Sort by score descending first
  const sorted = [...results].sort((a, b) => b.finalScore - a.finalScore);
  const bands: PersonalizedScoringResult[][] = [];
  let currentBand: PersonalizedScoringResult[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const bandTop = currentBand[0].finalScore;

    // Check if current is within threshold of band top
    if (bandTop - current.finalScore <= threshold) {
      currentBand.push(current);
    } else {
      bands.push(currentBand);
      currentBand = [current];
    }
  }

  // Don't forget the last band
  if (currentBand.length > 0) {
    bands.push(currentBand);
  }

  return bands;
}

/**
 * Calculate alignment score for budget sensitivity
 * Returns -1 to 1: negative = misaligned, positive = aligned
 */
export function alignsWithBudgetSensitivity(
  candidate: TripOptionCandidate,
  budgetSensitivity: number
): number {
  // Calculate how much of budget is used (0-1)
  const budgetUsage = 1 - (candidate.remainingBudget / candidate.budgetTotal);

  // If user is price-focused (low budgetSensitivity), prefer lower budget usage
  // If user is comfort-focused (high budgetSensitivity), higher usage is OK

  // budgetSensitivity 0 = price-focused: reward lower usage
  // budgetSensitivity 1 = comfort-focused: neutral on usage

  if (budgetSensitivity < 0.5) {
    // Price-focused: lower usage = positive alignment
    return (0.5 - budgetUsage) * 2; // Range: -1 to 1
  } else {
    // Comfort-focused: slight preference for using budget
    return (budgetUsage - 0.5) * 0.5; // Weaker signal, range: -0.25 to 0.25
  }
}

/**
 * Calculate alignment score for comfort preference
 * Returns -1 to 1: negative = misaligned, positive = aligned
 */
export function alignsWithComfortPreference(
  candidate: TripOptionCandidate,
  comfortPreference: number
): number {
  const rating = candidate.hotel.rating;

  // If no rating, return neutral
  if (rating === null) {
    return 0;
  }

  // Normalize rating to 0-1 (assuming 1-5 scale)
  const normalizedRating = (rating - 1) / 4;

  // If user prefers comfort (high comfortPreference), align with high ratings
  // If user prefers budget (low comfortPreference), align with lower ratings

  if (comfortPreference > 0.5) {
    // Comfort-focused: high rating = positive alignment
    return (normalizedRating - 0.5) * 2; // Range: -1 to 1
  } else {
    // Budget-focused: lower rating = positive (but weaker signal)
    return (0.5 - normalizedRating) * 0.5; // Range: -0.25 to 0.25
  }
}

/**
 * Calculate alignment score for destination style
 * Returns -1 to 1: negative = misaligned, positive = aligned
 */
export function alignsWithDestinationStyle(
  candidate: TripOptionCandidate,
  destinationStyles: Record<DestinationStyle, number>
): number {
  const destName = candidate.destination.name;
  const categories = DESTINATION_CATEGORIES[destName];

  if (!categories || categories.length === 0) {
    // Unknown destination, return neutral
    return 0;
  }

  // Calculate average affinity for destination's categories
  let totalAffinity = 0;
  for (const cat of categories) {
    totalAffinity += destinationStyles[cat] || 0.5;
  }
  const avgAffinity = totalAffinity / categories.length;

  // Convert affinity (0.2-0.8 range) to alignment (-1 to 1)
  return (avgAffinity - 0.5) * 3.33; // Map 0.2-0.8 to roughly -1 to 1
}

/**
 * Calculate total adjustment for a candidate
 */
export function calculateAdjustment(
  candidate: TripOptionCandidate,
  preferences: InferredPreferences,
  maxAdjustment: number
): { adjustment: number; breakdown: PersonalizationAdjustment['adjustmentBreakdown'] } {
  // Calculate individual alignments
  const budgetAlignment = alignsWithBudgetSensitivity(
    candidate,
    preferences.budgetSensitivity
  );
  const comfortAlignment = alignsWithComfortPreference(
    candidate,
    preferences.comfortPreference
  );
  const styleAlignment = alignsWithDestinationStyle(
    candidate,
    preferences.destinationStyles
  );

  // Weighted combination (40% budget, 40% comfort, 20% style)
  let adjustment =
    budgetAlignment * maxAdjustment * 0.4 +
    comfortAlignment * maxAdjustment * 0.4 +
    styleAlignment * maxAdjustment * 0.2;

  // Cap total adjustment
  adjustment = clamp(adjustment, -maxAdjustment, maxAdjustment);

  return {
    adjustment,
    breakdown: {
      budgetAlignment: budgetAlignment * maxAdjustment * 0.4,
      comfortAlignment: comfortAlignment * maxAdjustment * 0.4,
      styleAlignment: styleAlignment * maxAdjustment * 0.2,
    },
  };
}

/**
 * Apply personalization to scored results
 *
 * This is the main entry point for the tie-breaking system.
 * Only modifies ordering, never the original scores.
 *
 * @param results - Scored results with candidate data attached
 * @param context - Personalization context (preferences, confidence)
 * @returns Results in personalized order (original scores unchanged)
 */
export function applyPersonalization(
  results: PersonalizedScoringResult[],
  context: PersonalizationContext
): { results: PersonalizedScoringResult[]; adjustments: PersonalizationAdjustment[] } {
  const adjustments: PersonalizationAdjustment[] = [];

  // Check if personalization should be applied
  if (
    !context.preferences ||
    context.confidenceScore < CONFIDENCE_THRESHOLDS.MINIMUM
  ) {
    // No personalization - just sort by original score
    const sorted = [...results].sort((a, b) => b.finalScore - a.finalScore);
    return { results: sorted, adjustments: [] };
  }

  const maxAdjustment = getMaxAdjustment(context.confidenceScore);

  // Group by score proximity
  const bands = groupByScoreProximity(results, SCORE_PROXIMITY_THRESHOLD);

  // Process each band
  for (const band of bands) {
    if (band.length <= 1) {
      // Single candidate in band - no tie to break
      continue;
    }

    // Apply adjustments within band
    for (const result of band) {
      if (!result.candidate) {
        // No candidate data - can't personalize
        result.personalizedScore = result.finalScore;
        continue;
      }

      const { adjustment, breakdown } = calculateAdjustment(
        result.candidate,
        context.preferences,
        maxAdjustment
      );

      result.personalizedScore = result.finalScore + adjustment;

      // Log adjustment (for debugging only)
      adjustments.push({
        candidateId: result.candidateId,
        destination: result.candidate.destination.name,
        originalScore: result.finalScore,
        adjustedScore: result.personalizedScore,
        adjustment,
        adjustmentBreakdown: breakdown,
      });
    }

    // Re-sort band by personalized score
    band.sort((a, b) => {
      const scoreA = a.personalizedScore ?? a.finalScore;
      const scoreB = b.personalizedScore ?? b.finalScore;
      return scoreB - scoreA;
    });
  }

  // Flatten bands back to single list
  const finalResults = bands.flat();

  return { results: finalResults, adjustments };
}

/**
 * Check if two scores are within tie-breaking range
 */
export function isWithinTieBreakingRange(
  score1: number,
  score2: number
): boolean {
  return Math.abs(score1 - score2) <= SCORE_PROXIMITY_THRESHOLD;
}
