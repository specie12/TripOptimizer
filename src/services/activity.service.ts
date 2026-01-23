/**
 * Activity Service (Phase 3)
 *
 * Generates and scores activities for trip options using integration layer.
 * Supports both mock and real API providers through abstraction.
 */

import { PrismaClient, ActivityCategory } from '@prisma/client';
import {
  ActivityCandidate,
  ActivityGenerationRequest,
  ActivityGenerationResponse,
  ActivityScore,
  ActivityScoringWeights,
  DEFAULT_ACTIVITY_SCORING,
  ActivityFilters,
} from '../types/activity.types';
import { activityIntegration } from '../integrations/activity.integration';
import { ActivityResult } from '../types/integration.types';

const prisma = new PrismaClient();

/**
 * Generate activities for a trip option using integration layer
 *
 * Algorithm:
 * 1. Search for available activities using integration
 * 2. Convert to ActivityCandidate format
 * 3. Score each activity
 * 4. Select top activities within budget
 * 5. Maximize value and diversity
 */
export async function generateActivities(
  request: ActivityGenerationRequest
): Promise<ActivityGenerationResponse> {
  // Search for activities using integration
  const activityResponse = await activityIntegration.search({
    destination: request.destination,
    maxPrice: request.activityBudget,
    categories: request.categories?.map((c) => c.toString()),
    maxResults: 20,
  });

  if (activityResponse.data.length === 0) {
    return {
      activities: [],
      totalCost: 0,
      remaining: request.activityBudget,
    };
  }

  // Convert integration results to ActivityCandidate format
  const availableActivities: ActivityCandidate[] = activityResponse.data.map(
    (result) => transformActivityResult(result)
  );

  // Score activities
  const scoredActivities = scoreActivities(
    availableActivities,
    request.activityBudget,
    DEFAULT_ACTIVITY_SCORING
  );

  // Select best activities within budget
  const selectedActivities = selectActivitiesWithinBudget(
    scoredActivities,
    request.activityBudget,
    request.numberOfDays,
    request.maxActivities
  );

  const totalCost = selectedActivities.reduce((sum, activity) => sum + activity.price, 0);

  return {
    activities: selectedActivities,
    totalCost,
    remaining: request.activityBudget - totalCost,
  };
}

/**
 * Transform integration ActivityResult to ActivityCandidate
 */
function transformActivityResult(result: ActivityResult): ActivityCandidate {
  return {
    name: result.name,
    category: result.category as ActivityCategory,
    description: result.description,
    duration: result.duration,
    price: result.price,
    rating: result.rating !== null ? result.rating : undefined,
    reviewCount: result.reviewCount,
    deepLink: result.deepLink,
    imageUrl: result.imageUrl !== null ? result.imageUrl : undefined,
  };
}

/**
 * Filter activities by criteria
 */
function filterActivities(
  activities: ActivityCandidate[],
  filters: ActivityFilters
): ActivityCandidate[] {
  return activities.filter((activity) => {
    // Filter by max price
    if (filters.maxPrice !== undefined && activity.price > filters.maxPrice) {
      return false;
    }

    // Filter by categories
    if (filters.categories && filters.categories.length > 0) {
      if (!filters.categories.includes(activity.category)) {
        return false;
      }
    }

    // Filter by min rating
    if (filters.minRating !== undefined && activity.rating) {
      if (activity.rating < filters.minRating) {
        return false;
      }
    }

    // Filter by duration
    if (filters.minDuration !== undefined && activity.duration < filters.minDuration) {
      return false;
    }
    if (filters.maxDuration !== undefined && activity.duration > filters.maxDuration) {
      return false;
    }

    return true;
  });
}

/**
 * Score activities using multiple factors
 */
