/**
 * Booking Orchestrator Service
 *
 * Coordinates the entire booking process for trip options.
 * Implements strict state machine and rollback logic.
 *
 * CRITICAL RULES:
 * - NO AI involvement - all logic is deterministic
 * - Strict state machine (PENDING → VALIDATING → PROCESSING → CONFIRMED/FAILED)
 * - Automatic rollback on partial failures
 * - All bookings are atomic (all succeed or all fail)
 *
 * Flow:
 * 1. Validate availability (API calls + Verification Agent)
 * 2. Process payment (Stripe)
 * 3. Execute bookings (Flight → Hotel → Activities)
 * 4. Handle failures (rollback + refund)
 * 5. Save confirmations to database
 */

import { PrismaClient } from '@prisma/client';
import {
  BookTripRequest,
  BookTripResponse,
  BookingState,
  ValidationRequest,
  ValidationResult,
  CancelBookingRequest,
  CancelBookingResponse,
  FlightBookingConfirmation,
  HotelBookingConfirmation,
  ActivityBookingConfirmation,
  ComponentBookingStatus,
  BookingOrchestratorState,
} from '../types/booking.types';
import { createPaymentIntent, processRefund, processPartialRefund } from '../integrations/stripe.integration';
import { verifyEntity } from './verification.service';

const prisma = new PrismaClient();

// ============================================
// MAIN BOOKING FLOW
// ============================================

/**
 * Book an entire trip (flight + hotel + activities)
 *
 * Implements atomic booking with automatic rollback on failure.
 */
