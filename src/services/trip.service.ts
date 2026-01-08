/**
 * Trip Service
 *
 * Handles database operations for TripRequests, TripOptions,
 * FlightOptions, and HotelOptions.
 */

import { PrismaClient, TravelStyle, TripRequest, TripOption, FlightOption, HotelOption } from '@prisma/client';
import { GenerateTripRequest, ItineraryDay } from '../types/api.types';
import { GeneratedCandidate } from './candidate.service';
import { ScoringResult } from '../scoring';

const prisma = new PrismaClient();

/**
 * TripOption with included relations
 */
export type TripOptionWithRelations = TripOption & {
  flightOption: FlightOption | null;
  hotelOption: HotelOption | null;
};

/**
 * Create a new TripRequest in the database
 *
 * @param request - The trip generation request
 * @returns Created TripRequest
 */
export async function createTripRequest(
  request: GenerateTripRequest
): Promise<TripRequest> {
  return prisma.tripRequest.create({
    data: {
      userId: request.userId || null,
      originCity: request.originCity,
      destination: request.destination || null,
      startDate: request.startDate ? new Date(request.startDate) : null,
      endDate: request.endDate ? new Date(request.endDate) : null,
      numberOfDays: request.numberOfDays,
      budgetTotal: request.budgetTotal,
      travelStyle: request.travelStyle as TravelStyle,
    },
  });
}

/**
 * Data needed to save a scored trip option
 */
export interface ScoredTripData {
  candidate: GeneratedCandidate;
  scoringResult: ScoringResult;
  explanation: string;
  itinerary: ItineraryDay[];
}

/**
 * Save scored trip options to the database
 *
 * Creates TripOption with related FlightOption and HotelOption
 * in a single transaction.
 *
 * @param tripRequestId - ID of the parent TripRequest
 * @param scoredTrips - Array of scored trips with content
 * @returns Created TripOptions with relations
 */
export async function saveTripOptions(
  tripRequestId: string,
  scoredTrips: ScoredTripData[]
): Promise<TripOptionWithRelations[]> {
  const savedOptions: TripOptionWithRelations[] = [];

  for (const trip of scoredTrips) {
    const { candidate, scoringResult, explanation, itinerary } = trip;

    // Create TripOption with FlightOption and HotelOption in transaction
    const tripOption = await prisma.tripOption.create({
      data: {
        tripRequestId,
        destination: candidate.destination,
        totalCost: candidate.totalCost,
        remainingBudget: candidate.remainingBudget,
        score: scoringResult.finalScore,
        explanation,
        itineraryJson: itinerary as any, // Prisma Json type
        flightOption: {
          create: {
            provider: candidate.flight.provider,
            price: candidate.flight.price,
            departureTime: candidate.flight.departureTime,
            returnTime: candidate.flight.returnTime,
            deepLink: candidate.flight.deepLink,
          },
        },
        hotelOption: {
          create: {
            name: candidate.hotel.name,
            priceTotal: candidate.hotel.priceTotal,
            rating: candidate.hotel.rating,
            deepLink: candidate.hotel.deepLink,
          },
        },
      },
      include: {
        flightOption: true,
        hotelOption: true,
      },
    });

    savedOptions.push(tripOption);
  }

  return savedOptions;
}

/**
 * Get a TripRequest with all its options
 *
 * @param tripRequestId - ID of the TripRequest
 * @returns TripRequest with TripOptions
 */
export async function getTripRequestWithOptions(tripRequestId: string) {
  return prisma.tripRequest.findUnique({
    where: { id: tripRequestId },
    include: {
      tripOptions: {
        include: {
          flightOption: true,
          hotelOption: true,
        },
        orderBy: {
          score: 'desc',
        },
      },
    },
  });
}
