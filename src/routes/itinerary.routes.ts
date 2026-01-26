/**
 * Itinerary Routes
 *
 * Endpoints for generating and downloading PDF itineraries.
 */

import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateItineraryPDF, ItineraryData } from '../services/pdf-generator.service';
import { BookingState } from '../types/booking.types';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/itinerary/:tripOptionId/download
 *
 * Download PDF itinerary for a trip option
 */
router.get('/:tripOptionId/download', async (req: Request, res: Response) => {
  try {
    const { tripOptionId } = req.params;

    console.log(`[ItineraryRoutes] Generating PDF for trip option: ${tripOptionId}`);

    // Fetch trip option with all details
    const tripOption = await prisma.tripOption.findUnique({
      where: { id: tripOptionId },
      include: {
        flightOption: true,
        hotelOption: true,
        activityOptions: true,
      },
    });

    if (!tripOption) {
      return res.status(404).json({
        success: false,
        error: 'Trip option not found',
      });
    }

    // Fetch trip request for dates and details
    const tripRequest = await prisma.tripRequest.findFirst({
      where: {
        tripOptions: {
          some: { id: tripOptionId },
        },
      },
    });

    if (!tripRequest) {
      return res.status(404).json({
        success: false,
        error: 'Trip request not found',
      });
    }

    // Fetch booking details (if booked)
    const bookings = await prisma.booking.findMany({
      where: { tripOptionId },
    });

    const payment = await prisma.payment.findFirst({
      where: { tripOptionId },
    });

    // Build booking response data structure
    const flightBooking = bookings.find((b) => b.bookingType === 'FLIGHT');
    const hotelBooking = bookings.find((b) => b.bookingType === 'HOTEL');
    const activityBookings = bookings.filter((b) => b.bookingType === 'ACTIVITY');

    const confirmations = {
      flight: flightBooking?.bookingDetails as any,
      hotel: hotelBooking?.bookingDetails as any,
      activities: activityBookings.map((b) => b.bookingDetails) as any[],
    };

    // Calculate number of days
    const numberOfDays = tripRequest.numberOfDays || 7;
    const startDate = tripRequest.startDate || new Date();
    const endDate = tripRequest.endDate ||
      new Date(startDate.getTime() + numberOfDays * 24 * 60 * 60 * 1000);

    // Build itinerary data
    const billingDetails = payment?.billingDetails as { name?: string; email?: string } | undefined;
    const itineraryData: ItineraryData = {
      tripId: tripOptionId,
      destination: tripOption.destination,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      numberOfDays,
      travelerName: billingDetails?.name || 'Valued Customer',
      travelerEmail: billingDetails?.email || 'customer@example.com',
      bookingResponse: {
        success: true,
        state: BookingState.CONFIRMED,
        confirmations,
        payment: payment
          ? {
              paymentIntentId: payment.paymentIntentId,
              amount: payment.amount,
              currency: payment.currency,
            }
          : undefined,
      },
    };

    // Generate PDF stream
    const pdfStream = generateItineraryPDF(itineraryData);

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="TripOptimizer-Itinerary-${tripOptionId}.pdf"`
    );

    // Pipe PDF stream to response
    pdfStream.pipe(res);

    console.log('[ItineraryRoutes] PDF generated and streaming to client');
  } catch (error) {
    console.error('[ItineraryRoutes] Error generating PDF:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate PDF',
    });
  }
});

/**
 * GET /api/itinerary/:tripOptionId/preview
 *
 * Get itinerary data as JSON (for preview before booking)
 */
router.get('/:tripOptionId/preview', async (req: Request, res: Response) => {
  try {
    const { tripOptionId } = req.params;

    console.log(`[ItineraryRoutes] Getting itinerary preview for: ${tripOptionId}`);

    // Fetch trip option
    const tripOption = await prisma.tripOption.findUnique({
      where: { id: tripOptionId },
      include: {
        flightOption: true,
        hotelOption: true,
        activityOptions: true,
      },
    });

    if (!tripOption) {
      return res.status(404).json({
        success: false,
        error: 'Trip option not found',
      });
    }

    // Fetch trip request
    const tripRequest = await prisma.tripRequest.findFirst({
      where: {
        tripOptions: {
          some: { id: tripOptionId },
        },
      },
    });

    if (!tripRequest) {
      return res.status(404).json({
        success: false,
        error: 'Trip request not found',
      });
    }

    // Return itinerary preview
    res.json({
      success: true,
      itinerary: {
        tripId: tripOptionId,
        destination: tripOption.destination,
        startDate: tripRequest.startDate,
        endDate: tripRequest.endDate,
        numberOfDays: tripRequest.numberOfDays,
        flight: tripOption.flightOption,
        hotel: tripOption.hotelOption,
        activities: tripOption.activityOptions,
        totalCost: tripOption.totalCost,
        score: tripOption.score,
      },
    });
  } catch (error) {
    console.error('[ItineraryRoutes] Error getting itinerary preview:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get itinerary preview',
    });
  }
});

export default router;
