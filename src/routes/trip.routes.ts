/**
 * Trip Routes
 *
 * API endpoints for trip generation and retrieval.
 */

import { Router, Request, Response } from 'express';
import { TravelStyle, BudgetCategory } from '@prisma/client';

import { validateGenerateTripRequest } from '../middleware/validation';
import {
  GenerateTripRequest,
  GenerateTripResponse,
  TripOptionResponse,
  ApiErrorResponse,
} from '../types/api.types';
import { getBudgetConfig, allocateBudget, getExtendedBudgetConfig, allocateExtendedBudget } from '../services/budget.service';
import {
  generateCandidates,
  toScoringCandidate,
  GeneratedCandidate,
} from '../services/candidate.service';
import { generateTripContent } from '../services/claude.service';
import {
  createTripRequest,
  saveTripOptions,
  ScoredTripData,
} from '../services/trip.service';
import { scoreTripOptionsWithPersonalization, ScoringResult } from '../scoring';
import { getUserPreferences, PersonalizationContext } from '../personalization';
import { PrismaClient } from '@prisma/client';
import { generateActivities, createActivityOptions } from '../services/activity.service';
import { extractHighlights } from '../services/highlights.service';
import {
  generateTripDescription,
  generateScoreBreakdown,
  calculateMatchPercentage,
} from '../services/trip-description.service';

const prisma = new PrismaClient();

const router = Router();

/**
 * POST /trip/generate
 *
 * Main endpoint for generating trip options.
 *
 * Flow:
 * 1. Validate input
 * 2. Create TripRequest in DB
 * 3. Get BudgetConfig for travel style
 * 4. Allocate budget deterministically (Phase 1: 6 categories)
 * 5. Generate candidates (mock flights + hotels)
 * 6. Generate activities (Phase 3: based on activity budget)
 * 7. Score candidates using existing scorer (NO AI)
 * 8. Select top 3 options
 * 9. Generate explanations with Claude (text only)
 * 10. Save results to DB (including activities)
 * 11. Return response
 */
