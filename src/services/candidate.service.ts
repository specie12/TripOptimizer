/**
 * Candidate Generation Service
 *
 * Generates trip option candidates using integration layer.
 * Supports both mock and real API providers through abstraction.
 */

import { v4 as uuidv4 } from 'uuid';
import { TripOptionCandidate } from '../scoring';
import { BudgetAllocation, GenerateTripRequest } from '../types/api.types';
import { flightIntegration } from '../integrations/flight.integration';
import { hotelIntegration } from '../integrations/hotel.integration';
import { FlightResult, HotelResult } from '../types/integration.types';

/**
 * Internal type for a generated candidate with full details
 */
export interface GeneratedCandidate {
  id: string;
  destination: string;
  flight: {
    provider: string;
    price: number;
    departureTime: Date;
    returnTime: Date;
    deepLink: string;
  };
  hotel: {
    name: string;
    priceTotal: number;
    pricePerNight: number;
    nights: number;
    rating: number | null;
    deepLink: string;
  };
  totalCost: number;
  remainingBudget: number;
  budgetTotal: number;
  maxAllowedFlightBudget: number;
}

/**
 * Generate trip candidates based on request and budget allocation
 *
 * This creates all possible flight + hotel combinations for each
 * destination using the integration layer, then filters out over-budget options.
 *
 * @param request - The trip generation request
 * @param allocation - Budget allocation from BudgetConfig
 * @returns Array of candidate trips (unscored)
 */
export async function generateCandidates(
  request: GenerateTripRequest,
  allocation: BudgetAllocation
): Promise<GeneratedCandidate[]> {
  const candidates: GeneratedCandidate[] = [];

  // Destination is required — no mock destination suggestions
  if (!request.destination) {
    console.warn('[CandidateService] No destination provided — returning empty candidates');
    return candidates;
  }
  const destinationsToCheck = [request.destination];

  // Calculate dates
  const startDate = request.startDate
    ? new Date(request.startDate)
    : getDefaultStartDate();
  const endDate = request.endDate
    ? new Date(request.endDate)
    : addDays(startDate, request.numberOfDays);

  // Generate candidates for each destination in parallel
  const candidatePromises = destinationsToCheck.map((destName) =>
    generateDestinationCandidates(
      destName,
      request,
      allocation,
      startDate,
      endDate
    )
  );

  const results = await Promise.all(candidatePromises);

  // Flatten results
  for (const destCandidates of results) {
    candidates.push(...destCandidates);
  }

  return candidates;
}

/**
 * Generate candidates for a single destination using integrations
 * Includes provider fallback chain and specific error reporting
 */
async function generateDestinationCandidates(
  destination: string,
  request: GenerateTripRequest,
  allocation: BudgetAllocation,
  startDate: Date,
  endDate: Date
): Promise<GeneratedCandidate[]> {
  const candidates: GeneratedCandidate[] = [];
  const nights = request.numberOfDays;

  // Search for flights using integration (has built-in Amadeus → Mock fallback)
  console.log(`[CandidateService] Searching flights for ${request.originCity} → ${destination}`);
  const flightResponse = await flightIntegration.search({
    origin: request.originCity,
    destination,
    departureDate: startDate.toISOString(),
    returnDate: endDate.toISOString(),
    maxResults: 10,
  });

  // Search for hotels using integration (has built-in RapidAPI → Mock fallback)
  console.log(`[CandidateService] Searching hotels for ${destination}`);
  const hotelResponse = await hotelIntegration.search({
    destination,
    checkInDate: startDate.toISOString(),
    checkOutDate: endDate.toISOString(),
    numberOfNights: nights,
    maxResults: 10,
  });

  // Check if we got any results and log specific failures
  if (flightResponse.data.length === 0) {
    console.error(`[CandidateService] ✗ No flights found for ${request.originCity} → ${destination}`);
    console.error(`[CandidateService]   Reason: ${flightResponse.error || 'Unknown'}`);
    console.error(`[CandidateService]   Provider: ${flightResponse.provider}`);
    return candidates;
  }

  if (hotelResponse.data.length === 0) {
    console.error(`[CandidateService] ✗ No hotels found for ${destination}`);
    console.error(`[CandidateService]   Reason: ${hotelResponse.error || 'Unknown'}`);
    console.error(`[CandidateService]   Provider: ${hotelResponse.provider}`);
    return candidates;
  }

  console.log(`[CandidateService] ✓ Found ${flightResponse.data.length} flights and ${hotelResponse.data.length} hotels for ${destination}`);

  // Generate all flight + hotel combinations
  for (const flight of flightResponse.data) {
    for (const hotel of hotelResponse.data) {
      const totalCost = flight.price + hotel.priceTotal;

      // Skip if over total budget
      if (totalCost > request.budgetTotal) {
        continue;
      }

      const candidate: GeneratedCandidate = {
        id: uuidv4(),
        destination,
        flight: {
          provider: flight.provider,
          price: flight.price,
          departureTime: new Date(flight.departureTime),
          returnTime: new Date(flight.returnTime),
          deepLink: flight.deepLink,
        },
        hotel: {
          name: hotel.name,
          priceTotal: hotel.priceTotal,
          pricePerNight: hotel.pricePerNight,
          nights,
          rating: hotel.rating,
          deepLink: hotel.deepLink,
        },
        totalCost,
        remainingBudget: request.budgetTotal - totalCost,
        budgetTotal: request.budgetTotal,
        maxAllowedFlightBudget: allocation.maxFlightBudget,
      };

      candidates.push(candidate);
    }
  }

  return candidates;
}

/**
 * Convert GeneratedCandidate to TripOptionCandidate for scoring
 */
export function toScoringCandidate(candidate: GeneratedCandidate): TripOptionCandidate {
  return {
    id: candidate.id,
    budgetTotal: candidate.budgetTotal,
    remainingBudget: candidate.remainingBudget,
    maxAllowedFlightBudget: candidate.maxAllowedFlightBudget,
    flight: {
      price: candidate.flight.price,
    },
    hotel: {
      priceTotal: candidate.hotel.priceTotal,
      nights: candidate.hotel.nights,
      rating: candidate.hotel.rating,
    },
    destination: {
      name: candidate.destination,
    },
  };
}

/**
 * Get default start date (2 weeks from now)
 */
function getDefaultStartDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date;
}

/**
 * Add days to a date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
