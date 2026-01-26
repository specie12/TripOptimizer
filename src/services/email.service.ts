/**
 * Email Service
 *
 * Sends booking confirmation emails with PDF itineraries.
 * Features:
 * - HTML email templates
 * - PDF attachment support
 * - Professional formatting
 * - Error handling and retry logic
 */

import nodemailer, { Transporter } from 'nodemailer';
import { generateItineraryPDFBuffer, ItineraryData } from './pdf-generator.service';
import { BookTripResponse } from '../types/booking.types';

/**
 * Email configuration
 */
interface EmailConfig {
  service: string;
  user: string;
  password: string;
  from: string;
}

/**
 * Booking confirmation email data
 */
interface BookingConfirmationEmail {
  to: string;
  travelerName: string;
  tripId: string;
  destination: string;
  startDate: string;
  endDate: string;
  bookingResponse: BookTripResponse;
}

/**
 * Initialize email transporter
 */
function createTransporter(): Transporter | null {
  const config: EmailConfig = {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'noreply@tripoptimizer.com',
  };

  // Check if email is configured
  if (!config.user || !config.password) {
    console.warn('[EmailService] Email not configured - emails will not be sent');
    return null;
  }

  return nodemailer.createTransport({
    service: config.service,
    auth: {
      user: config.user,
      pass: config.password,
    },
  });
}

/**
 * Generate HTML email template for booking confirmation
 */