router.post(
  '/generate',
  validateGenerateTripRequest,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const requestBody = req.body as GenerateTripRequest;

      // Step 1: Create TripRequest in database
      const tripRequest = await createTripRequest(requestBody);
      console.log(`Created TripRequest: ${tripRequest.id}`);

      // Step 2: Get budget configuration (Phase 1: Extended 6-category)
      const extendedBudgetConfig = await getExtendedBudgetConfig(
        requestBody.travelStyle as TravelStyle
      );

      // Step 3: Allocate budget deterministically (Phase 1: 6 categories)
      const extendedAllocation = allocateExtendedBudget(
        requestBody.budgetTotal,
        extendedBudgetConfig
      );
      console.log('Extended budget allocation:', extendedAllocation.allocations);

      // Step 3a: Initialize budget allocations in database (Phase 5)
      const { initializeBudgetAllocations } = await import('../services/spend.service');
      const budgetAllocationsByCategory = {
        [BudgetCategory.FLIGHT]: extendedAllocation.allocations.flight,
        [BudgetCategory.HOTEL]: extendedAllocation.allocations.hotel,
        [BudgetCategory.ACTIVITY]: extendedAllocation.allocations.activity,
        [BudgetCategory.FOOD]: extendedAllocation.allocations.food,
        [BudgetCategory.TRANSPORT]: extendedAllocation.allocations.transport,
        [BudgetCategory.CONTINGENCY]: extendedAllocation.allocations.contingency,
      };
      await initializeBudgetAllocations(tripRequest.id, budgetAllocationsByCategory);
      console.log('Initialized budget allocations for spend tracking');

      // Legacy 3-category allocation for candidate generation (flight + hotel)
      const legacyAllocation = {
        maxFlightBudget: extendedAllocation.allocations.flight,
        maxHotelBudget: extendedAllocation.allocations.hotel,
        bufferAmount: extendedAllocation.allocations.contingency,
        activitiesBudget: extendedAllocation.allocations.activity,
      };

      // Step 4: Generate candidates (flights + hotels) using integrations
      const candidates = await generateCandidates(requestBody, legacyAllocation);
      console.log(`Generated ${candidates.length} candidates`);

      if (candidates.length === 0) {
        const response: ApiErrorResponse = {
          error: 'no_options',
          message: 'No trip options available within your budget. Try increasing your budget or adjusting your dates.',
        };
        res.status(400).json(response);
        return;
      }

      // Step 5: Convert to scoring format and score
      const scoringCandidates = candidates.map(toScoringCandidate);

      // Load user preferences for personalization (if user provided)
      let personalizationContext: PersonalizationContext | null = null;
      if (requestBody.userId) {
        const user = await prisma.user.findUnique({
          where: { id: requestBody.userId },
        });
        if (user) {
          const preferences = await getUserPreferences(requestBody.userId);
          personalizationContext = {
            userId: requestBody.userId,
            preferences,
            confidenceScore: user.confidenceScore,
          };
          console.log(`Loaded user preferences (confidence: ${user.confidenceScore.toFixed(2)})`);
        }
      }

      // Score with optional personalization
      const { results: scoredResults, rejectedOverBudget, personalizationApplied } =
        scoreTripOptionsWithPersonalization(scoringCandidates, personalizationContext);

      console.log(
        `Scored ${scoredResults.length} candidates, rejected ${rejectedOverBudget.length} over budget` +
        (personalizationApplied ? ' (personalization applied)' : '')
      );

      if (scoredResults.length === 0) {
        const response: ApiErrorResponse = {
          error: 'no_options',
          message: 'All trip options exceeded your budget.',
        };
        res.status(400).json(response);
        return;
      }

      // Step 6: Select top 3 options
      const topResults = scoredResults.slice(0, 3);

      // Map scoring results back to candidates
      const topCandidates: Array<{ candidate: GeneratedCandidate; result: ScoringResult }> = [];
      for (const result of topResults) {
        const candidate = candidates.find((c) => c.id === result.candidateId);
        if (candidate) {
          topCandidates.push({ candidate, result });
        }
      }

      // Step 7: Generate content with Claude (parallel)
      console.log('Generating trip content with Claude...');
      const contentPromises = topCandidates.map(({ candidate, result }, index) =>
        generateTripContent(candidate, result.finalScore, index + 1)
      );
      const contents = await Promise.all(contentPromises);

      // Step 8: Prepare data for saving
      const scoredTrips: ScoredTripData[] = topCandidates.map(
        ({ candidate, result }, index) => ({
          candidate,
          scoringResult: result,
          explanation: contents[index].explanation,
          itinerary: contents[index].itinerary,
        })
      );

      // Step 9: Save to database
      const savedOptions = await saveTripOptions(tripRequest.id, scoredTrips);
      console.log(`Saved ${savedOptions.length} trip options`);

      // Step 9a: Generate and save activities for each trip option (Phase 3) using integration
      for (const option of savedOptions) {
        const activityGeneration = await generateActivities({
          destination: option.destination,
          numberOfDays: requestBody.numberOfDays,
          activityBudget: extendedAllocation.allocations.activity,
          travelStyle: requestBody.travelStyle as 'BUDGET' | 'BALANCED',
        });

        await createActivityOptions(option.id, activityGeneration.activities);
        console.log(`Generated ${activityGeneration.activities.length} activities for ${option.destination}`);
      }

      // Step 9b: Reload trip options with activities
      const optionsWithActivities = await prisma.tripOption.findMany({
        where: { tripRequestId: tripRequest.id },
        include: {
          flightOption: true,
          hotelOption: true,
          activityOptions: true,
        },
        orderBy: { score: 'desc' },
      });

      // Step 10: Build response (Phase 7: with highlights and match percentages)
      const response: GenerateTripResponse = {
        tripRequestId: tripRequest.id,
        options: optionsWithActivities.map((option, index) => {
          const scoredTrip = scoredTrips[index];

          // Phase 7: Calculate new fields
          const matchPercentage = calculateMatchPercentage(option.score);
          const highlights = extractHighlights(scoredTrip.itinerary);
          const tripTypeDescription = generateTripDescription(
            requestBody.budgetTotal,
            option.totalCost,
            requestBody.travelStyle,
            option.score
          );
          const scoreBreakdown = generateScoreBreakdown(
            requestBody.budgetTotal,
            option.totalCost,
            option.score
          );

          return {
            id: option.id,
            destination: option.destination,
            totalCost: option.totalCost,
            remainingBudget: option.remainingBudget,
            score: option.score,
            matchPercentage,
            highlights,
            tripTypeDescription,
            scoreBreakdown,
            explanation: option.explanation,
            itinerary: scoredTrip.itinerary,
            flight: {
              provider: option.flightOption!.provider,
              price: option.flightOption!.price,
              departureTime: option.flightOption!.departureTime.toISOString(),
              returnTime: option.flightOption!.returnTime.toISOString(),
              deepLink: option.flightOption!.deepLink,
            },
            hotel: {
              name: option.hotelOption!.name,
              priceTotal: option.hotelOption!.priceTotal,
              rating: option.hotelOption!.rating,
              deepLink: option.hotelOption!.deepLink,
            },
            activities: option.activityOptions?.map((activity) => ({
              id: activity.id,
              name: activity.name,
              category: activity.category,
              description: activity.description,
              duration: activity.duration,
              price: activity.price,
              rating: activity.rating,
              deepLink: activity.deepLink,
              imageUrl: activity.imageUrl,
            })) || [],
          } as TripOptionResponse;
        }),
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error generating trip:', error);

      if (error instanceof Error && error.message.includes('BudgetConfig not found')) {
        const response: ApiErrorResponse = {
          error: 'config_missing',
          message: 'Budget configuration not found. Please run database seed.',
        };
        res.status(500).json(response);
        return;
      }

      const response: ApiErrorResponse = {
        error: 'internal_error',
        message: 'Failed to generate trip options. Please try again.',
      };
      res.status(500).json(response);
    }
  }
);

/**
 * GET /trip/health
 *
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
