/**
 * PDF Generator Service
 *
 * Generates professional PDF itineraries for trip bookings.
 * Features:
 * - Trip summary with destination and dates
 * - Flight confirmation details
 * - Hotel booking information
 * - Activity confirmations
 * - Cost breakdown
 * - Booking references and confirmation codes
 */

import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import {
  BookTripResponse,
  FlightBookingConfirmation,
  HotelBookingConfirmation,
  ActivityBookingConfirmation,
} from '../types/booking.types';

export interface ItineraryData {
  tripId: string;
  destination: string;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  travelerName: string;
  travelerEmail: string;
  bookingResponse: BookTripResponse;
}

/**
 * Generate PDF itinerary
 * Returns a readable stream that can be piped to response or saved to file
 */
export function generateItineraryPDF(data: ItineraryData): NodeJS.ReadableStream {
  const doc = new PDFDocument({
    size: 'LETTER',
    margins: {
      top: 50,
      bottom: 50,
      left: 50,
      right: 50,
    },
  });

  // Header
  addHeader(doc, data);

  // Booking Summary
  addBookingSummary(doc, data);

  // Flight Details
  if (data.bookingResponse.confirmations?.flight) {
    addFlightDetails(doc, data.bookingResponse.confirmations.flight);
  }

  // Hotel Details
  if (data.bookingResponse.confirmations?.hotel) {
    addHotelDetails(doc, data.bookingResponse.confirmations.hotel);
  }

  // Activities
  if (data.bookingResponse.confirmations?.activities &&
      data.bookingResponse.confirmations.activities.length > 0) {
    addActivitiesSection(doc, data.bookingResponse.confirmations.activities);
  }

  // Payment Summary
  if (data.bookingResponse.payment) {
    addPaymentSummary(doc, data.bookingResponse.payment);
  }

  // Footer
  addFooter(doc);

  // Finalize PDF
  doc.end();

  return doc as unknown as NodeJS.ReadableStream;
}

/**
 * Add header with branding and trip title
 */