function generateBookingConfirmationHTML(data: BookingConfirmationEmail): string {
  const { travelerName, destination, startDate, endDate, bookingResponse } = data;

  const startDateFormatted = new Date(startDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const endDateFormatted = new Date(endDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const { flight, hotel, activities } = bookingResponse.confirmations || {};
  const { paymentIntentId, amount, currency } = bookingResponse.payment || {};

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmation - TripOptimizer</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background-color: white;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #9333EA;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #9333EA;
          margin-bottom: 10px;
        }
        .success-icon {
          width: 60px;
          height: 60px;
          background-color: #10B981;
          border-radius: 50%;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 32px;
        }
        h1 {
          color: #1f2937;
          font-size: 24px;
          margin: 0 0 10px;
        }
        .subtitle {
          color: #6b7280;
          font-size: 16px;
          margin: 0;
        }
        .section {
          margin: 30px 0;
          padding: 20px;
          background-color: #f9fafb;
          border-radius: 8px;
          border-left: 4px solid #9333EA;
        }
        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 15px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .info-label {
          font-weight: 600;
          color: #4b5563;
        }
        .info-value {
          color: #1f2937;
          text-align: right;
        }
        .confirmation-code {
          background-color: #dbeafe;
          color: #1e40af;
          padding: 4px 12px;
          border-radius: 4px;
          font-family: monospace;
          font-weight: bold;
        }
        .total-amount {
          font-size: 24px;
          font-weight: bold;
          color: #10B981;
        }
        .button {
          display: inline-block;
          padding: 14px 28px;
          background: linear-gradient(to right, #9333EA, #DB2777);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin: 20px 0;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
        }
        .footer a {
          color: #9333EA;
          text-decoration: none;
        }
        .warning {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          color: #92400e;
        }
        .activity-list {
          list-style: none;
          padding: 0;
          margin: 10px 0 0;
        }
        .activity-item {
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .activity-item:last-child {
          border-bottom: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="success-icon">✓</div>
          <div class="logo">TripOptimizer</div>
          <h1>Booking Confirmed!</h1>
          <p class="subtitle">Your trip to ${destination} is all set</p>
        </div>

        <!-- Trip Summary -->
        <div class="section">
          <h2 class="section-title">📅 Trip Summary</h2>
          <div class="info-row">
            <span class="info-label">Traveler:</span>
            <span class="info-value">${travelerName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Destination:</span>
            <span class="info-value">${destination}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Dates:</span>
            <span class="info-value">${startDateFormatted} - ${endDateFormatted}</span>
          </div>
        </div>

        ${
          flight
            ? `
        <!-- Flight Confirmation -->
        <div class="section">
          <h2 class="section-title">✈️ Flight Confirmation</h2>
          <div class="info-row">
            <span class="info-label">Confirmation Code:</span>
            <span class="info-value"><span class="confirmation-code">${flight.confirmationCode}</span></span>
          </div>
          ${
            flight.pnr
              ? `
          <div class="info-row">
            <span class="info-label">PNR:</span>
            <span class="info-value">${flight.pnr}</span>
          </div>
          `
              : ''
          }
          ${
            flight.provider
              ? `
          <div class="info-row">
            <span class="info-label">Airline:</span>
            <span class="info-value">${flight.provider}</span>
          </div>
          `
              : ''
          }
        </div>
        `
            : ''
        }

        ${
          hotel
            ? `
        <!-- Hotel Confirmation -->
        <div class="section">
          <h2 class="section-title">🏨 Hotel Reservation</h2>
          <div class="info-row">
            <span class="info-label">Hotel:</span>
            <span class="info-value">${hotel.hotelName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Confirmation Code:</span>
            <span class="info-value"><span class="confirmation-code">${hotel.confirmationCode}</span></span>
          </div>
          <div class="info-row">
            <span class="info-label">Check-in:</span>
            <span class="info-value">${new Date(hotel.checkIn).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })} (after 3:00 PM)</span>
          </div>
          <div class="info-row">
            <span class="info-label">Check-out:</span>
            <span class="info-value">${new Date(hotel.checkOut).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })} (before 11:00 AM)</span>
          </div>
        </div>
        `
            : ''
        }

        ${
          activities && activities.length > 0
            ? `
        <!-- Activities -->
        <div class="section">
          <h2 class="section-title">🎭 Activities & Experiences</h2>
          <ul class="activity-list">
            ${activities
              .map(
                (activity: any) => `
              <li class="activity-item">
                <strong>${activity.activityName}</strong><br>
                Confirmation: <span class="confirmation-code">${activity.confirmationCode}</span><br>
                Date: ${new Date(activity.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}${activity.time ? ` at ${activity.time}` : ''}
              </li>
            `
              )
              .join('')}
          </ul>
        </div>
        `
            : ''
        }

        <!-- Payment Confirmation -->
        <div class="section">
          <h2 class="section-title">💳 Payment Confirmation</h2>
          <div class="info-row">
            <span class="info-label">Total Amount Paid:</span>
            <span class="info-value"><span class="total-amount">$${((amount || 0) / 100).toFixed(2)} ${currency || 'USD'}</span></span>
          </div>
          <div class="info-row">
            <span class="info-label">Payment ID:</span>
            <span class="info-value">${paymentIntentId || 'N/A'}</span>
          </div>
        </div>

        <!-- Important Notes -->
        <div class="warning">
          <strong>⚠️ Important Reminders:</strong>
          <ul style="margin: 10px 0 0; padding-left: 20px;">
            <li>Arrive at the airport at least 2 hours before departure</li>
            <li>Bring valid ID and confirmation codes for all bookings</li>
            <li>Check passport validity and visa requirements</li>
            <li>Save all confirmation codes to your phone for easy access</li>
          </ul>
        </div>

        <!-- PDF Attachment Notice -->
        <p style="text-align: center; margin: 30px 0;">
          📄 <strong>Your complete itinerary is attached as a PDF.</strong><br>
          Save it to your phone or print it for your trip!
        </p>

        <!-- Footer -->
        <div class="footer">
          <p>
            Need help? Contact us at <a href="mailto:support@tripoptimizer.com">support@tripoptimizer.com</a>
          </p>
          <p style="margin-top: 15px; color: #9ca3af; font-size: 12px;">
            © ${new Date().getFullYear()} TripOptimizer. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send booking confirmation email with PDF attachment
 */
export async function sendBookingConfirmation(
  emailData: BookingConfirmationEmail
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      console.warn('[EmailService] Skipping email - not configured');
      return { success: false, error: 'Email service not configured' };
    }

    // Generate PDF itinerary
    const numberOfDays = Math.ceil(
      (new Date(emailData.endDate).getTime() - new Date(emailData.startDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    const itineraryData: ItineraryData = {
      tripId: emailData.tripId,
      destination: emailData.destination,
      startDate: emailData.startDate,
      endDate: emailData.endDate,
      numberOfDays,
      travelerName: emailData.travelerName,
      travelerEmail: emailData.to,
      bookingResponse: emailData.bookingResponse,
    };

    console.log('[EmailService] Generating PDF itinerary...');
    const pdfBuffer = await generateItineraryPDFBuffer(itineraryData);
    console.log(`[EmailService] PDF generated: ${pdfBuffer.length} bytes`);

    // Generate HTML email
    const htmlContent = generateBookingConfirmationHTML(emailData);

    // Send email with attachment
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'TripOptimizer <noreply@tripoptimizer.com>',
      to: emailData.to,
      subject: `✈️ Booking Confirmed: Your Trip to ${emailData.destination}`,
      html: htmlContent,
      attachments: [
        {
          filename: `TripOptimizer-Itinerary-${emailData.tripId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    console.log(`[EmailService] Sending confirmation email to ${emailData.to}...`);
    const info = await transporter.sendMail(mailOptions);

    console.log(`[EmailService] Email sent successfully: ${info.messageId}`);
    return { success: true };
  } catch (error) {
    console.error('[EmailService] Failed to send email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send test email (for debugging)
 */
export async function sendTestEmail(to: string): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      return { success: false, error: 'Email service not configured' };
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'TripOptimizer <noreply@tripoptimizer.com>',
      to,
      subject: 'Test Email from TripOptimizer',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from TripOptimizer.</p>
        <p>If you received this, email configuration is working correctly!</p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Test email sent: ${info.messageId}`);

    return { success: true };
  } catch (error) {
    console.error('[EmailService] Test email failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
