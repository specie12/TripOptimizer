/**
 * Trip Scoring Engine
 *
 * A deterministic scoring system for ranking TripOption candidates.
 *
 * Key Principles:
 * 1. Fully deterministic - same inputs always produce same outputs
 * 2. No AI/LLM involvement - pure algorithmic scoring
 * 3. Explainable - returns component breakdown for transparency
 * 4. Configurable - weights and parameters in scoring.config.ts
 *
 * Usage:
 *   import { scoreTripOptions } from './scoring';
 *   const results = scoreTripOptions(candidates);
 *   // results.results is sorted by finalScore descending
 */

import {
  TripOptionCandidate,
  ScoringResult,
  ScoringContext,
  BatchScoringResult,
  ScoreComponents,
  OverBudgetError,
} from './scoring.types';

import {
  calculateFlightScore,
  calculateRawHotelValue,
  normalizeHotelScore,
  calculateBudgetEfficiency,
  getDestinationDensity,
  calculateFinalScore,
  isWithinBudget,
  buildScoringContext,
} from './scoring.utils';

import {
  PersonalizationContext,
  PersonalizedScoringResult,
  applyPersonalization,
  PersonalizationAdjustment,
  CONFIDENCE_THRESHOLDS,
} from '../personalization';

// Re-export types and config for convenience
export * from './scoring.types';
export * from './scoring.config';

/**
 * Scores a single trip option candidate
 *
 * This function requires a ScoringContext for hotel score normalization.
 * For single-option scoring, the hotel score will be 0.5 (middle value).
 * For proper normalization, use scoreTripOptions() for batch scoring.
 *
 * @param candidate - The trip option to score
 * @param context - Scoring context with min/max hotel values
 * @returns Complete scoring result with final score and components
 * @throws OverBudgetError if candidate exceeds budget
 */
export function scoreTripOption(
  candidate: TripOptionCandidate,
  context: ScoringContext
): ScoringResult {
  // Pre-validation: reject over-budget candidates
  if (!isWithinBudget(candidate)) {
    const totalCost = candidate.flight.price + candidate.hotel.priceTotal;
    throw new OverBudgetError(candidate.id, totalCost, candidate.budgetTotal);
  }

  // Calculate flight score
  const flightScore = calculateFlightScore(
    candidate.flight.price,
    candidate.maxAllowedFlightBudget
  );

  // Calculate hotel score (with normalization)
  const { value: rawHotelValue, hasMissingRating } = calculateRawHotelValue(
    candidate.hotel.rating,
    candidate.hotel.priceTotal,
    candidate.hotel.nights
  );
  const hotelScore = normalizeHotelScore(rawHotelValue, hasMissingRating, context);

  // Calculate budget efficiency
  const budgetEfficiency = calculateBudgetEfficiency(
    candidate.remainingBudget,
    candidate.budgetTotal
  );

  // Get destination density
  const destinationDensity = getDestinationDensity(candidate.destination.name);

  // Build components
  const components: ScoreComponents = {
    flightScore,
    hotelScore,
    budgetEfficiency,
    destinationDensity,
  };

  // Calculate final weighted score
  const finalScore = calculateFinalScore(components);

  return {
    candidateId: candidate.id,
    finalScore,
    components,
    scoredAt: new Date(),
  };
}

/**
 * Scores multiple trip option candidates as a batch
 *
 * This is the recommended way to score candidates because it:
 * 1. Properly normalizes hotel scores across all candidates
 * 2. Filters out over-budget candidates
 * 3. Returns results sorted by score (highest first)
 *
 * @param candidates - Array of trip options to score
 * @returns Batch scoring result with sorted results and rejected IDs
 */
export function scoreTripOptions(candidates: TripOptionCandidate[]): BatchScoringResult {
  if (candidates.length === 0) {
    return {
      results: [],
      rejectedOverBudget: [],
      context: { minHotelValue: 0, maxHotelValue: 0 },
    };
  }

  // Separate valid and over-budget candidates
  const validCandidates: TripOptionCandidate[] = [];
  const rejectedOverBudget: string[] = [];

  for (const candidate of candidates) {
    if (isWithinBudget(candidate)) {
      validCandidates.push(candidate);
    } else {
      rejectedOverBudget.push(candidate.id);
    }
  }

  // Build context from valid candidates only
  const context = buildScoringContext(validCandidates);

  // Score each valid candidate
  const results: ScoringResult[] = validCandidates.map((candidate) =>
    scoreTripOption(candidate, context)
  );

  // Sort by final score descending (highest first)
  results.sort((a, b) => b.finalScore - a.finalScore);

  return {
    results,
    rejectedOverBudget,
    context,
  };
}

