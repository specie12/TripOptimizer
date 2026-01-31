/**
 * API Types for TripOptimizer Frontend
 *
 * These types match the backend API response format.
 * All prices are in cents.
 */

// =============================================================================
// REQUEST TYPES
// =============================================================================

export interface GenerateTripRequest {
  originCity: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  numberOfDays: number;
  budgetTotal: number; // In cents
  travelStyle: 'BUDGET' | 'MID_RANGE' | 'BALANCED' | 'LUXURY'; // Phase 7: Extended
  tripPace?: 'RELAXED' | 'BALANCED' | 'PACKED'; // Phase 7
  accommodationType?: 'HOTELS' | 'AIRBNB' | 'RESORTS' | 'HOSTELS'; // Phase 7
  interests?: string[]; // Phase 7: InterestCategory values
  userId?: string;
}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

export interface GenerateTripResponse {
  tripRequestId: string;
  options: TripOptionResponse[];
}

export interface TripOptionResponse {
  id: string;
  destination: string;
  totalCost: number; // In cents
  remainingBudget: number; // In cents
  score: number; // 0-1 (NOT displayed to users)
  matchPercentage: number; // Phase 7: 0-100 (derived from score)
  highlights: string[]; // Phase 7: Top 3-5 attractions
  tripTypeDescription: string; // Phase 7: Budget efficiency description
  scoreBreakdown?: { // Phase 7: Optional transparency
    budgetEfficiency: number;
    valueForMoney: number;
    preferenceMatch: number;
  };
  explanation: string;
  itinerary: ItineraryDay[];
  flight: FlightResponse;
  hotel: HotelResponse;
  activities?: ActivityResponse[]; // Phase 3: Activities
}

export interface ItineraryDay {
  day: number;
  dayNumber?: number; // Alias for compatibility
  title: string;
  activities: string[];
}

export interface FlightResponse {
  provider: string;
  airline?: string; // Alias for provider
  price: number; // In cents
  departureTime: string; // ISO 8601
  returnTime: string; // ISO 8601
  deepLink: string;
  bookingUrl?: string; // Alias for deepLink
  duration?: string;
  stops?: number;
}

export interface HotelResponse {
  name: string;
  priceTotal: number; // In cents - total price
  totalPrice?: number; // Alias for priceTotal
  pricePerNight?: number; // In cents
  rating: number | null;
  deepLink: string;
  bookingUrl?: string; // Alias for deepLink
}

export interface ActivityResponse {
  id: string;
  name: string;
  category: string;
  description: string;
  duration: number; // In minutes
  price: number; // In cents
  rating?: number | null;
  deepLink: string;
  imageUrl?: string | null;
}

// =============================================================================
// ERROR TYPES
// =============================================================================

export interface ApiErrorResponse {
  error: string;
  message?: string;
  details?: ValidationError[];
  data?: Record<string, any>;
}

export interface ValidationError {
  field: string;
  message: string;
}

// =============================================================================
// FORM/UI TYPES
// =============================================================================

export interface TripFormData {
  originCity: string;
  destination?: string; // Optional - if not provided, system suggests destinations
  startDate?: string; // Optional - ISO date string
  numberOfDays: number;
  budgetTotal: number; // In dollars (converted to cents when sending to API)
  travelStyle: 'BUDGET' | 'MID_RANGE' | 'BALANCED' | 'LUXURY'; // Phase 7: Extended
  tripPace?: 'RELAXED' | 'BALANCED' | 'PACKED'; // Phase 7
  accommodationType?: 'HOTELS' | 'AIRBNB' | 'RESORTS' | 'HOSTELS'; // Phase 7
  interests?: string[]; // Phase 7: InterestCategory values
}
