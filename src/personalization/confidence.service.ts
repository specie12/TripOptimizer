/**
 * Confidence Score Service
 *
 * Manages the confidence score that determines when personalization is applied.
 * Confidence increases slowly with user interactions and decays over time.
 *
 * Key principles:
 * - Slow increment (~20 meaningful interactions to reach 0.3 threshold)
 * - Different interaction types have different weights
 * - Diminishing returns as confidence increases
 * - Weekly decay for inactive users
 */

import { InteractionType, User } from '@prisma/client';
import {
  INTERACTION_WEIGHTS,
  CONFIDENCE_THRESHOLDS,
  MAX_ADJUSTMENTS,
  CONFIDENCE_DECAY_RATE,
} from './types';

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculate new confidence score after an interaction
 *
 * Formula: newScore = currentScore + weight * (1 - currentScore * 0.5)
 * This provides diminishing returns as confidence increases.
 *
 * @param currentScore - Current confidence score (0-1)
 * @param interactionType - Type of interaction that occurred
 * @returns New confidence score (0-1)
 */
export function calculateConfidenceIncrement(
  currentScore: number,
  interactionType: InteractionType
): number {
  const weight = INTERACTION_WEIGHTS[interactionType] || 0.005;

  // Diminishing returns formula
  // At score 0: full increment
  // At score 0.5: 75% increment
  // At score 1.0: 50% increment
  const diminishingFactor = 1 - currentScore * 0.5;
  const increment = weight * diminishingFactor;

  return clamp(currentScore + increment, 0, 1);
}

/**
 * Apply confidence decay for inactive users
 *
 * Called periodically (e.g., weekly) to reduce confidence for users
 * who haven't interacted recently.
 *
 * @param currentScore - Current confidence score
 * @param weeksSinceLastInteraction - Number of weeks since last interaction
 * @returns Decayed confidence score
 */
export function applyConfidenceDecay(
  currentScore: number,
  weeksSinceLastInteraction: number
): number {
  if (weeksSinceLastInteraction <= 0) {
    return currentScore;
  }

  const decay = CONFIDENCE_DECAY_RATE * weeksSinceLastInteraction;
  return clamp(currentScore - decay, 0, 1);
}

/**
 * Get the maximum personalization adjustment based on confidence level
 *
 * @param confidenceScore - User's confidence score (0-1)
 * @returns Maximum adjustment (0-0.05)
 */
export function getMaxAdjustment(confidenceScore: number): number {
  if (confidenceScore < CONFIDENCE_THRESHOLDS.MINIMUM) {
    return 0;
  }

  if (confidenceScore < CONFIDENCE_THRESHOLDS.LIGHT) {
    return MAX_ADJUSTMENTS.LIGHT;
  }

  if (confidenceScore < CONFIDENCE_THRESHOLDS.MEDIUM) {
    return MAX_ADJUSTMENTS.MEDIUM;
  }

  return MAX_ADJUSTMENTS.FULL;
}

/**
 * Check if personalization should be applied
 *
 * @param user - User object (may be null for anonymous)
 * @returns True if personalization should be applied
 */
export function shouldApplyPersonalization(user: User | null): boolean {
  if (!user) {
    return false;
  }

  return user.confidenceScore >= CONFIDENCE_THRESHOLDS.MINIMUM;
}

/**
 * Get confidence level description (for logging only)
 *
 * @param confidenceScore - User's confidence score
 * @returns Human-readable confidence level
 */
export function getConfidenceLevel(confidenceScore: number): string {
  if (confidenceScore < CONFIDENCE_THRESHOLDS.MINIMUM) {
    return 'none';
  }

  if (confidenceScore < CONFIDENCE_THRESHOLDS.LIGHT) {
    return 'light';
  }

  if (confidenceScore < CONFIDENCE_THRESHOLDS.MEDIUM) {
    return 'medium';
  }

  return 'full';
}

/**
 * Estimate interactions needed to reach a target confidence
 *
 * Useful for debugging and testing.
 *
 * @param currentScore - Current confidence score
 * @param targetScore - Target confidence score
 * @param avgInteractionWeight - Average weight of interactions (default: 0.015)
 * @returns Estimated number of interactions
 */
export function estimateInteractionsToTarget(
  currentScore: number,
  targetScore: number,
  avgInteractionWeight: number = 0.015
): number {
  if (currentScore >= targetScore) {
    return 0;
  }

  let score = currentScore;
  let interactions = 0;

  while (score < targetScore && interactions < 1000) {
    const diminishingFactor = 1 - score * 0.5;
    score += avgInteractionWeight * diminishingFactor;
    interactions++;
  }

  return interactions;
}
