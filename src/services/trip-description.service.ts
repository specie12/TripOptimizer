/**
 * Trip Description Service (Phase 7)
 *
 * Generates contextual trip type descriptions based on budget efficiency,
 * travel style, and preference matching.
 */

/**
 * Generate a trip type description based on budget metrics
 *
 * @param budgetTotal - Total budget in cents
 * @param totalCost - Actual trip cost in cents
 * @param travelStyle - User's selected travel style
 * @param score - Overall trip score (0-1)
 * @returns A descriptive string explaining the trip's value proposition
 */
export function generateTripDescription(
  budgetTotal: number,
  totalCost: number,
  travelStyle: string,
  score: number
): string {
  // Calculate budget efficiency (how much budget remains)
  const budgetEfficiency = (budgetTotal - totalCost) / budgetTotal;
  const savingsPercent = Math.round(budgetEfficiency * 100);

  // High efficiency: significant savings
  if (budgetEfficiency > 0.25) {
    return `Maximized value while staying ${savingsPercent}% under budget`;
  }

  // Good efficiency: moderate savings
  if (budgetEfficiency > 0.10) {
    if (travelStyle === 'LUXURY') {
      return 'Premium experiences with excellent value';
    }
    if (travelStyle === 'BUDGET') {
      return `Cost-effective choice with ${savingsPercent}% budget remaining`;
    }
    return 'Perfect balance of comfort and experiences';
  }

  // Tight budget: close to budget limit
  if (budgetEfficiency > 0) {
    if (travelStyle === 'LUXURY') {
      return 'Luxury experiences worth the investment';
    }
    if (travelStyle === 'MID_RANGE') {
      return 'Comfortable experiences at great value';
    }
    return 'Maximum experiences within your budget';
  }

  // Over budget (shouldn't happen often, but handle gracefully)
  if (score > 0.7) {
    return 'Premium option slightly above budget range';
  }

  return 'Optimized for your travel preferences';
}

/**
 * Generate score breakdown for transparency
 *
 * @param budgetTotal - Total budget in cents
 * @param totalCost - Actual trip cost in cents
 * @param score - Overall trip score (0-1)
 * @returns Score breakdown object
 */
export function generateScoreBreakdown(
  budgetTotal: number,
  totalCost: number,
  score: number
): {
  budgetEfficiency: number;
  valueForMoney: number;
  preferenceMatch: number;
} {
  // Budget efficiency: how well we stayed within budget
  const budgetEfficiency = Math.max(0, Math.min(1, 1 - (totalCost / budgetTotal)));

  // Value for money: derived from the overall score
  // Assumes score already factors in value proposition
  const valueForMoney = score;

  // Preference match: for now, use the score as a proxy
  // In future, this could factor in user interests, trip pace, etc.
  const preferenceMatch = score;

  return {
    budgetEfficiency: Math.round(budgetEfficiency * 100) / 100,
    valueForMoney: Math.round(valueForMoney * 100) / 100,
    preferenceMatch: Math.round(preferenceMatch * 100) / 100
  };
}

/**
 * Calculate match percentage from score
 *
 * Converts a 0-1 score to a 0-100 percentage for display.
 * Applies slight curve to make scores feel more meaningful:
 * - Scores below 0.5 are penalized
 * - Scores above 0.7 are boosted
 *
 * @param score - Trip score (0-1)
 * @returns Match percentage (0-100)
 */
export function calculateMatchPercentage(score: number): number {
  // Apply a slight S-curve to make scores more meaningful
  let adjustedScore = score;

  if (score < 0.5) {
    // Penalize low scores slightly
    adjustedScore = score * 0.9;
  } else if (score > 0.7) {
    // Boost high scores slightly
    adjustedScore = Math.min(1, score * 1.1);
  }

  // Convert to percentage and round
  return Math.round(adjustedScore * 100);
}