function addHeader(doc: PDFKit.PDFDocument, data: ItineraryData): void {
  // Logo/Branding
  doc
    .fontSize(24)
    .fillColor('#9333EA')
    .text('TripOptimizer', 50, 50, { continued: false })
    .fontSize(10)
    .fillColor('#666666')
    .text('Your Complete Travel Itinerary', 50, 78);

  // Trip Title
  doc
    .moveDown(2)
    .fontSize(20)
    .fillColor('#000000')
    .text(`Trip to ${data.destination}`, { align: 'center' });

  // Dates
  const startDate = new Date(data.startDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const endDate = new Date(data.endDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  doc
    .fontSize(12)
    .fillColor('#666666')
    .text(`${startDate} - ${endDate}`, { align: 'center' })
    .text(`${data.numberOfDays} days`, { align: 'center' });

  // Separator line
  doc
    .moveDown()
    .strokeColor('#E5E7EB')
    .lineWidth(1)
    .moveTo(50, doc.y)
    .lineTo(562, doc.y)
    .stroke();

  doc.moveDown();
}

/**
 * Add booking summary section
 */
function addBookingSummary(doc: PDFKit.PDFDocument, data: ItineraryData): void {
  doc
    .fontSize(16)
    .fillColor('#000000')
    .text('Booking Summary', { underline: true });

  doc.moveDown(0.5);

  // Traveler info
  doc
    .fontSize(11)
    .fillColor('#000000')
    .text('Traveler:', { continued: true })
    .fillColor('#666666')
    .text(` ${data.travelerName}`);

  doc
    .fillColor('#000000')
    .text('Email:', { continued: true })
    .fillColor('#666666')
    .text(` ${data.travelerEmail}`);

  doc
    .fillColor('#000000')
    .text('Booking ID:', { continued: true })
    .fillColor('#666666')
    .text(` ${data.tripId}`);

  if (data.bookingResponse.payment) {
    doc
      .fillColor('#000000')
      .text('Payment Intent:', { continued: true })
      .fillColor('#666666')
      .text(` ${data.bookingResponse.payment.paymentIntentId}`);
  }

  doc.moveDown();
}

/**
 * Add flight details section
 */
function addFlightDetails(
  doc: PDFKit.PDFDocument,
  flight: FlightBookingConfirmation
): void {
  // Section header with icon
  doc
    .fontSize(14)
    .fillColor('#2563EB')
    .text('✈️  Flight Confirmation');

  doc.moveDown(0.5);

  // Confirmation code (prominent)
  doc
    .fontSize(12)
    .fillColor('#000000')
    .text('Confirmation Code:', { continued: true })
    .fontSize(14)
    .fillColor('#2563EB')
    .text(` ${flight.confirmationCode}`, { underline: true });

  // Other details
  doc.fontSize(11).fillColor('#000000');

  if (flight.pnr) {
    doc.text('PNR:', { continued: true }).fillColor('#666666').text(` ${flight.pnr}`);
  }

  if (flight.bookingReference) {
    doc
      .fillColor('#000000')
      .text('Booking Reference:', { continued: true })
      .fillColor('#666666')
      .text(` ${flight.bookingReference}`);
  }

  if (flight.provider) {
    doc
      .fillColor('#000000')
      .text('Airline:', { continued: true })
      .fillColor('#666666')
      .text(` ${flight.provider}`);
  }

  // Flight times
  const departureTime = new Date(flight.departureTime).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  doc
    .fillColor('#000000')
    .text('Departure:', { continued: true })
    .fillColor('#666666')
    .text(` ${departureTime}`);

  if (flight.returnTime) {
    const returnTime = new Date(flight.returnTime).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    doc
      .fillColor('#000000')
      .text('Return:', { continued: true })
      .fillColor('#666666')
      .text(` ${returnTime}`);
  }

  // Price
  doc
    .fillColor('#000000')
    .text('Total Price:', { continued: true })
    .fillColor('#666666')
    .text(` $${(flight.totalPrice / 100).toFixed(2)} ${flight.currency}`);

  doc.moveDown();

  // Important note
  doc
    .fontSize(9)
    .fillColor('#DC2626')
    .text('⚠️  Please arrive at the airport at least 2 hours before departure.');

  doc.moveDown(1.5);
}

/**
 * Add hotel details section
 */
function addHotelDetails(
  doc: PDFKit.PDFDocument,
  hotel: HotelBookingConfirmation
): void {
  // Section header with icon
  doc
    .fontSize(14)
    .fillColor('#9333EA')
    .text('🏨  Hotel Reservation');

  doc.moveDown(0.5);

  // Hotel name
  doc.fontSize(13).fillColor('#000000').text(hotel.hotelName, { underline: true });

  doc.moveDown(0.3);

  // Confirmation code (prominent)
  doc
    .fontSize(12)
    .fillColor('#000000')
    .text('Confirmation Code:', { continued: true })
    .fontSize(14)
    .fillColor('#9333EA')
    .text(` ${hotel.confirmationCode}`, { underline: true });

  // Other details
  doc.fontSize(11).fillColor('#000000');

  if (hotel.bookingReference) {
    doc
      .text('Booking Reference:', { continued: true })
      .fillColor('#666666')
      .text(` ${hotel.bookingReference}`);
  }

  // Check-in/out
  const checkIn = new Date(hotel.checkIn).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const checkOut = new Date(hotel.checkOut).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  doc
    .fillColor('#000000')
    .text('Check-in:', { continued: true })
    .fillColor('#666666')
    .text(` ${checkIn} (after 3:00 PM)`);

  doc
    .fillColor('#000000')
    .text('Check-out:', { continued: true })
    .fillColor('#666666')
    .text(` ${checkOut} (before 11:00 AM)`);

  doc
    .fillColor('#000000')
    .text('Nights:', { continued: true })
    .fillColor('#666666')
    .text(` ${hotel.nights}`);

  // Price
  doc
    .fillColor('#000000')
    .text('Total Price:', { continued: true })
    .fillColor('#666666')
    .text(` $${(hotel.totalPrice / 100).toFixed(2)} ${hotel.currency}`);

  doc.moveDown();

  // Important note
  doc
    .fontSize(9)
    .fillColor('#DC2626')
    .text('⚠️  Please bring your confirmation code and a valid ID for check-in.');

  doc.moveDown(1.5);
}

/**
 * Add activities section
 */
function addActivitiesSection(
  doc: PDFKit.PDFDocument,
  activities: ActivityBookingConfirmation[]
): void {
  // Section header with icon
  doc
    .fontSize(14)
    .fillColor('#10B981')
    .text(`🎭  Activities & Experiences (${activities.length})`);

  doc.moveDown(0.5);

  activities.forEach((activity, index) => {
    // Activity name
    doc
      .fontSize(12)
      .fillColor('#000000')
      .text(`${index + 1}. ${activity.activityName}`, { underline: true });

    doc.fontSize(10);

    // Confirmation code
    doc
      .fillColor('#000000')
      .text('Confirmation:', { continued: true })
      .fillColor('#10B981')
      .text(` ${activity.confirmationCode}`);

    if (activity.bookingReference) {
      doc
        .fillColor('#000000')
        .text('Reference:', { continued: true })
        .fillColor('#666666')
        .text(` ${activity.bookingReference}`);
    }

    // Date and time
    const activityDate = new Date(activity.date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    doc
      .fillColor('#000000')
      .text('Date:', { continued: true })
      .fillColor('#666666')
      .text(` ${activityDate}${activity.time ? ` at ${activity.time}` : ''}`);

    // Price
    doc
      .fillColor('#000000')
      .text('Price:', { continued: true })
      .fillColor('#666666')
      .text(` $${(activity.totalPrice / 100).toFixed(2)} ${activity.currency}`);

    doc.moveDown(0.8);
  });

  doc.moveDown(0.5);
}

/**
 * Add payment summary section
 */
function addPaymentSummary(
  doc: PDFKit.PDFDocument,
  payment: { paymentIntentId: string; amount: number; currency: string }
): void {
  // Draw a box for payment summary
  const boxY = doc.y;
  doc
    .rect(50, boxY, 512, 80)
    .fillAndStroke('#F3F4F6', '#E5E7EB');

  // Payment summary text
  doc.fillColor('#000000');

  doc
    .fontSize(14)
    .text('Payment Summary', 70, boxY + 15);

  doc
    .fontSize(11)
    .text('Total Amount Paid:', 70, boxY + 40, { continued: true })
    .fontSize(16)
    .fillColor('#10B981')
    .text(` $${(payment.amount / 100).toFixed(2)} ${payment.currency}`);

  doc
    .fontSize(9)
    .fillColor('#666666')
    .text(`Payment ID: ${payment.paymentIntentId}`, 70, boxY + 62);

  doc.moveDown(3);
}

/**
 * Add footer with contact info and timestamp
 */
function addFooter(doc: PDFKit.PDFDocument): void {
  const bottomY = 720; // Near bottom of page

  // Separator line
  doc
    .strokeColor('#E5E7EB')
    .lineWidth(1)
    .moveTo(50, bottomY)
    .lineTo(562, bottomY)
    .stroke();

  doc.y = bottomY + 10;

  // Contact information
  doc
    .fontSize(9)
    .fillColor('#666666')
    .text('Need help? Contact us:', { continued: true })
    .fillColor('#9333EA')
    .text(' support@tripoptimizer.com', { link: 'mailto:support@tripoptimizer.com' });

  // Generation timestamp
  const timestamp = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  doc
    .fontSize(8)
    .fillColor('#999999')
    .text(`Generated on ${timestamp}`, { align: 'right' });

  // Copyright
  doc
    .fontSize(8)
    .fillColor('#999999')
    .text('© 2026 TripOptimizer. All rights reserved.', { align: 'center' });
}

/**
 * Save PDF to buffer (for email attachments)
 */
export function generateItineraryPDFBuffer(data: ItineraryData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const stream = generateItineraryPDF(data);

    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}
