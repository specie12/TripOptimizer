/**
 * Activity Types (Phase 3)
 *
 * Defines types for activities, tours, attractions, and experiences
 */

import { ActivityCategory, LockStatus } from '@prisma/client';

/**
 * Re-export Prisma's ActivityCategory enum for convenience
 */
export { ActivityCategory };

/**
 * Activity data structure (matches database model)
 */
export interface Activity {
  id: string;
  tripOptionId: string;
  name: string;
  category: ActivityCategory;
  description: string;
  duration: number; // minutes
  price: number; // cents
  rating?: number;
  reviewCount?: number;
  deepLink: string;
  imageUrl?: string;
  availableFrom?: Date;
  availableTo?: Date;
  lockStatus: LockStatus;
  lockedAt?: Date;
  createdAt: Date;
}

/**
 * Activity candidate (before being saved to database)
 */
export interface ActivityCandidate {
  name: string;
  category: ActivityCategory;
  description: string;
  duration: number;
  price: number;
  rating?: number;
  reviewCount?: number;
  deepLink: string;
  imageUrl?: string;
}

/**
 * Activity generation request
 */
export interface ActivityGenerationRequest {
  destination: string;
  numberOfDays: number;
  activityBudget: number; // cents allocated for activities
  travelStyle: 'BUDGET' | 'BALANCED';
  categories?: ActivityCategory[]; // Optional: filter by categories
  maxActivities?: number; // Optional: limit number of activities
}

/**
 * Activity generation response
 */
export interface ActivityGenerationResponse {
  activities: ActivityCandidate[];
  totalCost: number; // cents
  remaining: number; // cents remaining from activity budget
}

/**
 * Activity scoring weights
 */
export interface ActivityScoringWeights {
  priceWeight: number; // How much price affects score (0-1)
  ratingWeight: number; // How much rating affects score (0-1)
  categoryWeight: number; // How much category diversity affects score (0-1)
  durationWeight: number; // How much duration affects score (0-1)
}

/**
 * Default scoring weights for activities
 */
export const DEFAULT_ACTIVITY_SCORING: ActivityScoringWeights = {
  priceWeight: 0.4, // 40% weight on price/budget fit
  ratingWeight: 0.3, // 30% weight on rating
  categoryWeight: 0.2, // 20% weight on category diversity
  durationWeight: 0.1, // 10% weight on duration
};

/**
 * Activity filter criteria
 */
export interface ActivityFilters {
  categories?: ActivityCategory[];
  minRating?: number;
  maxPrice?: number; // cents
  minDuration?: number; // minutes
  maxDuration?: number; // minutes
}

/**
 * Activity scoring result
 */
export interface ActivityScore {
  activity: ActivityCandidate;
  score: number; // 0-1
  breakdown: {
    priceScore: number;
    ratingScore: number;
    categoryScore: number;
    durationScore: number;
  };
}
