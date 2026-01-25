/**
 * API Client for TripOptimizer Backend
 */

import {
  GenerateTripRequest,
  GenerateTripResponse,
  ApiErrorResponse,
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
    const error: ApiErrorResponse = await response.json();
    throw new Error(error.message || 'Failed to generate trip options');
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
