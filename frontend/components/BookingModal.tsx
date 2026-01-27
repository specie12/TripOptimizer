'use client';

/**
 * BookingModal Component
 *
 * Modal for booking a complete trip with Stripe payment processing.
 * Includes:
 * - Booking summary
 * - Traveler information form
 * - Stripe Elements card input
 * - Real-time validation
 * - Loading and error states
 * - Success redirect to confirmation page
 */

import { useState, FormEvent } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe, StripeCardElementOptions } from '@stripe/stripe-js';
import { TripOptionResponse } from '@/lib/types';
import { bookTrip, BookingRequest, BookingResponse } from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';
import { useRouter } from 'next/navigation';

// Initialize Stripe (will be null in mock mode)
const MOCK_MODE = !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY === 'pk_test_mock';

const stripePromise = MOCK_MODE
  ? Promise.resolve(null)
  : loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface BookingModalProps {
  tripOption: TripOptionResponse;
  isOpen: boolean;
  onClose: () => void;
}

interface BookingFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    line1: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

const CARD_ELEMENT_OPTIONS: StripeCardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    invalid: {
      color: '#9e2146',
    },
  },
  hidePostalCode: false,
};

function BookingForm({ tripOption, onSuccess, onError }: {
  tripOption: TripOptionResponse;
  onSuccess: (response: BookingResponse) => void;
  onError: (error: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');

  const [formData, setFormData] = useState<BookingFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: {
      line1: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US',
    },
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setIsProcessing(true);

    try {
      let paymentMethodId: string;

      // Mock mode: use a fake payment method ID
      if (MOCK_MODE || !stripe || !elements) {
        console.log('[BookingModal] Running in MOCK mode - using mock payment method');
        setProcessingStep('Processing mock payment...');
        paymentMethodId = 'pm_mock_test_' + Date.now();
      } else {
        // Real Stripe mode
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          onError('Card element not found. Please refresh the page.');
          return;
        }

        setProcessingStep('Creating payment method...');

        // Step 1: Create payment method
        const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
          billing_details: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            address: {
              line1: formData.address.line1,
              city: formData.address.city,
              state: formData.address.state,
              postal_code: formData.address.postal_code,
              country: formData.address.country,
            },
          },
        });

        if (paymentMethodError) {
          throw new Error(paymentMethodError.message);
        }

        if (!paymentMethod) {
          throw new Error('Failed to create payment method');
        }

        paymentMethodId = paymentMethod.id;
      }

      // Step 2: Book trip with payment method
      setProcessingStep('Processing payment and booking...');

      const bookingRequest: BookingRequest = {
        tripOptionId: tripOption.id,
        paymentInfo: {
          paymentMethodId,
          amount: tripOption.totalCost,
          currency: 'USD',
          billingDetails: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            address: formData.address,
          },
        },
        userContact: {
          email: formData.email,
          phone: formData.phone,
        },
      };

      const response = await bookTrip(bookingRequest);

      if (response.success) {
        onSuccess(response);
      } else {
        throw new Error(response.error || 'Booking failed');
      }
    } catch (error) {
      console.error('Booking error:', error);
      onError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const updateField = (field: keyof BookingFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateAddressField = (field: keyof BookingFormData['address'], value: string) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };

  const isFormValid = () => {
    return (
      formData.firstName.trim() !== '' &&
      formData.lastName.trim() !== '' &&
      formData.email.includes('@') &&
      formData.address.line1.trim() !== '' &&
      formData.address.city.trim() !== '' &&
      formData.address.state.trim() !== '' &&
      formData.address.postal_code.trim() !== ''
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Traveler Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Traveler Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name *
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            placeholder="john@example.com"
            required
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            placeholder="+1 (555) 123-4567"
          />
        </div>
      </div>

      {/* Billing Address */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing Address</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Street Address *
            </label>
            <input
              type="text"
              value={formData.address.line1}
              onChange={(e) => updateAddressField('line1', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              placeholder="123 Main St"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input
                type="text"
                value={formData.address.city}
                onChange={(e) => updateAddressField('city', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State *
              </label>
              <input
                type="text"
                value={formData.address.state}
                onChange={(e) => updateAddressField('state', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="CA"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Postal Code *
              </label>
              <input
                type="text"
                value={formData.address.postal_code}
                onChange={(e) => updateAddressField('postal_code', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country *
              </label>
              <select
                value={formData.address.country}
                onChange={(e) => updateAddressField('country', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                required
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
                <option value="AU">Australia</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Details
          </label>
          <div className="bg-white p-3 rounded border border-gray-300">
            <CardElement options={CARD_ELEMENT_OPTIONS} />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Your payment is secured by Stripe. We never store your card details.
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isProcessing || !stripe || !isFormValid()}
          className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              {processingStep || 'Processing...'}
            </span>
          ) : (
            `Pay ${formatCurrency(tripOption.totalCost)}`
          )}
        </button>
      </div>

      {/* Test Mode Notice */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs text-yellow-800">
            <strong>Test Mode:</strong> Use card <code>4242 4242 4242 4242</code> with any future date and CVC.
          </p>
        </div>
      )}
    </form>
  );
}

export default function BookingModal({ tripOption, isOpen, onClose }: BookingModalProps) {
  const router = useRouter();
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingResponse, setBookingResponse] = useState<BookingResponse | null>(null);

  const handleSuccess = (response: BookingResponse) => {
    setBookingSuccess(true);
    setBookingResponse(response);

    // Redirect to confirmation page after 2 seconds
    setTimeout(() => {
      if (response.payment?.paymentIntentId) {
        router.push(`/booking/confirmation?paymentIntentId=${response.payment.paymentIntentId}`);
      }
    }, 2000);
  };

  const handleError = (error: string) => {
    setBookingError(error);
  };

  const handleClose = () => {
    if (!bookingSuccess) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Close Button */}
          {!bookingSuccess && (
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          <div className="p-8">
            {/* Success State */}
            {bookingSuccess && bookingResponse && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Booking Confirmed!
                </h2>
                <p className="text-gray-600 mb-4">
                  Your trip to {tripOption.destination} has been successfully booked.
                </p>
                <p className="text-sm text-gray-500">
                  Redirecting to confirmation page...
                </p>
              </div>
            )}

            {/* Error State */}
            {bookingError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-semibold text-red-900 mb-1">Booking Failed</h4>
                    <p className="text-sm text-red-700">{bookingError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Booking Form */}
            {!bookingSuccess && (
              <>
                {/* Header */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Complete Your Booking
                  </h2>
                  <p className="text-gray-600">
                    Book your complete trip to {tripOption.destination}
                  </p>
                </div>

                {/* Booking Summary */}
                <div className="bg-purple-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Booking Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">✈️ Flight ({tripOption.flight.provider})</span>
                      <span className="font-medium">{formatCurrency(tripOption.flight.price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">🏨 Hotel ({tripOption.hotel.name})</span>
                      <span className="font-medium">{formatCurrency(tripOption.hotel.priceTotal)}</span>
                    </div>
                    {tripOption.activities && tripOption.activities.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">🎭 Activities ({tripOption.activities.length})</span>
                        <span className="font-medium">
                          {formatCurrency(tripOption.activities.reduce((sum, a) => sum + a.price, 0))}
                        </span>
                      </div>
                    )}
                    <div className="border-t border-purple-200 pt-2 mt-2 flex justify-between">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="font-bold text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {formatCurrency(tripOption.totalCost)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stripe Elements Form */}
                <Elements stripe={stripePromise}>
                  <BookingForm
                    tripOption={tripOption}
                    onSuccess={handleSuccess}
                    onError={handleError}
                  />
                </Elements>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
