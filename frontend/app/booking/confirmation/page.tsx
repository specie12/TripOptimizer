'use client';

/**
 * Booking Confirmation Page
 *
 * Displays booking confirmation details after successful payment.
 * Shows:
 * - Success message
 * - Flight confirmation
 * - Hotel confirmation
 * - Activity confirmations
 * - Payment receipt
 * - Next steps
 */

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { formatCurrency } from '@/lib/formatters';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const paymentIntentId = searchParams.get('paymentIntentId');

  // In a real implementation, you would fetch booking details from backend using paymentIntentId
  // For now, we'll show a success message with the payment intent ID

  if (!paymentIntentId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Booking Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            We couldn't find your booking confirmation. Please check your email for booking details.
          </p>
          <a
            href="/"
            className="inline-block py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            Return Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Booking Confirmed!
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              Your trip has been successfully booked
            </p>
            <div className="inline-block bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
              Payment Intent: {paymentIntentId.substring(0, 20)}...
            </div>
          </div>
        </div>

        {/* Confirmation Details */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Booking Details
          </h2>

          <div className="space-y-6">
            {/* Flight Confirmation */}
            <div className="border-l-4 border-blue-500 pl-4">
              <div className="flex items-start gap-3 mb-2">
                <span className="text-2xl">✈️</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Flight Confirmed</h3>
                  <p className="text-sm text-gray-600">
                    Confirmation details have been sent to your email
                  </p>
                </div>
              </div>
            </div>

            {/* Hotel Confirmation */}
            <div className="border-l-4 border-purple-500 pl-4">
              <div className="flex items-start gap-3 mb-2">
                <span className="text-2xl">🏨</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Hotel Confirmed</h3>
                  <p className="text-sm text-gray-600">
                    Booking reference has been sent to your email
                  </p>
                </div>
              </div>
            </div>

            {/* Activities Confirmation */}
            <div className="border-l-4 border-green-500 pl-4">
              <div className="flex items-start gap-3 mb-2">
                <span className="text-2xl">🎭</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Activities Confirmed</h3>
                  <p className="text-sm text-gray-600">
                    All activity confirmations have been sent to your email
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            What's Next?
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Check Your Email</h3>
                <p className="text-sm text-gray-600">
                  We've sent all confirmation details and booking references to your email address.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Save Your Confirmations</h3>
                <p className="text-sm text-gray-600">
                  Keep all confirmation codes handy for check-in at the airport and hotel.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Prepare for Your Trip</h3>
                <p className="text-sm text-gray-600">
                  Check passport validity, travel insurance, and local requirements for your destination.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Support Information */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
          <p className="text-sm text-gray-600 mb-4">
            If you have any questions about your booking, please don't hesitate to contact us.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="mailto:support@tripoptimizer.com"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-purple-600 font-medium rounded-lg hover:bg-purple-50 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Support
            </a>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <a
            href="/"
            className="py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
          >
            Plan Another Trip
          </a>
          <button
            onClick={() => window.print()}
            className="py-3 px-6 bg-white text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors border border-gray-300"
          >
            Print Confirmation
          </button>
        </div>

        {/* Test Mode Notice */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Test Mode:</strong> This is a test booking. No actual reservations or charges were made.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mb-4"></div>
            <p className="text-gray-600">Loading confirmation...</p>
          </div>
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
