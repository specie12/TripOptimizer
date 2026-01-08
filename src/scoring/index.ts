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
