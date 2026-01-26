/**
 * Booking Types
 *
 * Type definitions for the booking orchestration system.
 * Implements strict state machine for booking flow.
 */

// ============================================
// BOOKING STATE MACHINE
// ============================================

/**
 * Booking state progression:
 * PENDING → VALIDATING → PROCESSING → CONFIRMED
 *                              ↓
 *                          FAILED/PARTIAL_CONFIRMED
 */
export enum BookingState {
  PENDING = 'PENDING',                     // Initial state, user has not clicked "Book"
  VALIDATING = 'VALIDATING',               // Checking availability and verification
  PROCESSING = 'PROCESSING',               // Executing bookings (payment + API calls)
  CONFIRMED = 'CONFIRMED',                 // All bookings successful
  FAILED = 'FAILED',                       // Booking failed, all rolled back
  PARTIAL_CONFIRMED = 'PARTIAL_CONFIRMED', // Some bookings succeeded, some failed
}

/**
 * Types of bookable components
 */
export enum BookingType {
  FLIGHT = 'FLIGHT',
  HOTEL = 'HOTEL',
  ACTIVITY = 'ACTIVITY',
}

/**
 * Booking status for individual components
 */
export enum ComponentBookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

// ============================================
// PAYMENT TYPES
// ============================================

export interface PaymentInfo {
  // Stripe payment method ID
  paymentMethodId: string;

  // Billing details
  billingDetails: {
    name: string;
    email: string;
    phone?: string;
    address?: {
      line1: string;
      line2?: string;
      city: string;
      state?: string;
      postalCode: string;
      country: string;
    };
  };

  // Amount in cents
  amount: number;

  // Currency code (e.g., "USD")
  currency: string;
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  chargeId?: string;
  error?: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  amount: number; // Amount refunded in cents
  error?: string;
}

// ============================================
// BOOKING REQUEST/RESPONSE TYPES
// ============================================

export interface BookTripRequest {
  tripOptionId: string;
  paymentInfo: PaymentInfo;

  // Optional: User contact for confirmations
  userContact?: {
    email: string;
    phone?: string;
  };
}

export interface BookTripResponse {
  success: boolean;
  state: BookingState;

  // Booking confirmations
  confirmations?: {
    flight?: FlightBookingConfirmation;
    hotel?: HotelBookingConfirmation;
    activities?: ActivityBookingConfirmation[];
  };

  // Payment details
  payment?: {
    paymentIntentId: string;
    amount: number;
    currency: string;
  };

  // Error details
  error?: string;
  failedComponents?: string[]; // Which components failed

  // Warning messages (non-critical issues)
  warnings?: string[];

  // Rollback info (if partial failure)
  rollbackInfo?: {
    refundAmount?: number;
    cancelledBookings?: string[];
  };
}

// ============================================
// COMPONENT BOOKING CONFIRMATIONS
// ============================================

export interface FlightBookingConfirmation {
  confirmationCode: string;
  bookingReference: string;
  pnr: string; // Passenger Name Record
  provider: string; // e.g., "Delta"
  ticketNumbers?: string[];
  departureTime: string; // ISO datetime
  returnTime: string; // ISO datetime
  passengerNames: string[];
  totalPrice: number; // cents
  currency: string;
  deepLink?: string; // Link to manage booking
}

export interface HotelBookingConfirmation {
  confirmationCode: string;
  bookingReference: string;
  hotelName: string;
  checkIn: string; // ISO date
  checkOut: string; // ISO date
  nights: number;
  roomType?: string;
  guestNames: string[];
  totalPrice: number; // cents
  currency: string;
  contactPhone?: string;
  deepLink?: string; // Link to manage booking
}

export interface ActivityBookingConfirmation {
  confirmationCode: string;
  bookingReference: string;
  activityName: string;
  date: string; // ISO date
  time?: string; // HH:MM
  duration?: number; // minutes
  participants: number;
  totalPrice: number; // cents
  currency: string;
  meetingPoint?: string;
  contactInfo?: string;
  deepLink?: string; // Link to manage booking
}

// ============================================
// VALIDATION TYPES
// ============================================

export interface ValidationRequest {
  tripOptionId: string;
}

export interface ValidationResult {
  success: boolean;
  validationDetails: {
    flight: ComponentValidation;
    hotel: ComponentValidation;
    activities: ComponentValidation[];
  };
  error?: string;
}

export interface ComponentValidation {
  componentType: BookingType;
  componentId: string;
  available: boolean;
  verified: boolean; // Entity existence verified
  error?: string;
  warnings?: string[];
}

// ============================================
// CANCELLATION/MODIFICATION TYPES
// ============================================

export interface CancelBookingRequest {
  bookingId: string;
  reason?: string;
}

export interface CancelBookingResponse {
  success: boolean;
  refundAmount?: number; // Amount refunded in cents
  cancellationFee?: number; // Fee charged in cents
  error?: string;
}

export interface ModifyBookingRequest {
  bookingId: string;
  changes: {
    componentType: BookingType;
    newComponentId?: string;
    newDates?: {
      start: string; // ISO date
      end: string; // ISO date
    };
  };
}

export interface ModifyBookingResponse {
  success: boolean;
  priceDifference?: number; // Price change in cents (positive = charge, negative = refund)
  newConfirmation?: FlightBookingConfirmation | HotelBookingConfirmation | ActivityBookingConfirmation;
  error?: string;
}

// ============================================
// INTERNAL BOOKING ORCHESTRATOR TYPES
// ============================================

export interface BookingOrchestratorState {
  tripOptionId: string;
  state: BookingState;
  startedAt: Date;

  // Payment tracking
  paymentIntentId?: string;
  totalAmount: number;

  // Component booking statuses
  componentStatuses: {
    flight: ComponentBookingStatus;
    hotel: ComponentBookingStatus;
    activities: ComponentBookingStatus[];
  };

  // Confirmations
  confirmations: {
    flight?: FlightBookingConfirmation;
    hotel?: HotelBookingConfirmation;
    activities: ActivityBookingConfirmation[];
  };

  // Error tracking
  errors: string[];
  warnings: string[];

  // Rollback tracking
  rollbackLog: Array<{
    timestamp: Date;
    action: string;
    success: boolean;
    details?: any;
  }>;
}

// ============================================
// EXTERNAL API INTEGRATION TYPES
// ============================================

/**
 * Amadeus Flight Booking Request
 */
export interface AmadeusFlightBookingRequest {
  flightOfferId: string;
  travelers: Array<{
    firstName: string;
    lastName: string;
    dateOfBirth: string; // YYYY-MM-DD
    email: string;
    phone: string;
  }>;
  paymentInfo: {
    cardNumber: string;
    expiryDate: string; // MM/YY
    cvv: string;
    cardholderName: string;
  };
}

/**
 * Booking.com Hotel Booking Request
 */
export interface BookingComHotelBookingRequest {
  hotelId: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  roomType: string;
  guests: Array<{
    firstName: string;
    lastName: string;
    email: string;
  }>;
  paymentInfo: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    cardholderName: string;
  };
}

/**
 * Generic Activity Booking Request (for Viator, GetYourGuide, etc.)
 */
export interface ActivityBookingRequest {
  activityId: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  participants: number;
  contactInfo: {
    name: string;
    email: string;
    phone: string;
  };
}
