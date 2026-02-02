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
import { flightIntegration } from '../integrations/flight.integration';
import { searchCities } from '../integrations/amadeus.integration';
import { hotelIntegration } from '../integrations/hotel.integration';
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
import { getTransportCostRange, getCityTransportInfo } from '../services/transport.service';

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

      // Step 3b: Validate budget is sufficient (Phase 3: Budget Validation)
      // Only validate if destination is specified (can't estimate for "suggest destinations")
      if (requestBody.destination) {
        try {
          const { isBudgetSufficient } = await import('../services/budget-estimator.service');
          const budgetCheck = await isBudgetSufficient(
            requestBody.originCity,
            requestBody.destination,
            requestBody.numberOfDays,
            requestBody.budgetTotal,
            requestBody.numberOfTravelers || 1
          );

          if (!budgetCheck.sufficient) {
            console.warn(`[TripGeneration] Budget too low: $${requestBody.budgetTotal / 100} vs minimum $${budgetCheck.estimate.minimumBudget / 100}`);
            const response: ApiErrorResponse = {
              error: 'insufficient_budget',
              message: `Your budget ($${requestBody.budgetTotal / 100}) is too low for this route.`,
              data: {
                minimumBudget: budgetCheck.estimate.minimumBudget,
                breakdown: {
                  flights: `$${budgetCheck.estimate.breakdown.flights / 100}`,
                  hotels: `$${budgetCheck.estimate.breakdown.hotels / 100}`,
                  activities: `$${budgetCheck.estimate.breakdown.activities / 100}`,
                  food: `$${budgetCheck.estimate.breakdown.food / 100}`,
                  total: `$${budgetCheck.estimate.breakdown.total / 100}`,
                },
                suggestion: `We recommend at least $${Math.ceil(budgetCheck.estimate.minimumBudget / 100)} for ${requestBody.originCity} → ${requestBody.destination} (${requestBody.numberOfDays} days).`,
              },
            };
            res.status(400).json(response);
            return;
          }
          console.log(`[TripGeneration] ✓ Budget check passed (${budgetCheck.percentageOfMinimum.toFixed(0)}% of minimum)`);
        } catch (error) {
          console.warn('[TripGeneration] Budget estimation failed, continuing anyway:', error);
          // Continue without validation - better to try than block user
        }
      }

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
        // Phase 3: Analyze failure and provide specific error message
        console.error('[TripGeneration] ✗ No candidates generated, analyzing failure...');

        let errorReason = 'unknown';
        let errorMessage = 'No trip options available.';
        let suggestion = 'Please try adjusting your search parameters.';
        let diagnosticData: Record<string, any> = {};

        if (requestBody.destination) {
          // Re-search without budget caps to find cheapest available prices
          let cheapestFlight: number | null = null;
          let cheapestHotelPerNight: number | null = null;
          let flightsFound = false;
          let hotelsFound = false;

          try {
            const testFlight = await flightIntegration.search({
              origin: requestBody.originCity,
              destination: requestBody.destination,
              departureDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              returnDate: new Date(Date.now() + (30 + requestBody.numberOfDays) * 24 * 60 * 60 * 1000).toISOString(),
              maxResults: 5,
            });

            if (testFlight.data.length > 0) {
              flightsFound = true;
              cheapestFlight = Math.min(...testFlight.data.map((f) => f.price));
            }
          } catch (flightError: any) {
            console.error('[TripGeneration] Flight check error:', flightError.message);
            errorReason = 'flight_error';
            errorMessage = `Unable to search flights: ${flightError.message}`;
            suggestion = 'There may be an issue with the origin or destination city name. Try using a nearby major city or airport code.';
          }

          if (errorReason !== 'flight_error') {
            try {
              const testHotel = await hotelIntegration.search({
                destination: requestBody.destination,
                checkInDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                checkOutDate: new Date(Date.now() + (30 + requestBody.numberOfDays) * 24 * 60 * 60 * 1000).toISOString(),
                numberOfNights: requestBody.numberOfDays,
                guests: requestBody.numberOfTravelers || 1,
                maxResults: 5,
              });

              if (testHotel.data.length > 0) {
                hotelsFound = true;
                cheapestHotelPerNight = Math.min(...testHotel.data.map((h) => h.pricePerNight));
              }
            } catch (hotelError: any) {
              console.error('[TripGeneration] Hotel check error:', hotelError.message);
              errorReason = 'hotel_error';
              errorMessage = `Unable to search hotels in ${requestBody.destination}.`;
              suggestion = 'The destination may not be recognized. Try using a well-known city name.';
            }
          }

          // Build specific error based on what was found
          if (errorReason === 'unknown') {
            if (!flightsFound) {
              errorReason = 'no_flights';
              errorMessage = `No flights available for ${requestBody.originCity} → ${requestBody.destination}.`;
              suggestion = 'Please check airport codes or try a nearby major city. You can also enter the airport code directly (e.g., "YUL" for Montreal).';
            } else if (!hotelsFound) {
              errorReason = 'no_hotels';
              errorMessage = `No hotels available in ${requestBody.destination}.`;
              suggestion = 'This destination may not be supported yet. Try a nearby major city or popular tourist destination.';
            } else if (cheapestFlight !== null && cheapestHotelPerNight !== null) {
              // Both found but all combos exceeded budget
              const cheapestHotelTotal = cheapestHotelPerNight * requestBody.numberOfDays;
              const cheapestCombination = cheapestFlight + cheapestHotelTotal;
              const budgetDollars = Math.floor(requestBody.budgetTotal / 100);
              const comboDollars = Math.ceil(cheapestCombination / 100);
              const flightDollars = Math.ceil(cheapestFlight / 100);
              const hotelNightDollars = Math.ceil(cheapestHotelPerNight / 100);

              errorReason = 'budget_too_low';
              errorMessage = `We found flights from $${flightDollars} and hotels from $${hotelNightDollars}/night, but the cheapest combination ($${comboDollars}) exceeds your $${budgetDollars} budget.`;
              suggestion = `Try increasing your budget to at least $${comboDollars} or reducing the trip duration.`;
              diagnosticData = {
                cheapestFlight: cheapestFlight,
                cheapestHotelPerNight: cheapestHotelPerNight,
                cheapestCombination: cheapestCombination,
                budgetShortfall: cheapestCombination - requestBody.budgetTotal,
              };
            }
          }
        } else {
          errorReason = 'no_destinations';
          errorMessage = 'No suitable destinations found within your budget.';
          suggestion = 'Try increasing your budget or specifying a destination directly.';
        }

        // Fallback if still unknown
        if (errorReason === 'unknown') {
          errorReason = 'budget_too_low';
          errorMessage = 'No trip options available within your budget.';
          suggestion = `Try increasing your budget to at least $${Math.ceil(requestBody.budgetTotal * 1.3 / 100)} or reducing the trip duration.`;
        }

        const response: ApiErrorResponse = {
          error: 'no_options',
          message: errorMessage,
          data: {
            reason: errorReason,
            suggestion,
            ...diagnosticData,
          },
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

          // Compute transport cost range for this destination
          const transportRange = getTransportCostRange(option.destination, requestBody.numberOfDays);

          return {
            id: option.id,
            destination: option.destination,
            totalCost: option.totalCost,
            remainingBudget: option.remainingBudget,
            foodBudget: extendedAllocation.allocations.food,
            transportBudget: extendedAllocation.allocations.transport,
            score: option.score,
            matchPercentage,
            highlights,
            tripTypeDescription,
            scoreBreakdown,
            explanation: option.explanation,
            itinerary: scoredTrip.itinerary,
            transportEstimate: {
              costRangeLow: transportRange.costRangeLow,
              costRangeHigh: transportRange.costRangeHigh,
              isEstimate: transportRange.isEstimate,
            },
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
 * GET /trip/city-search?q=<keyword>
 *
 * Typeahead endpoint for city/airport autocomplete.
 * Calls Amadeus Location API and returns up to 8 results.
 */
router.get('/city-search', async (req: Request, res: Response): Promise<void> => {
  const keyword = (req.query.q as string || '').trim();

  if (keyword.length < 2) {
    res.json([]);
    return;
  }

  try {
    const results = await searchCities(keyword);
    res.json(results);
  } catch (error) {
    console.error('[city-search] Error:', error);
    res.json([]);
  }
});

/**
 * GET /trip/transport/:destination
 *
 * Returns full transport data for a destination city.
 * Query params: ?days=N (default 5)
 */
router.get('/transport/:destination', (req: Request, res: Response) => {
  const destination = decodeURIComponent(req.params.destination);
  const days = Math.max(1, Math.min(30, parseInt(req.query.days as string, 10) || 5));

  const info = getCityTransportInfo(destination, days);

  res.json({
    cityName: info.cityName,
    days,
    costRangeLow: info.range.costRangeLow,
    costRangeHigh: info.range.costRangeHigh,
    isEstimate: info.range.isEstimate,
    transitPassName: info.range.cityData.transitPassName,
    links: info.range.cityData.links,
    tips: info.range.cityData.tips,
    dailyCostRange: info.range.cityData.dailyCostRange,
    airportTransferRange: info.range.cityData.airportTransferRange,
  });
});

/**
 * GET /trip/health
 *
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