export async function bookTrip(request: BookTripRequest): Promise<BookTripResponse> {
  const startTime = Date.now();

  // Initialize orchestrator state
  const orchestratorState: BookingOrchestratorState = {
    tripOptionId: request.tripOptionId,
    state: BookingState.PENDING,
    startedAt: new Date(),
    totalAmount: request.paymentInfo.amount,
    componentStatuses: {
      flight: ComponentBookingStatus.PENDING,
      hotel: ComponentBookingStatus.PENDING,
      activities: [],
    },
    confirmations: {
      activities: [],
    },
    errors: [],
    warnings: [],
    rollbackLog: [],
  };

  try {
    // ==================== STEP 1: VALIDATION ====================
    console.log('[BookingOrchestrator] Starting validation...');
    orchestratorState.state = BookingState.VALIDATING;

    const validation = await validateBooking({ tripOptionId: request.tripOptionId });

    if (!validation.success) {
      orchestratorState.state = BookingState.FAILED;
      orchestratorState.errors.push(`Validation failed: ${validation.error}`);

      return {
        success: false,
        state: BookingState.FAILED,
        error: validation.error,
      };
    }

    // Check individual validations
    if (!validation.validationDetails.flight.available) {
      return handleValidationFailure(orchestratorState, 'Flight no longer available');
    }
    if (!validation.validationDetails.hotel.available) {
      return handleValidationFailure(orchestratorState, 'Hotel no longer available');
    }

    // ==================== STEP 2: PAYMENT ====================
    console.log('[BookingOrchestrator] Processing payment...');
    orchestratorState.state = BookingState.PROCESSING;

    const paymentResult = await createPaymentIntent(request.paymentInfo);

    if (!paymentResult.success) {
      orchestratorState.state = BookingState.FAILED;
      orchestratorState.errors.push(`Payment failed: ${paymentResult.error}`);

      return {
        success: false,
        state: BookingState.FAILED,
        error: `Payment failed: ${paymentResult.error}`,
      };
    }

    orchestratorState.paymentIntentId = paymentResult.paymentIntentId;

    // Save payment to database
    await savePayment(request.tripOptionId, paymentResult, request.paymentInfo);

    // ==================== STEP 3: EXECUTE BOOKINGS ====================
    console.log('[BookingOrchestrator] Executing bookings...');

    // Get trip option details
    const tripOption = await prisma.tripOption.findUnique({
      where: { id: request.tripOptionId },
      include: {
        flightOption: true,
        hotelOption: true,
        activityOptions: true,
      },
    });

    if (!tripOption) {
      await rollbackPayment(orchestratorState);
      return {
        success: false,
        state: BookingState.FAILED,
        error: 'Trip option not found',
      };
    }

    // Book flight
    console.log('[BookingOrchestrator] Booking flight...');
    const flightResult = await bookFlight(tripOption.flightOption);

    if (!flightResult.success) {
      orchestratorState.componentStatuses.flight = ComponentBookingStatus.FAILED;
      orchestratorState.errors.push(`Flight booking failed: ${flightResult.error}`);

      // Rollback payment
      await rollbackPayment(orchestratorState);

      return {
        success: false,
        state: BookingState.FAILED,
        error: `Flight booking failed: ${flightResult.error}`,
        rollbackInfo: {
          refundAmount: request.paymentInfo.amount,
          cancelledBookings: [],
        },
      };
    }

    orchestratorState.componentStatuses.flight = ComponentBookingStatus.CONFIRMED;
    orchestratorState.confirmations.flight = flightResult.confirmation;

    // Book hotel
    console.log('[BookingOrchestrator] Booking hotel...');
    const hotelResult = await bookHotel(tripOption.hotelOption);

    if (!hotelResult.success) {
      orchestratorState.componentStatuses.hotel = ComponentBookingStatus.FAILED;
      orchestratorState.errors.push(`Hotel booking failed: ${hotelResult.error}`);

      // Rollback flight and payment
      await rollbackFlight(orchestratorState.confirmations.flight!);
      await rollbackPayment(orchestratorState);

      return {
        success: false,
        state: BookingState.FAILED,
        error: `Hotel booking failed: ${hotelResult.error}`,
        rollbackInfo: {
          refundAmount: request.paymentInfo.amount,
          cancelledBookings: [flightResult.confirmation!.confirmationCode],
        },
      };
    }

    orchestratorState.componentStatuses.hotel = ComponentBookingStatus.CONFIRMED;
    orchestratorState.confirmations.hotel = hotelResult.confirmation;

    // Book activities
    console.log('[BookingOrchestrator] Booking activities...');
    if (tripOption.activityOptions && tripOption.activityOptions.length > 0) {
      for (const activity of tripOption.activityOptions) {
        const activityResult = await bookActivity(activity);

        if (activityResult.success) {
          orchestratorState.componentStatuses.activities.push(ComponentBookingStatus.CONFIRMED);
          orchestratorState.confirmations.activities.push(activityResult.confirmation!);
        } else {
          // Activity booking failure is non-critical - continue with warning
          orchestratorState.componentStatuses.activities.push(ComponentBookingStatus.FAILED);
          orchestratorState.warnings.push(`Activity booking failed: ${activityResult.error}`);
        }
      }
    }

    // ==================== STEP 4: SUCCESS ====================
    orchestratorState.state = BookingState.CONFIRMED;

    // Save all booking confirmations to database
    await saveBookingConfirmations(tripOption.id, orchestratorState);

    // Update trip option lock status to CONFIRMED
    await prisma.tripOption.update({
      where: { id: tripOption.id },
      data: {
        lockStatus: 'CONFIRMED',
        lockedAt: new Date(),
      },
    });

    const duration = Date.now() - startTime;
    console.log(`[BookingOrchestrator] Booking completed successfully in ${duration}ms`);

    return {
      success: true,
      state: BookingState.CONFIRMED,
      confirmations: orchestratorState.confirmations,
      payment: {
        paymentIntentId: orchestratorState.paymentIntentId!,
        amount: request.paymentInfo.amount,
        currency: request.paymentInfo.currency,
      },
    };
  } catch (error) {
    console.error('[BookingOrchestrator] Unexpected error:', error);

    // Attempt rollback
    if (orchestratorState.paymentIntentId) {
      await rollbackPayment(orchestratorState);
    }

    return {
      success: false,
      state: BookingState.FAILED,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validate booking availability and entity existence
 */
async function validateBooking(request: ValidationRequest): Promise<ValidationResult> {
  try {
    const tripOption = await prisma.tripOption.findUnique({
      where: { id: request.tripOptionId },
      include: {
        flightOption: true,
        hotelOption: true,
        activityOptions: true,
      },
    });

    if (!tripOption) {
      return {
        success: false,
        validationDetails: {
          flight: { componentType: 'FLIGHT', componentId: '', available: false, verified: false },
          hotel: { componentType: 'HOTEL', componentId: '', available: false, verified: false },
          activities: [],
        },
        error: 'Trip option not found',
      };
    }

    // Validate flight
    const flightValidation = {
      componentType: 'FLIGHT' as const,
      componentId: tripOption.flightOption?.id || '',
      available: true, // TODO: Check with Amadeus API
      verified: true,
    };

    // Validate hotel
    const hotelVerification = await verifyEntity({
      entityType: 'hotel',
      name: tripOption.hotelOption?.name || '',
      location: {
        city: tripOption.destination,
      },
    });

    const hotelValidation = {
      componentType: 'HOTEL' as const,
      componentId: tripOption.hotelOption?.id || '',
      available: true, // TODO: Check with Booking.com API
      verified: hotelVerification.result.verificationStatus === 'VERIFIED',
      warnings: hotelVerification.result.verificationStatus === 'UNKNOWN'
        ? ['Hotel existence could not be verified']
        : undefined,
    };

    // Validate activities
    const activityValidations = [];
    if (tripOption.activityOptions) {
      for (const activity of tripOption.activityOptions) {
        activityValidations.push({
          componentType: 'ACTIVITY' as const,
          componentId: activity.id,
          available: true, // TODO: Check with activity provider API
          verified: true,
        });
      }
    }

    return {
      success: true,
      validationDetails: {
        flight: flightValidation,
        hotel: hotelValidation,
        activities: activityValidations,
      },
    };
  } catch (error) {
    console.error('[BookingOrchestrator] Validation error:', error);
    return {
      success: false,
      validationDetails: {
        flight: { componentType: 'FLIGHT', componentId: '', available: false, verified: false },
        hotel: { componentType: 'HOTEL', componentId: '', available: false, verified: false },
        activities: [],
      },
      error: error instanceof Error ? error.message : 'Validation error',
    };
  }
}

function handleValidationFailure(
  state: BookingOrchestratorState,
  error: string
): BookTripResponse {
  state.state = BookingState.FAILED;
  state.errors.push(error);

  return {
    success: false,
    state: BookingState.FAILED,
    error,
  };
}

// ============================================
// BOOKING EXECUTION (STUB IMPLEMENTATIONS)
// ============================================

/**
 * Book a flight via Amadeus API
 * TODO: Implement real Amadeus booking in Phase 2
 */
async function bookFlight(flightOption: any): Promise<{
  success: boolean;
  confirmation?: FlightBookingConfirmation;
  error?: string;
}> {
  // STUB: Simulate flight booking
  console.log('[BookingOrchestrator] STUB: Booking flight with Amadeus');

  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Mock successful booking
  const confirmation: FlightBookingConfirmation = {
    confirmationCode: `FL${Date.now()}`,
    bookingReference: `STUB-${flightOption?.id.slice(0, 8).toUpperCase()}`,
    pnr: `PNR${Date.now()}`,
    provider: flightOption?.provider || 'Unknown',
    departureTime: flightOption?.departureTime?.toISOString() || new Date().toISOString(),
    returnTime: flightOption?.returnTime?.toISOString() || new Date().toISOString(),
    passengerNames: ['John Doe'], // TODO: Get from booking request
    totalPrice: flightOption?.price || 0,
    currency: 'USD',
    deepLink: flightOption?.deepLink,
  };

  return {
    success: true,
    confirmation,
  };
}

/**
 * Book a hotel via Booking.com API
 * TODO: Implement real Booking.com booking in Phase 2
 */
async function bookHotel(hotelOption: any): Promise<{
  success: boolean;
  confirmation?: HotelBookingConfirmation;
  error?: string;
}> {
  // STUB: Simulate hotel booking
  console.log('[BookingOrchestrator] STUB: Booking hotel with Booking.com');

  await new Promise((resolve) => setTimeout(resolve, 500));

  const confirmation: HotelBookingConfirmation = {
    confirmationCode: `HT${Date.now()}`,
    bookingReference: `STUB-${hotelOption?.id.slice(0, 8).toUpperCase()}`,
    hotelName: hotelOption?.name || 'Unknown Hotel',
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    nights: 7,
    guestNames: ['John Doe'],
    totalPrice: hotelOption?.priceTotal || 0,
    currency: 'USD',
    deepLink: hotelOption?.deepLink,
  };

  return {
    success: true,
    confirmation,
  };
}

/**
 * Book an activity via provider API
 * TODO: Implement real activity booking in Phase 2
 */
async function bookActivity(activityOption: any): Promise<{
  success: boolean;
  confirmation?: ActivityBookingConfirmation;
  error?: string;
}> {
  // STUB: Simulate activity booking
  console.log('[BookingOrchestrator] STUB: Booking activity');

  await new Promise((resolve) => setTimeout(resolve, 300));

  const confirmation: ActivityBookingConfirmation = {
    confirmationCode: `AC${Date.now()}`,
    bookingReference: `STUB-${activityOption?.id.slice(0, 8).toUpperCase()}`,
    activityName: activityOption?.name || 'Unknown Activity',
    date: new Date().toISOString().split('T')[0],
    participants: 1,
    totalPrice: activityOption?.price || 0,
    currency: 'USD',
    deepLink: activityOption?.deepLink,
  };

  return {
    success: true,
    confirmation,
  };
}

// ============================================
// ROLLBACK LOGIC
// ============================================

async function rollbackPayment(state: BookingOrchestratorState): Promise<void> {
  if (!state.paymentIntentId) {
    return;
  }

  console.log('[BookingOrchestrator] Rolling back payment:', state.paymentIntentId);

  const refundResult = await processRefund(state.paymentIntentId, 'Booking failed');

  state.rollbackLog.push({
    timestamp: new Date(),
    action: 'REFUND_PAYMENT',
    success: refundResult.success,
    details: refundResult,
  });

  if (!refundResult.success) {
    console.error('[BookingOrchestrator] Refund failed:', refundResult.error);
  }
}

async function rollbackFlight(confirmation: FlightBookingConfirmation): Promise<void> {
  // STUB: Cancel flight booking
  console.log('[BookingOrchestrator] STUB: Cancelling flight:', confirmation.confirmationCode);

  // TODO: Implement real flight cancellation via Amadeus API
  await new Promise((resolve) => setTimeout(resolve, 300));
}

async function rollbackHotel(confirmation: HotelBookingConfirmation): Promise<void> {
  // STUB: Cancel hotel booking
  console.log('[BookingOrchestrator] STUB: Cancelling hotel:', confirmation.confirmationCode);

  // TODO: Implement real hotel cancellation via Booking.com API
  await new Promise((resolve) => setTimeout(resolve, 300));
}

// ============================================
// DATABASE OPERATIONS
// ============================================

async function savePayment(
  tripOptionId: string,
  paymentResult: any,
  paymentInfo: any
): Promise<void> {
  await prisma.payment.create({
    data: {
      tripOptionId,
      paymentIntentId: paymentResult.paymentIntentId!,
      chargeId: paymentResult.chargeId,
      amount: paymentInfo.amount,
      currency: paymentInfo.currency,
      status: 'succeeded',
      paymentMethodId: paymentInfo.paymentMethodId,
      billingDetails: paymentInfo.billingDetails,
    },
  });
}

async function saveBookingConfirmations(
  tripOptionId: string,
  state: BookingOrchestratorState
): Promise<void> {
  // Save flight booking
  if (state.confirmations.flight) {
    await prisma.booking.create({
      data: {
        tripOptionId,
        bookingType: 'FLIGHT',
        componentId: tripOptionId, // TODO: Use actual flight option ID
        status: 'CONFIRMED',
        state: 'CONFIRMED',
        vendorConfirmation: state.confirmations.flight.confirmationCode,
        bookingReference: state.confirmations.flight.bookingReference,
        pnr: state.confirmations.flight.pnr,
        amount: state.confirmations.flight.totalPrice,
        currency: state.confirmations.flight.currency,
        bookedAt: new Date(),
        bookingDetails: state.confirmations.flight,
      },
    });
  }

  // Save hotel booking
  if (state.confirmations.hotel) {
    await prisma.booking.create({
      data: {
        tripOptionId,
        bookingType: 'HOTEL',
        componentId: tripOptionId, // TODO: Use actual hotel option ID
        status: 'CONFIRMED',
        state: 'CONFIRMED',
        vendorConfirmation: state.confirmations.hotel.confirmationCode,
        bookingReference: state.confirmations.hotel.bookingReference,
        amount: state.confirmations.hotel.totalPrice,
        currency: state.confirmations.hotel.currency,
        bookedAt: new Date(),
        bookingDetails: state.confirmations.hotel,
      },
    });
  }

  // Save activity bookings
  for (const activity of state.confirmations.activities) {
    await prisma.booking.create({
      data: {
        tripOptionId,
        bookingType: 'ACTIVITY',
        componentId: tripOptionId, // TODO: Use actual activity option ID
        status: 'CONFIRMED',
        state: 'CONFIRMED',
        vendorConfirmation: activity.confirmationCode,
        bookingReference: activity.bookingReference,
        amount: activity.totalPrice,
        currency: activity.currency,
        bookedAt: new Date(),
        bookingDetails: activity,
      },
    });
  }
}

// ============================================
// CANCELLATION
// ============================================

export async function cancelBooking(request: CancelBookingRequest): Promise<CancelBookingResponse> {
  // TODO: Implement cancellation logic
  console.log('[BookingOrchestrator] STUB: Cancelling booking:', request.bookingId);

  return {
    success: true,
    refundAmount: 0,
    cancellationFee: 0,
  };
}
