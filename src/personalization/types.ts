/**
 * Personalization Types
 *
 * Type definitions for the passive personalization system (STEP 5).
 * All preferences are inferred from user behavior, never explicitly asked.
 */

import { InteractionType } from '@prisma/client';

// =============================================================================
// INFERRED PREFERENCES
// =============================================================================

/**
 * Destination style categories for simple clustering
 */
export type DestinationStyle = 'beach' | 'city' | 'culture' | 'adventure';

/**
 * Inferred user preferences stored in User.inferredPreferences JSON field
 * All values normalized to 0-1 range
 */
export interface InferredPreferences {
  /** 0 = price-focused, 1 = comfort-focused */
  budgetSensitivity: number;

  /** 0 = budget hotels, 1 = premium hotels */
  comfortPreference: number;

  /** Affinity scores for each destination style (0-1) */
  destinationStyles: Record<DestinationStyle, number>;

  /** ISO timestamp of last preference update */
  lastUpdated: string;
}

/**
 * Default preferences for new users (neutral values)
 */
export const DEFAULT_PREFERENCES: InferredPreferences = {
  budgetSensitivity: 0.5,
  comfortPreference: 0.5,
  destinationStyles: {
    beach: 0.5,
    city: 0.5,
    culture: 0.5,
    adventure: 0.5,
  },
  lastUpdated: new Date().toISOString(),
};

// =============================================================================
// SIGNAL EXTRACTION
// =============================================================================

/**
 * Raw signals extracted from user behavior for inference
 */
export interface UserSignals {
  // Budget Sensitivity signals
  avgBudgetPerDay: number;
  budgetVariance: number;
  travelStyleDistribution: { BUDGET: number; BALANCED: number };

  // Comfort Preference signals
  avgHotelRatingViewed: number;
  avgHotelRatingBooked: number;
  priceVsRatingTradeoff: number;

  // Destination Style signals
  destinationCategories: Record<DestinationStyle, number>;
}

// =============================================================================
// CONFIDENCE SCORING
// =============================================================================

/**
 * Weights for different interaction types in confidence calculation
 * Higher weight = stronger signal of user intent
 */
export const INTERACTION_WEIGHTS: Record<InteractionType, number> = {
  VIEW_TRIP_OPTION: 0.005,     // Low signal - just viewing
  EXPAND_EXPLANATION: 0.01,    // Medium signal - engaged
  CLICK_BOOK_FLIGHT: 0.02,     // High signal - booking intent
  CLICK_BOOK_HOTEL: 0.02,      // High signal - booking intent
  CHANGE_HOTEL: 0.015,         // Medium-high - preference expression
};

/**
 * Confidence thresholds for personalization levels
 */
export const CONFIDENCE_THRESHOLDS = {
  /** No personalization below this threshold */
  MINIMUM: 0.3,
  /** Light personalization (±2% influence) */
  LIGHT: 0.5,
  /** Medium personalization (±3.5% influence) */
  MEDIUM: 0.7,
  /** Full personalization cap (±5% influence) */
  FULL: 1.0,
} as const;

/**
 * Maximum adjustment percentages based on confidence level
 */
export const MAX_ADJUSTMENTS = {
  LIGHT: 0.02,   // 2%
  MEDIUM: 0.035, // 3.5%
  FULL: 0.05,    // 5%
} as const;

// =============================================================================
// TIE-BREAKING
// =============================================================================

/**
 * Score proximity threshold for tie-breaking
 * Personalization only affects candidates within this range
 */
export const SCORE_PROXIMITY_THRESHOLD = 0.03;

/**
 * Minimum number of interactions before any inference
 */
export const MIN_INTERACTIONS_FOR_INFERENCE = 10;

/**
 * Weekly confidence decay rate (for inactive users)
 */
export const CONFIDENCE_DECAY_RATE = 0.01;

// =============================================================================
// DESTINATION CATEGORIES
// =============================================================================

/**
 * Static mapping of destinations to style categories
 * Used for destination style inference
 */
export const DESTINATION_CATEGORIES: Record<string, DestinationStyle[]> = {
  // Beach destinations
  Barcelona: ['beach', 'city'],
  Lisbon: ['beach', 'culture'],
  Miami: ['beach'],
  Bali: ['beach', 'adventure'],
  Cancun: ['beach'],
  'Phuket': ['beach'],

  // City destinations
  Paris: ['city', 'culture'],
  'New York': ['city'],
  London: ['city', 'culture'],
  Tokyo: ['city', 'culture'],
  Dubai: ['city'],
  Singapore: ['city'],

  // Culture destinations
  Rome: ['culture', 'city'],
  Prague: ['culture', 'city'],
  Kyoto: ['culture'],
  Istanbul: ['culture'],
  Athens: ['culture'],
  Cairo: ['culture', 'adventure'],

  // Adventure destinations
  Reykjavik: ['adventure'],
  Queenstown: ['adventure'],
  'Costa Rica': ['adventure', 'beach'],
  'Swiss Alps': ['adventure'],
  'Machu Picchu': ['adventure', 'culture'],
};

// =============================================================================
// PERSONALIZATION RESULT
// =============================================================================

/**
 * Result of applying personalization to a candidate
 * For internal logging only - never exposed in API
 */
export interface PersonalizationAdjustment {
  candidateId: string;
  destination: string;
  originalScore: number;
  adjustedScore: number;
  adjustment: number;
  adjustmentBreakdown: {
    budgetAlignment: number;
    comfortAlignment: number;
    styleAlignment: number;
  };
}

/**
 * Context passed to personalization functions
 */
export interface PersonalizationContext {
  userId: string | null;
  preferences: InferredPreferences | null;
  confidenceScore: number;
}
