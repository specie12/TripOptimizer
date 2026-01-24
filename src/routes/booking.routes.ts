/**
 * Booking Routes
 *
 * API endpoints for trip booking functionality.
 *
 * Routes:
 * - POST /booking/book - Book a complete trip
 * - POST /booking/cancel - Cancel a booking
 * - GET /booking/:id - Get booking details
 */

import express from 'express';
import { bookTrip, cancelBooking } from '../services/booking-orchestrator.service';
import { BookTripRequest, CancelBookingRequest } from '../types/booking.types';

const router = express.Router();

// ============================================
// ROUTE: POST /booking/book
// ============================================

/**
 * Book a complete trip (flight + hotel + activities)
 *
 * Request body:
 * {
 *   "tripOptionId": "uuid",
 *   "paymentInfo": {
 *     "paymentMethodId": "pm_...",
 *     "billingDetails": { ... },
 *     "amount": 100000,
 *     "currency": "USD"
 *   },
 *   "userContact": {
 *     "email": "user@example.com",
 *     "phone": "+1234567890"
 *   }
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "state": "CONFIRMED",
 *   "confirmations": {
 *     "flight": { ... },
 *     "hotel": { ... },
 *     "activities": [ ... ]
 *   },
 *   "payment": {
 *     "paymentIntentId": "pi_...",
 *     "amount": 100000,
 *     "currency": "USD"
 *   }
 * }
 */
router.post('/book', async (req, res) => {
  try {
    const request: BookTripRequest = req.body;

    // Validate request
    if (!request.tripOptionId) {
      return res.status(400).json({
        error: 'Missing tripOptionId',
      });
    }

    if (!request.paymentInfo || !request.paymentInfo.paymentMethodId) {
      return res.status(400).json({
        error: 'Missing payment information',
      });
    }

    console.log('[BookingRoutes] Booking trip:', request.tripOptionId);

    const result = await bookTrip(request);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('[BookingRoutes] Error booking trip:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================
// ROUTE: POST /booking/cancel
// ============================================

/**
 * Cancel a booking
 *
 * Request body:
 * {
 *   "bookingId": "uuid",
 *   "reason": "User requested cancellation"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "refundAmount": 100000,
 *   "cancellationFee": 5000
 * }
 */
router.post('/cancel', async (req, res) => {
  try {
    const request: CancelBookingRequest = req.body;

    if (!request.bookingId) {
      return res.status(400).json({
        error: 'Missing bookingId',
      });
    }

    console.log('[BookingRoutes] Cancelling booking:', request.bookingId);

    const result = await cancelBooking(request);

    return res.status(200).json(result);
  } catch (error) {
    console.error('[BookingRoutes] Error cancelling booking:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================
// ROUTE: GET /booking/:id
// ============================================

/**
 * Get booking details
 *
 * Response:
 * {
 *   "id": "uuid",
 *   "tripOptionId": "uuid",
 *   "status": "CONFIRMED",
 *   "confirmations": { ... }
 * }
 */
router.get('/:id', async (req, res) => {
  try {
    const bookingId = req.params.id;

    console.log('[BookingRoutes] Getting booking:', bookingId);

    // TODO: Implement getBooking function
    return res.status(501).json({
      error: 'Not implemented yet',
    });
  } catch (error) {
    console.error('[BookingRoutes] Error getting booking:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
