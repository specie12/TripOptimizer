/**
 * Preference Inference Service
 *
 * Extracts signals from user behavior and infers preferences.
 * All inference is passive - we never ask users questions.
 *
 * Signals used:
 * - Budget Sensitivity: from TripRequest patterns and travel style choices
 * - Comfort Preference: from hotel ratings viewed/booked
 * - Destination Style: from destinations interacted with
 */

import { PrismaClient, TravelStyle } from '@prisma/client';
import {
  InferredPreferences,
  UserSignals,
  DestinationStyle,
  DESTINATION_CATEGORIES,
  DEFAULT_PREFERENCES,
  MIN_INTERACTIONS_FOR_INFERENCE,
} from './types';

const prisma = new PrismaClient();

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Normalize a value to 0-1 range
 */
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return clamp((value - min) / (max - min), 0, 1);
}

/**
 * Calculate variance of an array of numbers
 */
function variance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
}

/**
 * Extract raw signals from user's historical data
 */
export async function extractUserSignals(userId: string): Promise<UserSignals | null> {
  // Get user's trip requests
  const tripRequests = await prisma.tripRequest.findMany({
    where: { userId },
    include: {
      tripOptions: {
        include: {
          hotelOption: true,
          interactionEvents: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50, // Limit to recent history
  });

  if (tripRequests.length === 0) {
    return null;
  }

  // Budget Sensitivity signals
  const budgetsPerDay = tripRequests.map(
    (req) => (req.budgetTotal / 100) / req.numberOfDays
  );
  const avgBudgetPerDay = budgetsPerDay.reduce((a, b) => a + b, 0) / budgetsPerDay.length;
  const budgetVariance = Math.sqrt(variance(budgetsPerDay));

  // Travel style distribution
  const budgetCount = tripRequests.filter((r) => r.travelStyle === TravelStyle.BUDGET).length;
  const balancedCount = tripRequests.filter((r) => r.travelStyle === TravelStyle.BALANCED).length;
  const total = budgetCount + balancedCount;
  const travelStyleDistribution = {
    BUDGET: total > 0 ? budgetCount / total : 0.5,
    BALANCED: total > 0 ? balancedCount / total : 0.5,
  };

  // Comfort Preference signals (from hotel ratings)
  const viewedRatings: number[] = [];
  const bookedRatings: number[] = [];

  for (const req of tripRequests) {
    for (const option of req.tripOptions) {
      const rating = option.hotelOption?.rating;
      if (rating !== null && rating !== undefined) {
        // Check if user interacted with this option
        const hasBookingClick = option.interactionEvents.some(
          (e) => e.eventType === 'CLICK_BOOK_HOTEL'
        );
        const hasViewed = option.interactionEvents.some(
          (e) => e.eventType === 'VIEW_TRIP_OPTION'
        );

        if (hasViewed) {
          viewedRatings.push(rating);
        }
        if (hasBookingClick) {
          bookedRatings.push(rating);
        }
      }
    }
  }

  const avgHotelRatingViewed = viewedRatings.length > 0
    ? viewedRatings.reduce((a, b) => a + b, 0) / viewedRatings.length
    : 3.5; // Default middle value
  const avgHotelRatingBooked = bookedRatings.length > 0
    ? bookedRatings.reduce((a, b) => a + b, 0) / bookedRatings.length
    : avgHotelRatingViewed;

  // Price vs rating tradeoff (simplified)
  const priceVsRatingTradeoff = avgHotelRatingBooked > avgHotelRatingViewed ? 1 : 0;

  // Destination Style signals
  const destinationCategories: Record<DestinationStyle, number> = {
    beach: 0,
    city: 0,
    culture: 0,
    adventure: 0,
  };

  for (const req of tripRequests) {
    for (const option of req.tripOptions) {
      const hasInteraction = option.interactionEvents.length > 0;
      if (hasInteraction) {
        const categories = DESTINATION_CATEGORIES[option.destination] || ['city'];
        for (const cat of categories) {
          destinationCategories[cat]++;
        }
      }
    }
  }

  return {
    avgBudgetPerDay,
    budgetVariance,
    travelStyleDistribution,
    avgHotelRatingViewed,
    avgHotelRatingBooked,
    priceVsRatingTradeoff,
    destinationCategories,
  };
}

/**
 * Infer budget sensitivity from signals
 * 0 = price-focused (prefers cheaper), 1 = comfort-focused (willing to spend more)
 */
export function inferBudgetSensitivity(signals: UserSignals): number {
  // BUDGET travel style indicates price sensitivity
  const styleWeight = signals.travelStyleDistribution.BUDGET * 0.4;

  // Lower budget per day indicates price sensitivity
  // $100-500/day range normalized
  const budgetPerDayFactor = normalize(signals.avgBudgetPerDay, 100, 500);

  // Higher variance indicates less sensitivity (flexible)
  // Lower variance indicates strong preference
  const varianceFactor = 1 - normalize(signals.budgetVariance, 0, 200);

  // Combine factors
  // Higher score = more comfort-focused
  // Lower score = more price-focused
  const sensitivity = (1 - styleWeight) * 0.4 + budgetPerDayFactor * 0.3 + (1 - varianceFactor) * 0.3;

  return clamp(sensitivity, 0, 1);
}

/**
 * Infer comfort preference from signals
 * 0 = budget hotels, 1 = premium hotels
 */
export function inferComfortPreference(signals: UserSignals): number {
  // Normalize ratings to 0-1 (rating range: 2.5-4.5)
  const viewedRatingFactor = normalize(signals.avgHotelRatingViewed, 2.5, 4.5);
  const bookedRatingFactor = normalize(signals.avgHotelRatingBooked, 2.5, 4.5);

  // Booked ratings matter more than viewed (70/30 split)
  const comfortPreference = viewedRatingFactor * 0.3 + bookedRatingFactor * 0.7;

  return clamp(comfortPreference, 0, 1);
}

/**
 * Infer destination style preferences from signals
 * Returns affinity scores for each style (0-1)
 */
export function inferDestinationStyles(
  signals: UserSignals
): Record<DestinationStyle, number> {
  const { destinationCategories } = signals;

  // Find total interactions
  const total = Object.values(destinationCategories).reduce((a, b) => a + b, 0);

  if (total === 0) {
    // No data, return neutral preferences
    return {
      beach: 0.5,
      city: 0.5,
      culture: 0.5,
      adventure: 0.5,
    };
  }

  // Normalize counts to 0-1 range
  // Apply softmax-like transformation for better distribution
  const styles: Record<DestinationStyle, number> = {
    beach: 0.5,
    city: 0.5,
    culture: 0.5,
    adventure: 0.5,
  };

  for (const style of Object.keys(styles) as DestinationStyle[]) {
    const count = destinationCategories[style] || 0;
    // Map count to 0.2-0.8 range (never fully 0 or 1)
    styles[style] = 0.2 + (count / total) * 0.6;
  }

  return styles;
}

/**
 * Infer all preferences from user signals
 */
export function inferPreferences(signals: UserSignals): InferredPreferences {
  return {
    budgetSensitivity: inferBudgetSensitivity(signals),
    comfortPreference: inferComfortPreference(signals),
    destinationStyles: inferDestinationStyles(signals),
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Update user preferences based on their interaction history
 * Returns null if not enough data for inference
 */
export async function updateUserPreferences(
  userId: string
): Promise<InferredPreferences | null> {
  // Get user to check interaction count
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.totalInteractions < MIN_INTERACTIONS_FOR_INFERENCE) {
    return null;
  }

  // Extract signals
  const signals = await extractUserSignals(userId);

  if (!signals) {
    return null;
  }

  // Infer preferences
  const preferences = inferPreferences(signals);

  // Update user record
  await prisma.user.update({
    where: { id: userId },
    data: {
      inferredPreferences: preferences as object,
    },
  });

  return preferences;
}

/**
 * Get user preferences, returning defaults if none inferred yet
 */
export async function getUserPreferences(
  userId: string | null
): Promise<InferredPreferences | null> {
  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return null;
  }

  // Parse stored preferences or return null
  if (user.inferredPreferences) {
    return user.inferredPreferences as unknown as InferredPreferences;
  }

  return null;
}
