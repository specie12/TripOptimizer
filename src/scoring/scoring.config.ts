/**
 * Scoring Configuration
 *
 * Contains all configurable parameters for the Trip Scoring Engine.
 * These values are deterministic and NOT influenced by AI/LLM.
 *
 * To modify scoring behavior:
 * 1. Adjust weights (must sum to 1.0)
 * 2. Add/modify destination density scores
 * 3. Adjust penalty factors
 */

export interface ScoringConfig {
  /** Weights for each scoring component (must sum to 1.0) */
  weights: {
    flight: number;
    hotel: number;
    budgetEfficiency: number;
    destinationDensity: number;
  };

  /** Default values for edge cases */
  defaults: {
    /** Default density score for unknown destinations */
    destinationDensity: number;
    /** Penalty multiplier when hotel rating is missing (0-1) */
    missingRatingPenalty: number;
  };

  /** Static lookup table for destination density scores (0-1) */
  destinationDensity: Record<string, number>;
}

/**
 * Main scoring configuration
 *
 * Weights breakdown:
 * - Flight (35%): Rewards finding cheaper flights relative to budget
 * - Hotel (35%): Rewards better value (rating per dollar)
 * - Budget Efficiency (20%): Rewards staying under budget
 * - Destination Density (10%): Slight bonus for tourist-friendly destinations
 */
export const SCORING_CONFIG: ScoringConfig = {
  weights: {
    flight: 0.35,
    hotel: 0.35,
    budgetEfficiency: 0.20,
    destinationDensity: 0.10,
  },

  defaults: {
    // Unknown destinations get a neutral score
    destinationDensity: 0.5,
    // Hotels without ratings are penalized by 15%
    missingRatingPenalty: 0.85,
  },

  /**
   * Destination Density Scores
   *
   * Score range: 0.0 to 1.0
   * Higher scores indicate:
   * - Better tourist infrastructure
   * - More reliable services
   * - Higher density of attractions
   *
   * Destinations not in this list default to 0.5
   */
  destinationDensity: {
    // Tier 1: Major global destinations (0.90+)
    'Paris': 0.95,
    'New York': 0.93,
    'London': 0.92,
    'Tokyo': 0.90,

    // Tier 2: Popular destinations (0.85-0.89)
    'Singapore': 0.89,
    'Rome': 0.88,
    'Barcelona': 0.87,
    'Sydney': 0.86,
    'Amsterdam': 0.85,

    // Tier 3: Well-established destinations (0.80-0.84)
    'Los Angeles': 0.84,
    'Berlin': 0.83,
    'Dubai': 0.82,
    'Miami': 0.82,
    'Vienna': 0.81,
    'Bangkok': 0.80,

    // Tier 4: Growing destinations (0.70-0.79)
    'Lisbon': 0.79,
    'Prague': 0.78,
    'Cancun': 0.76,
    'Istanbul': 0.75,
    'Bali': 0.72,
  },
};

/**
 * Validates that scoring weights sum to 1.0
 * Called at module load time to catch configuration errors early
 */
export function validateConfig(config: ScoringConfig): void {
  const { flight, hotel, budgetEfficiency, destinationDensity } = config.weights;
  const sum = flight + hotel + budgetEfficiency + destinationDensity;

  if (Math.abs(sum - 1.0) > 0.001) {
    throw new Error(
      `Scoring weights must sum to 1.0, got ${sum.toFixed(3)}. ` +
      `Current weights: flight=${flight}, hotel=${hotel}, ` +
      `budgetEfficiency=${budgetEfficiency}, destinationDensity=${destinationDensity}`
    );
  }
}

// Validate configuration at module load
validateConfig(SCORING_CONFIG);
