/**
 * API Client for TripOptimizer Backend
 */

import {
  GenerateTripRequest,
  GenerateTripResponse,
  ApiErrorResponse,
  ChatMessageResponse,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Generate trip options based on user preferences
 */
export async function generateTrip(
  request: GenerateTripRequest
): Promise<GenerateTripResponse> {
  const response = await fetch(`${API_BASE}/trip/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorBody: ApiErrorResponse = await response.json();
    const err = new Error(errorBody.message || 'Failed to generate trip options');
    (err as any).data = errorBody.data;
    (err as any).errorCode = errorBody.error;
    throw err;
  }

  return response.json();
}

/**
 * City search result from Amadeus Location API
 */
export interface CitySearchResult {
  name: string;
  iataCode: string;
  country: string;
  subType: string;
}

/**
 * Search cities/airports by keyword for typeahead autocomplete
 */
export async function searchCities(query: string): Promise<CitySearchResult[]> {
  const response = await fetch(
    `${API_BASE}/trip/city-search?q=${encodeURIComponent(query)}`
  );

  if (!response.ok) {
    return [];
  }

  return response.json();
}

/**
 * Send a chat message to the AI trip planning chatbot
 */
export async function sendChatMessage(request: {
  message: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}): Promise<ChatMessageResponse> {
  const response = await fetch(`${API_BASE}/chat/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(errorBody.error || 'Failed to send chat message');
  }

  return response.json();
}

/**
 * Health check endpoint
 */
export async function checkHealth(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE}/trip/health`);
  return response.json();
}

/**
 * Book Types for booking flow
 */
export interface BookingRequest {
  tripOptionId: string;
  paymentInfo: {
    paymentMethodId: string;
    amount: number;
    currency: string;
    billingDetails: {
      name: string;
      email: string;
      address?: {
        line1?: string;
        city?: string;
        state?: string;
        postal_code?: string;
        country?: string;
      };
    };
  };
  userContact?: {
    email: string;
    phone?: string;
  };
}

export interface BookingConfirmation {
  confirmationCode: string;
  bookingReference: string;
}

export interface FlightBookingConfirmation extends BookingConfirmation {
  pnr: string;
  airline?: string;
  departureTime: string;
  returnTime?: string;
  totalPrice: number;
  currency: string;
}

export interface HotelBookingConfirmation extends BookingConfirmation {
  hotelName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalPrice: number;
  currency: string;
}

export interface ActivityBookingConfirmation extends BookingConfirmation {
  activityName: string;
  date: string;
  time?: string;
  totalPrice: number;
  currency: string;
}

export interface BookingResponse {
  success: boolean;
  state: 'PENDING' | 'VALIDATING' | 'PROCESSING' | 'CONFIRMED' | 'FAILED';
  confirmations?: {
    flight?: FlightBookingConfirmation;
    hotel?: HotelBookingConfirmation;
    activities: ActivityBookingConfirmation[];
  };
  payment?: {
    paymentIntentId: string;
    amount: number;
    currency: string;
  };
  error?: string;
  rollbackInfo?: {
    refundAmount: number;
    cancelledBookings: string[];
  };
}

/**
 * Book a complete trip (flight + hotel + activities)
 */
export async function bookTrip(
  request: BookingRequest
): Promise<BookingResponse> {
  const response = await fetch(`${API_BASE}/booking/book`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to book trip');
  }

  return data;
}

// =============================================================================
// PHASE 5: COMPONENT SWAP & EDIT FLOW
// =============================================================================

/**
 * Flight Swap Data
 */
export interface FlightSwapData {
  provider: string;
  price: number;
  departureTime: string;
  returnTime: string;
  deepLink: string;
}

/**
 * Hotel Swap Data
 */
export interface HotelSwapData {
  name: string;
  priceTotal: number;
  rating?: number | null;
  deepLink: string;
}

/**
 * Budget Impact (returned from swap operations)
 */
export interface BudgetImpact {
  previousCost: number;
  newCost: number;
  difference: number;
  remainingBudget: number;
}

/**
 * Swap Result
 */
export interface SwapResult {
  success: boolean;
  error?: string;
  updatedTripOption?: any;
  budgetImpact?: BudgetImpact;
}

/**
 * Budget Breakdown Response
 */
export interface BudgetBreakdownResponse {
  success: boolean;
  budget: {
    total: number;
    allocated: Record<string, number>;
    spent: {
      flight: number;
      hotel: number;
      activities: number;
      total: number;
    };
    remaining: number;
    percentageUsed: number;
  };
}

/**
 * Swap flight for a trip option
 */
export async function swapFlight(
  tripOptionId: string,
  flightData: FlightSwapData
): Promise<SwapResult> {
  const response = await fetch(`${API_BASE}/trip-edit/${tripOptionId}/swap/flight`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(flightData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to swap flight');
  }

  return data;
}

/**
 * Swap hotel for a trip option
 */
export async function swapHotel(
  tripOptionId: string,
  hotelData: HotelSwapData
): Promise<SwapResult> {
  const response = await fetch(`${API_BASE}/trip-edit/${tripOptionId}/swap/hotel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(hotelData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to swap hotel');
  }

  return data;
}

/**
 * Add, remove, or replace activity
 */
export async function swapActivity(
  tripOptionId: string,
  activityId: string,
  action: 'add' | 'remove' | 'replace',
  replaceWithId?: string
): Promise<SwapResult> {
  const response = await fetch(`${API_BASE}/trip-edit/${tripOptionId}/swap/activity`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      activityId,
      action,
      replaceWithId,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to swap activity');
  }

  return data;
}

/**
 * Get budget breakdown for a trip option
 */
export async function getBudgetBreakdown(
  tripOptionId: string
): Promise<BudgetBreakdownResponse> {
  const response = await fetch(`${API_BASE}/trip-edit/${tripOptionId}/budget`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to get budget breakdown');
  }

  return data;
}

/**
 * Edit trip parameters
 */
export async function editTrip(
  tripRequestId: string,
  changes: any,
  preserveLocks: boolean = false
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`${API_BASE}/trip-edit/${tripRequestId}/edit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      changes,
      preserveLocks,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to edit trip');
  }

  return data;
}