/**
 * Validates a candidate's budget before scoring
 *
 * Use this to check if a candidate should be scored at all.
 *
 * @param candidate - The candidate to validate
 * @returns Object with isValid flag and error details if invalid
 */
export function validateBudget(candidate: TripOptionCandidate): {
  isValid: boolean;
  totalCost: number;
  budgetTotal: number;
  deficit?: number;
} {
  const totalCost = candidate.flight.price + candidate.hotel.priceTotal;
  const isValid = totalCost <= candidate.budgetTotal;

  return {
    isValid,
    totalCost,
    budgetTotal: candidate.budgetTotal,
    deficit: isValid ? undefined : totalCost - candidate.budgetTotal,
  };
}

/**
 * Gets the top N scored candidates from a batch
 *
 * @param candidates - Array of candidates to score
 * @param topN - Number of top candidates to return (default: 3)
 * @returns Top N scoring results
 */
export function getTopScoredOptions(
  candidates: TripOptionCandidate[],
  topN: number = 3
): ScoringResult[] {
  const { results } = scoreTripOptions(candidates);
  return results.slice(0, topN);
}

/**
 * Extended batch scoring result with personalization data
 */
export interface PersonalizedBatchScoringResult extends BatchScoringResult {
  /** Personalization adjustments applied (for logging only, never exposed in API) */
  personalizationApplied: boolean;
  /** Adjustment details for debugging (internal use only) */
  adjustments?: PersonalizationAdjustment[];
}

/**
 * Scores multiple trip option candidates with optional personalization
 *
 * CRITICAL: Personalization is ONLY applied when:
 * 1. User has confidenceScore >= 0.3
 * 2. Candidates are within ±0.03 score proximity
 * 3. Maximum adjustment is capped at ±5%
 *
 * The returned finalScore is ALWAYS the original deterministic score.
 * Personalization only affects the ORDER of results, never the displayed scores.
 *
 * @param candidates - Array of trip options to score
 * @param personalizationContext - Optional user preferences and confidence
 * @returns Batch scoring result with optional personalization applied to ordering
 */
export function scoreTripOptionsWithPersonalization(
  candidates: TripOptionCandidate[],
  personalizationContext?: PersonalizationContext | null
): PersonalizedBatchScoringResult {
  if (candidates.length === 0) {
    return {
      results: [],
      rejectedOverBudget: [],
      context: { minHotelValue: 0, maxHotelValue: 0 },
      personalizationApplied: false,
    };
  }

  // Separate valid and over-budget candidates
  const validCandidates: TripOptionCandidate[] = [];
  const rejectedOverBudget: string[] = [];

  for (const candidate of candidates) {
    if (isWithinBudget(candidate)) {
      validCandidates.push(candidate);
    } else {
      rejectedOverBudget.push(candidate.id);
    }
  }

  // Build context from valid candidates only
  const context = buildScoringContext(validCandidates);

  // Score each valid candidate
  const results: PersonalizedScoringResult[] = validCandidates.map((candidate) => {
    const result = scoreTripOption(candidate, context);
    // Attach candidate data for personalization calculations
    return {
      ...result,
      candidate,
    };
  });

  // Check if personalization should be applied
  const shouldPersonalize =
    personalizationContext &&
    personalizationContext.preferences &&
    personalizationContext.confidenceScore >= CONFIDENCE_THRESHOLDS.MINIMUM;

  if (shouldPersonalize) {
    // Apply personalization (only affects ordering within close score bands)
    const { results: personalizedResults, adjustments } = applyPersonalization(
      results,
      personalizationContext
    );

    // Strip candidate data from results (not needed in response)
    const cleanResults: ScoringResult[] = personalizedResults.map(
      ({ candidate, personalizedScore, ...rest }) => rest
    );

    return {
      results: cleanResults,
      rejectedOverBudget,
      context,
      personalizationApplied: true,
      adjustments,
    };
  }

  // No personalization - sort by original score
  results.sort((a, b) => b.finalScore - a.finalScore);

  // Strip candidate data from results
  const cleanResults: ScoringResult[] = results.map(
    ({ candidate, personalizedScore, ...rest }) => rest
  );

  return {
    results: cleanResults,
    rejectedOverBudget,
    context,
    personalizationApplied: false,
  };
}
