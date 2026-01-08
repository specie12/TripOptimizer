/**
 * Trip Routes
 *
 * API endpoints for trip generation and retrieval.
 */

import { Router, Request, Response } from 'express';
import { TravelStyle } from '@prisma/client';

import { validateGenerateTripRequest } from '../middleware/validation';
import {
  GenerateTripRequest,
  GenerateTripResponse,
  TripOptionResponse,
  ApiErrorResponse,
} from '../types/api.types';
import { getBudgetConfig, allocateBudget } from '../services/budget.service';
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
import { scoreTripOptions, ScoringResult } from '../scoring';

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
 * 4. Allocate budget deterministically
 * 5. Generate candidates (mock flights + hotels)
 * 6. Score candidates using existing scorer (NO AI)
 * 7. Select top 3 options
 * 8. Generate explanations with Claude (text only)
 * 9. Save results to DB
 * 10. Return response
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

      // Step 2: Get budget configuration
      const budgetConfig = await getBudgetConfig(
        requestBody.travelStyle as TravelStyle
      );

      // Step 3: Allocate budget deterministically
      const allocation = allocateBudget(requestBody.budgetTotal, budgetConfig);
      console.log('Budget allocation:', allocation);

      // Step 4: Generate candidates
      const candidates = generateCandidates(requestBody, allocation);
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
      const { results: scoredResults, rejectedOverBudget } = scoreTripOptions(scoringCandidates);

      console.log(`Scored ${scoredResults.length} candidates, rejected ${rejectedOverBudget.length} over budget`);

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

      // Step 10: Build response
      const response: GenerateTripResponse = {
        tripRequestId: tripRequest.id,
        options: savedOptions.map((option, index) => {
          const scoredTrip = scoredTrips[index];
          return {
            id: option.id,
            destination: option.destination,
            totalCost: option.totalCost,
            remainingBudget: option.remainingBudget,
            score: option.score,
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
