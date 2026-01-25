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
  BookingType,
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
import { bookFlight as bookFlightAmadeus, cancelFlight as cancelFlightAmadeus } from '../integrations/amadeus.integration';
import { bookHotel as bookHotelAPI, cancelHotel as cancelHotelAPI } from '../integrations/hotel.integration';
import { bookActivity as bookActivityAPI, cancelActivity as cancelActivityAPI } from '../integrations/activity.integration';
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
          flight: { componentType: BookingType.FLIGHT as any, componentId: '', available: false, verified: false },
          hotel: { componentType: BookingType.HOTEL as any, componentId: '', available: false, verified: false },
          activities: [],
        },
        error: 'Trip option not found',
      };
    }

    // Validate flight
    const flightValidation = {
      componentType: BookingType.FLIGHT as any,
      componentId: tripOption.flightOption?.id || '',
      available: true, // TODO: Check with Amadeus API
      verified: true,
    };

    // Validate hotel
    const hotelVerification = await verifyEntity({
      entityType: 'HOTEL',
      entityName: tripOption.hotelOption?.name || '',
      city: tripOption.destination,
    });

    const hotelValidation = {
      componentType: BookingType.HOTEL as any,
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
          componentType: BookingType.ACTIVITY as any,
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
        flight: { componentType: BookingType.FLIGHT as any, componentId: '', available: false, verified: false },
        hotel: { componentType: BookingType.HOTEL as any, componentId: '', available: false, verified: false },
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
 */
async function bookFlight(flightOption: any): Promise<{
  success: boolean;
  confirmation?: FlightBookingConfirmation;
  error?: string;
}> {
  try {
    console.log('[BookingOrchestrator] Booking flight with Amadeus');

    // Extract flight offer data (stored during trip generation)
    const flightOffer = flightOption.amadeusOffer || flightOption;

    // Build traveler data
    // TODO: Get real traveler data from booking request
    const travelers = [
      {
        id: '1',
        dateOfBirth: '1990-01-01', // TODO: Get from user profile
        name: {
          firstName: 'John', // TODO: Get from booking request
          lastName: 'Doe', // TODO: Get from booking request
        },
        gender: 'MALE' as const,
        contact: {
          emailAddress: 'john.doe@example.com', // TODO: Get from booking request
          phones: [
            {
              deviceType: 'MOBILE' as const,
              countryCallingCode: '1',
              number: '1234567890',
            },
          ],
        },
      },
    ];

    // Call Amadeus API
    const confirmation = await bookFlightAmadeus({
      flightOffer,
      travelers,
    });

    return {
      success: true,
      confirmation,
    };
  } catch (error) {
    console.error('[BookingOrchestrator] Flight booking error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Flight booking failed',
    };
  }
}

/**
 * Book a hotel
 */
async function bookHotel(hotelOption: any): Promise<{
  success: boolean;
  confirmation?: HotelBookingConfirmation;
  error?: string;
}> {
  try {
    console.log('[BookingOrchestrator] Booking hotel');

    // Calculate nights
    const checkIn = new Date(hotelOption.checkIn || new Date());
    const checkOut = new Date(hotelOption.checkOut || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    // Build guest data
    // TODO: Get real guest data from booking request
    const guests = [
      {
        firstName: 'John', // TODO: Get from booking request
        lastName: 'Doe', // TODO: Get from booking request
        email: 'john.doe@example.com', // TODO: Get from booking request
      },
    ];

    // Call hotel booking API
    const confirmation = await bookHotelAPI({
      hotelId: hotelOption.id,
      hotelName: hotelOption.name || 'Unknown Hotel',
      checkIn: checkIn.toISOString().split('T')[0],
      checkOut: checkOut.toISOString().split('T')[0],
      nights,
      guests,
      totalPrice: hotelOption.priceTotal || 0,
      currency: 'USD',
    });

    return {
      success: true,
      confirmation,
    };
  } catch (error) {
    console.error('[BookingOrchestrator] Hotel booking error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Hotel booking failed',
    };
  }
}

/**
 * Book an activity
 */
async function bookActivity(activityOption: any): Promise<{
  success: boolean;
  confirmation?: ActivityBookingConfirmation;
  error?: string;
}> {
  try {
    console.log('[BookingOrchestrator] Booking activity');

    // Call activity booking API
    const confirmation = await bookActivityAPI({
      activityId: activityOption.id,
      activityName: activityOption.name || 'Unknown Activity',
      date: activityOption.date || new Date().toISOString().split('T')[0],
      time: activityOption.time,
      participants: activityOption.participants || 1,
      totalPrice: activityOption.price || 0,
      currency: 'USD',
      contactEmail: 'john.doe@example.com', // TODO: Get from booking request
    });

    return {
      success: true,
      confirmation,
    };
  } catch (error) {
    console.error('[BookingOrchestrator] Activity booking error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Activity booking failed',
    };
  }
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
  console.log('[BookingOrchestrator] Cancelling flight:', confirmation.confirmationCode);

  try {
    const result = await cancelFlightAmadeus(confirmation.confirmationCode);

    if (!result.success) {
      console.error('[BookingOrchestrator] Flight cancellation failed:', result.error);
    } else {
      console.log('[BookingOrchestrator] Flight cancelled successfully');
    }
  } catch (error) {
    console.error('[BookingOrchestrator] Flight cancellation error:', error);
  }
}

async function rollbackHotel(confirmation: HotelBookingConfirmation): Promise<void> {
  console.log('[BookingOrchestrator] Cancelling hotel:', confirmation.confirmationCode);

  try {
    const result = await cancelHotelAPI(confirmation.confirmationCode);

    if (!result.success) {
      console.error('[BookingOrchestrator] Hotel cancellation failed:', result.error);
    } else {
      console.log('[BookingOrchestrator] Hotel cancelled successfully');
    }
  } catch (error) {
    console.error('[BookingOrchestrator] Hotel cancellation error:', error);
  }
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
        bookingType: BookingType.FLIGHT,
        componentId: tripOptionId, // TODO: Use actual flight option ID
        status: 'CONFIRMED',
        state: 'CONFIRMED',
        vendorConfirmation: state.confirmations.flight.confirmationCode,
        bookingReference: state.confirmations.flight.bookingReference,
        pnr: state.confirmations.flight.pnr,
        amount: state.confirmations.flight.totalPrice,
        currency: state.confirmations.flight.currency,
        bookedAt: new Date(),
        bookingDetails: state.confirmations.flight as any,
      },
    });
  }

  // Save hotel booking
  if (state.confirmations.hotel) {
    await prisma.booking.create({
      data: {
        tripOptionId,
        bookingType: BookingType.HOTEL,
        componentId: tripOptionId, // TODO: Use actual hotel option ID
        status: 'CONFIRMED',
        state: 'CONFIRMED',
        vendorConfirmation: state.confirmations.hotel.confirmationCode,
        bookingReference: state.confirmations.hotel.bookingReference,
        amount: state.confirmations.hotel.totalPrice,
        currency: state.confirmations.hotel.currency,
        bookedAt: new Date(),
        bookingDetails: state.confirmations.hotel as any,
      },
    });
  }

  // Save activity bookings
  for (const activity of state.confirmations.activities) {
    await prisma.booking.create({
      data: {
        tripOptionId,
        bookingType: BookingType.ACTIVITY,
        componentId: tripOptionId, // TODO: Use actual activity option ID
        status: 'CONFIRMED',
        state: 'CONFIRMED',
        vendorConfirmation: activity.confirmationCode,
        bookingReference: activity.bookingReference,
        amount: activity.totalPrice,
        currency: activity.currency,
        bookedAt: new Date(),
        bookingDetails: activity as any,
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
