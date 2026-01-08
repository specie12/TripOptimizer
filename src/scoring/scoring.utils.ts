/**
 * Scoring Utility Functions
 *
 * Pure, deterministic functions for calculating individual score components.
 * All functions are side-effect free and fully testable.
 */

import { SCORING_CONFIG } from './scoring.config';
import { TripOptionCandidate, ScoreComponents, ScoringContext } from './scoring.types';

/**
 * Clamps a value between min and max (inclusive)
 *
 * @param value - The value to clamp
 * @param min - Minimum allowed value (default: 0)
 * @param max - Maximum allowed value (default: 1)
 * @returns The clamped value
 */
export function clamp(value: number, min: number = 0, max: number = 1): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculates the flight value score
 *
 * Formula: flightScore = 1 - (flightPrice / maxAllowedFlightBudget)
 *
 * Interpretation:
 * - Score of 1.0 = flight is free (best)
 * - Score of 0.0 = flight uses entire allowed budget (worst)
 * - Score < 0 = flight exceeds budget (clamped to 0)
 *
 * @param flightPrice - Flight price in cents
 * @param maxAllowedFlightBudget - Maximum allowed flight budget in cents
 * @returns Flight score between 0 and 1
 */
export function calculateFlightScore(
  flightPrice: number,
  maxAllowedFlightBudget: number
): number {
  if (maxAllowedFlightBudget <= 0) {
    return 0;
  }

  const score = 1 - (flightPrice / maxAllowedFlightBudget);
  return clamp(score);
}

/**
 * Calculates the raw hotel value (before normalization)
 *
 * Formula: hotelValue = hotelRating / pricePerNight
 *
 * This produces a "rating per dollar" metric that must be
 * normalized across all candidates being compared.
 *
 * @param rating - Hotel rating (or null if missing)
 * @param priceTotal - Total hotel price in cents
 * @param nights - Number of nights
 * @returns Raw hotel value (NOT normalized, NOT clamped)
 */
export function calculateRawHotelValue(
  rating: number | null,
  priceTotal: number,
  nights: number
): { value: number; hasMissingRating: boolean } {
  if (nights <= 0 || priceTotal <= 0) {
    return { value: 0, hasMissingRating: rating === null };
  }

  const pricePerNight = priceTotal / nights;

  // If rating is missing, use a default of 3.0 (middle rating)
  // The penalty will be applied during normalization
  const effectiveRating = rating ?? 3.0;

  // Convert price to dollars for more intuitive calculation
  // (rating is typically 1-5, price per night in hundreds of dollars)
  const pricePerNightDollars = pricePerNight / 100;

  const value = effectiveRating / pricePerNightDollars;

  return { value, hasMissingRating: rating === null };
}

/**
 * Normalizes hotel values across a batch of candidates
 *
 * Formula: normalizedScore = (value - minValue) / (maxValue - minValue)
 *
 * If rating was missing, applies the configured penalty factor.
 *
 * @param rawValue - Raw hotel value from calculateRawHotelValue
 * @param hasMissingRating - Whether the rating was missing
 * @param context - Scoring context with min/max values
 * @returns Normalized hotel score between 0 and 1
 */
export function normalizeHotelScore(
  rawValue: number,
  hasMissingRating: boolean,
  context: ScoringContext
): number {
  const { minHotelValue, maxHotelValue } = context;

  // If all values are the same, return middle score
  if (maxHotelValue === minHotelValue) {
    const baseScore = 0.5;
    return hasMissingRating
      ? baseScore * SCORING_CONFIG.defaults.missingRatingPenalty
      : baseScore;
  }

  // Normalize to 0-1 range
  let normalizedScore = (rawValue - minHotelValue) / (maxHotelValue - minHotelValue);

  // Apply penalty for missing ratings
  if (hasMissingRating) {
    normalizedScore *= SCORING_CONFIG.defaults.missingRatingPenalty;
  }

  return clamp(normalizedScore);
}

/**
 * Calculates the budget efficiency score
 *
 * Formula: budgetEfficiency = remainingBudget / budgetTotal
 *
 * Interpretation:
 * - Score of 1.0 = 100% of budget remaining (didn't spend anything)
 * - Score of 0.0 = 0% remaining (spent entire budget)
 * - Score < 0 = over budget (should be rejected before scoring)
 *
 * @param remainingBudget - Remaining budget in cents
 * @param budgetTotal - Total budget in cents
 * @returns Budget efficiency score between 0 and 1
 */
export function calculateBudgetEfficiency(
  remainingBudget: number,
  budgetTotal: number
): number {
  if (budgetTotal <= 0) {
    return 0;
  }

  const efficiency = remainingBudget / budgetTotal;
  return clamp(efficiency);
}

/**
 * Gets the destination density score from the lookup table
 *
 * @param destination - Destination name
 * @returns Destination density score between 0 and 1
 */
export function getDestinationDensity(destination: string): number {
  // Case-insensitive lookup
  const normalizedDestination = destination.trim();

  // Try exact match first
  if (normalizedDestination in SCORING_CONFIG.destinationDensity) {
    return SCORING_CONFIG.destinationDensity[normalizedDestination];
  }

  // Try case-insensitive match
  const lowerDestination = normalizedDestination.toLowerCase();
  for (const [key, value] of Object.entries(SCORING_CONFIG.destinationDensity)) {
    if (key.toLowerCase() === lowerDestination) {
      return value;
    }
  }

  // Return default for unknown destinations
  return SCORING_CONFIG.defaults.destinationDensity;
}

/**
 * Calculates the final weighted score from components
 *
 * @param components - Individual score components
 * @returns Final score between 0 and 1
 */
export function calculateFinalScore(components: ScoreComponents): number {
  const { weights } = SCORING_CONFIG;

  const finalScore =
    components.flightScore * weights.flight +
    components.hotelScore * weights.hotel +
    components.budgetEfficiency * weights.budgetEfficiency +
    components.destinationDensity * weights.destinationDensity;

  return clamp(finalScore);
}

/**
 * Validates that a candidate is within budget
 *
 * @param candidate - The candidate to validate
 * @returns true if within budget, false if over budget
 */
export function isWithinBudget(candidate: TripOptionCandidate): boolean {
  const totalCost = candidate.flight.price + candidate.hotel.priceTotal;
  return totalCost <= candidate.budgetTotal;
}

/**
 * Builds the scoring context from a batch of candidates
 *
 * This calculates the min/max hotel values needed for normalization.
 *
 * @param candidates - Array of candidates to analyze
 * @returns Scoring context with min/max values
 */
export function buildScoringContext(candidates: TripOptionCandidate[]): ScoringContext {
  if (candidates.length === 0) {
    return { minHotelValue: 0, maxHotelValue: 0 };
  }

  const hotelValues = candidates.map((c) =>
    calculateRawHotelValue(c.hotel.rating, c.hotel.priceTotal, c.hotel.nights).value
  );

  return {
    minHotelValue: Math.min(...hotelValues),
    maxHotelValue: Math.max(...hotelValues),
  };
}
