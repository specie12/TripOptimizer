/**
 * Candidate Generation Service
 *
 * Generates trip option candidates from mock flight/hotel data.
 * In production, this would call real flight/hotel APIs.
 */

import { v4 as uuidv4 } from 'uuid';
import { TripOptionCandidate } from '../scoring';
import { BudgetAllocation, GenerateTripRequest } from '../types/api.types';
import {
  DESTINATIONS,
  getDestination,
  getAvailableDestinations,
  DestinationData,
  MockFlight,
  MockHotel,
} from '../config/destinations';

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
 * destination, then filters out over-budget options.
 *
 * @param request - The trip generation request
 * @param allocation - Budget allocation from BudgetConfig
 * @returns Array of candidate trips (unscored)
 */
export function generateCandidates(
  request: GenerateTripRequest,
  allocation: BudgetAllocation
): GeneratedCandidate[] {
  const candidates: GeneratedCandidate[] = [];

  // Determine which destinations to consider
  const destinationsToCheck = request.destination
    ? [request.destination]
    : getAvailableDestinations();

  // Calculate dates
  const startDate = request.startDate
    ? new Date(request.startDate)
    : getDefaultStartDate();
  const endDate = request.endDate
    ? new Date(request.endDate)
    : addDays(startDate, request.numberOfDays);

  for (const destName of destinationsToCheck) {
    const destData = getDestination(destName);
    if (!destData) continue;

    // Generate all flight + hotel combinations for this destination
    const destCandidates = generateDestinationCandidates(
      destData,
      request,
      allocation,
      startDate,
      endDate
    );

    candidates.push(...destCandidates);
  }

  return candidates;
}

/**
 * Generate candidates for a single destination
 */
function generateDestinationCandidates(
  destData: DestinationData,
  request: GenerateTripRequest,
  allocation: BudgetAllocation,
  startDate: Date,
  endDate: Date
): GeneratedCandidate[] {
  const candidates: GeneratedCandidate[] = [];
  const nights = request.numberOfDays;

  // Try each flight + hotel combination
  for (const flight of destData.flights) {
    for (const hotel of destData.hotels) {
      // Calculate costs
      const flightPrice = adjustFlightPrice(flight.basePrice, request.originCity);
      const hotelTotal = hotel.pricePerNight * nights;
      const totalCost = flightPrice + hotelTotal;

      // Skip if over total budget
      if (totalCost > request.budgetTotal) {
        continue;
      }

      const candidate: GeneratedCandidate = {
        id: uuidv4(),
        destination: destData.name,
        flight: {
          provider: flight.provider,
          price: flightPrice,
          departureTime: startDate,
          returnTime: endDate,
          deepLink: generateFlightDeepLink(flight.provider, destData.name),
        },
        hotel: {
          name: hotel.name,
          priceTotal: hotelTotal,
          pricePerNight: hotel.pricePerNight,
          nights: nights,
          rating: hotel.rating,
          deepLink: generateHotelDeepLink(hotel.name, destData.name),
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
 * Adjust flight price based on origin city
 *
 * In a real implementation, this would be based on actual route pricing.
 * For MVP, we apply simple distance-based adjustments.
 */
function adjustFlightPrice(basePrice: number, originCity: string): number {
  // Simple price adjustments based on origin (mock logic)
  const adjustments: Record<string, number> = {
    'New York': 1.0,
    'Los Angeles': 1.1,
    'Chicago': 1.05,
    'Miami': 1.08,
    'Seattle': 1.15,
    'Boston': 0.98,
    'San Francisco': 1.12,
  };

  const multiplier = adjustments[originCity] || 1.0;
  return Math.floor(basePrice * multiplier);
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

/**
 * Generate mock flight booking deep link
 */
function generateFlightDeepLink(provider: string, destination: string): string {
  const providerSlug = provider.toLowerCase().replace(/\s+/g, '-');
  const destSlug = destination.toLowerCase().replace(/\s+/g, '-');
  return `https://www.${providerSlug}.com/book?dest=${destSlug}`;
}

/**
 * Generate mock hotel booking deep link
 */
function generateHotelDeepLink(hotelName: string, destination: string): string {
  const hotelSlug = hotelName.toLowerCase().replace(/\s+/g, '-');
  const destSlug = destination.toLowerCase().replace(/\s+/g, '-');
  return `https://www.booking.com/hotel/${destSlug}/${hotelSlug}`;
}