function scoreActivities(
  activities: ActivityCandidate[],
  budget: number,
  weights: ActivityScoringWeights
): ActivityScore[] {
  // Find max/min values for normalization
  const prices = activities.map((a) => a.price);
  const ratings = activities.map((a) => a.rating || 0);
  const durations = activities.map((a) => a.duration);

  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const maxRating = 5; // Rating scale 0-5
  const maxDuration = Math.max(...durations);

  return activities.map((activity) => {
    // Price score: Lower price = higher score (inverted)
    const priceScore = 1 - (activity.price - minPrice) / (maxPrice - minPrice || 1);

    // Rating score: Normalized rating
    const ratingScore = (activity.rating || 3) / maxRating;

    // Category diversity score: Prefer variety (handled in selection)
    const categoryScore = 0.5; // Neutral, handled in selection algorithm

    // Duration score: Moderate duration preferred (not too short, not too long)
    // Ideal duration: 2-3 hours (120-180 minutes)
    const idealDuration = 150;
    const durationDiff = Math.abs(activity.duration - idealDuration);
    const durationScore = 1 - Math.min(durationDiff / maxDuration, 1);

    // Calculate weighted total score
    const totalScore =
      priceScore * weights.priceWeight +
      ratingScore * weights.ratingWeight +
      categoryScore * weights.categoryWeight +
      durationScore * weights.durationWeight;

    return {
      activity,
      score: totalScore,
      breakdown: {
        priceScore,
        ratingScore,
        categoryScore,
        durationScore,
      },
    };
  });
}

/**
 * Select best activities within budget using greedy algorithm with diversity
 */
function selectActivitiesWithinBudget(
  scoredActivities: ActivityScore[],
  budget: number,
  numberOfDays: number,
  maxActivities?: number
): ActivityCandidate[] {
  // Sort by score descending
  const sorted = [...scoredActivities].sort((a, b) => b.score - a.score);

  const selected: ActivityCandidate[] = [];
  let remainingBudget = budget;
  const selectedCategories = new Set<ActivityCategory>();

  // Calculate reasonable max activities (1-2 per day)
  const defaultMaxActivities = Math.min(numberOfDays * 2, 10);
  const limit = maxActivities || defaultMaxActivities;

  for (const { activity, score } of sorted) {
    // Stop if we've reached the limit
    if (selected.length >= limit) {
      break;
    }

    // Skip if it exceeds remaining budget
    if (activity.price > remainingBudget) {
      continue;
    }

    // Bonus for category diversity (prefer activities in new categories)
    let diversityBonus = 0;
    if (!selectedCategories.has(activity.category)) {
      diversityBonus = 0.1;
      selectedCategories.add(activity.category);
    }

    const adjustedScore = score + diversityBonus;

    // Select if score is high enough (threshold: 0.5)
    if (adjustedScore >= 0.4) {
      selected.push(activity);
      remainingBudget -= activity.price;
    }

    // Break early if budget is very low
    if (remainingBudget < 1000) {
      // Less than $10 remaining
      break;
    }
  }

  return selected;
}

/**
 * Create activity options in database for a trip option
 */
export async function createActivityOptions(
  tripOptionId: string,
  activities: ActivityCandidate[]
): Promise<void> {
  if (activities.length === 0) {
    return;
  }

  await prisma.activityOption.createMany({
    data: activities.map((activity) => ({
      tripOptionId,
      name: activity.name,
      category: activity.category,
      description: activity.description,
      duration: activity.duration,
      price: activity.price,
      rating: activity.rating,
      reviewCount: activity.reviewCount,
      deepLink: activity.deepLink,
      imageUrl: activity.imageUrl,
    })),
  });
}

/**
 * Get activities for a trip option
 */
export async function getActivitiesForTripOption(tripOptionId: string) {
  return prisma.activityOption.findMany({
    where: { tripOptionId },
    orderBy: [{ rating: 'desc' }, { price: 'asc' }],
  });
}

/**
 * Get total cost of activities for a trip option
 */
export async function getTotalActivityCost(tripOptionId: string): Promise<number> {
  const activities = await prisma.activityOption.findMany({
    where: { tripOptionId },
    select: { price: true },
  });

  return activities.reduce((sum, activity) => sum + activity.price, 0);
}
