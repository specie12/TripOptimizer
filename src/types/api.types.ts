/**
 * API Type Definitions
 *
 * Request and response types for the Trip Generation Pipeline.
 */

import { TravelStyle } from '@prisma/client';

// =============================================================================
// REQUEST TYPES
// =============================================================================

/**
 * Request body for POST /trip/generate
 */
export interface GenerateTripRequest {
  /** Origin city for the trip */
  originCity: string;

  /** Optional specific destination (if not provided, will suggest destinations) */
  destination?: string;

  /** Optional start date (ISO 8601 format) */
  startDate?: string;

  /** Optional end date (ISO 8601 format) */
  endDate?: string;

  /** Number of days for the trip (1-30) */
  numberOfDays: number;

  /** Total budget in cents (e.g., 200000 = $2,000) */
  budgetTotal: number;

  /** Travel style determines budget allocation */
  travelStyle: 'BUDGET' | 'BALANCED';

  /** Optional user ID for tracking (anonymous if not provided) */
  userId?: string;
}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/**
 * Response body for POST /trip/generate
 */
export interface GenerateTripResponse {
  /** ID of the created TripRequest */
  tripRequestId: string;

  /** Generated trip options (2-3), sorted by score descending */
  options: TripOptionResponse[];
}

/**
 * A single trip option in the response
 */
export interface TripOptionResponse {
  /** Unique ID for this option */
  id: string;

  /** Destination city */
  destination: string;

  /** Total cost in cents (flight + hotel) */
  totalCost: number;

  /** Remaining budget in cents for activities */
  remainingBudget: number;

  /** Score from 0-1 (higher is better) */
  score: number;

  /** AI-generated explanation of why this option is good */
  explanation: string;

  /** Day-by-day itinerary */
  itinerary: ItineraryDay[];

  /** Flight details */
  flight: FlightResponse;

  /** Hotel details */
  hotel: HotelResponse;

  /** Activities included in this trip (Phase 3) */
  activities?: ActivityResponse[];
}

/**
 * A single day in the itinerary
 */
export interface ItineraryDay {
  /** Day number (1-indexed) */
  day: number;

  /** Title for the day */
  title: string;

  /** Activities for the day */
  activities: string[];
}

/**
 * Flight details in the response
 */
export interface FlightResponse {
  /** Airline or provider name */
  provider: string;

  /** Price in cents */
  price: number;

  /** Departure time (ISO 8601) */
  departureTime: string;

  /** Return time (ISO 8601) */
  returnTime: string;

  /** Direct booking URL */
  deepLink: string;
}

/**
 * Hotel details in the response
 */
export interface HotelResponse {
  /** Hotel name */
  name: string;

  /** Total price in cents for entire stay */
  priceTotal: number;

  /** Rating (1-5 stars, nullable) */
  rating: number | null;

  /** Direct booking URL */
  deepLink: string;
}

/**
 * Activity details in the response (Phase 3)
 */
export interface ActivityResponse {
  /** Unique activity ID */
  id: string;

  /** Activity name */
  name: string;

  /** Activity category */
  category: string;

  /** Detailed description */
  description: string;

  /** Duration in minutes */
  duration: number;

  /** Price in cents */
  price: number;

  /** Rating (0-5 stars, nullable) */
  rating?: number | null;

  /** Direct booking URL */
  deepLink: string;

  /** Optional image URL */
  imageUrl?: string | null;
}

// =============================================================================
// INTERNAL TYPES
// =============================================================================

/**
 * Budget allocation result
 */
export interface BudgetAllocation {
  /** Maximum allowed for flights in cents */
  maxFlightBudget: number;

  /** Maximum allowed for hotels in cents */
  maxHotelBudget: number;

  /** Buffer amount in cents */
  bufferAmount: number;

  /** Remaining for activities in cents */
  activitiesBudget: number;
}

/**
 * Validation error detail
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * API error response
 */
export interface ApiErrorResponse {
  error: string;
  message?: string;
  details?: ValidationError[];
}
