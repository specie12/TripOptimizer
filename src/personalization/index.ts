/**
 * Personalization Module
 *
 * Passive personalization system for TripOptimizer (STEP 5)
 *
 * This module provides:
 * - Preference inference from user behavior
 * - Confidence score management
 * - Tie-breaking adjustments for close-scoring candidates
 *
 * CRITICAL: Personalization is ONLY applied when:
 * 1. User has confidenceScore >= 0.3
 * 2. Candidates are within ±0.03 score proximity
 * 3. Maximum adjustment is capped at ±5%
 */

// Types
export {
  InferredPreferences,
  UserSignals,
  DestinationStyle,
  PersonalizationAdjustment,
  PersonalizationContext,
  INTERACTION_WEIGHTS,
  CONFIDENCE_THRESHOLDS,
  MAX_ADJUSTMENTS,
  SCORE_PROXIMITY_THRESHOLD,
  MIN_INTERACTIONS_FOR_INFERENCE,
  CONFIDENCE_DECAY_RATE,
  DEFAULT_PREFERENCES,
  DESTINATION_CATEGORIES,
} from './types';

// Confidence Service
export {
  calculateConfidenceIncrement,
  applyConfidenceDecay,
  getMaxAdjustment,
  shouldApplyPersonalization,
  getConfidenceLevel,
  estimateInteractionsToTarget,
} from './confidence.service';

// Inference Service
export {
  extractUserSignals,
  inferBudgetSensitivity,
  inferComfortPreference,
  inferDestinationStyles,
  inferPreferences,
  updateUserPreferences,
  getUserPreferences,
} from './inference.service';

// Tie-Breaker Service
export {
  PersonalizedScoringResult,
  groupByScoreProximity,
  alignsWithBudgetSensitivity,
  alignsWithComfortPreference,
  alignsWithDestinationStyle,
  calculateAdjustment,
  applyPersonalization,
  isWithinTieBreakingRange,
} from './tiebreaker.service';
