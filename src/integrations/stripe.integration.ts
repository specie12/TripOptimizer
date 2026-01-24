/**
 * Stripe Payment Integration
 *
 * Handles payment processing for trip bookings.
 * Supports:
 * - Creating payment intents
 * - Confirming payments
 * - Processing refunds
 * - Handling webhooks
 *
 * Environment Variables:
 * - STRIPE_SECRET_KEY: Stripe secret key
 * - STRIPE_WEBHOOK_SECRET: Stripe webhook secret
 */

import Stripe from 'stripe';
import { PaymentInfo, PaymentResult, RefundResult } from '../types/booking.types';

// Initialize Stripe client
let stripe: Stripe | null = null;

const MOCK_MODE = process.env.MOCK_STRIPE === 'true';

if (!MOCK_MODE && process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia', // Use latest API version
  });
}

// ============================================
// PAYMENT CREATION
// ============================================

/**
 * Create a payment intent for a trip booking
 *
 * @param paymentInfo - Payment information including amount and billing details
 * @returns Payment result with payment intent ID
 */
export async function createPaymentIntent(
  paymentInfo: PaymentInfo
): Promise<PaymentResult> {
  if (MOCK_MODE || !stripe) {
    return createMockPaymentIntent(paymentInfo);
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: paymentInfo.amount,
      currency: paymentInfo.currency.toLowerCase(),
      payment_method: paymentInfo.paymentMethodId,
      confirm: true, // Automatically confirm the payment
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      metadata: {
        billingEmail: paymentInfo.billingDetails.email,
        billingName: paymentInfo.billingDetails.name,
      },
      receipt_email: paymentInfo.billingDetails.email,
    });

    if (paymentIntent.status === 'succeeded') {
      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        chargeId: paymentIntent.latest_charge as string,
      };
    } else {
      return {
        success: false,
        error: `Payment failed with status: ${paymentIntent.status}`,
      };
    }
  } catch (error) {
    console.error('Stripe payment error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Confirm an existing payment intent
 *
 * @param paymentIntentId - Stripe payment intent ID
 * @returns Payment result
 */
export async function confirmPaymentIntent(
  paymentIntentId: string
): Promise<PaymentResult> {
  if (MOCK_MODE || !stripe) {
    return {
      success: true,
      paymentIntentId,
      chargeId: `ch_mock_${paymentIntentId}`,
    };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        chargeId: paymentIntent.latest_charge as string,
      };
    } else {
      return {
        success: false,
        error: `Payment confirmation failed with status: ${paymentIntent.status}`,
      };
    }
  } catch (error) {
    console.error('Stripe payment confirmation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// REFUND PROCESSING
// ============================================

/**
 * Process a full refund for a payment
 *
 * @param paymentIntentId - Stripe payment intent ID
 * @param reason - Optional refund reason
 * @returns Refund result
 */
export async function processRefund(
  paymentIntentId: string,
  reason?: string
): Promise<RefundResult> {
  if (MOCK_MODE || !stripe) {
    return createMockRefund(paymentIntentId);
  }

  try {
    // Get payment intent to find charge
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const chargeId = paymentIntent.latest_charge as string;

    if (!chargeId) {
      return {
        success: false,
        amount: 0,
        error: 'No charge found for payment intent',
      };
    }

    // Create refund
    const refund = await stripe.refunds.create({
      charge: chargeId,
      reason: reason === 'requested_by_customer' ? 'requested_by_customer' : undefined,
    });

    return {
      success: refund.status === 'succeeded',
      refundId: refund.id,
      amount: refund.amount,
    };
  } catch (error) {
    console.error('Stripe refund error:', error);
    return {
      success: false,
      amount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Process a partial refund
 *
 * @param paymentIntentId - Stripe payment intent ID
 * @param amount - Amount to refund in cents
 * @param reason - Optional refund reason
 * @returns Refund result
 */
export async function processPartialRefund(
  paymentIntentId: string,
  amount: number,
  reason?: string
): Promise<RefundResult> {
  if (MOCK_MODE || !stripe) {
    return {
      success: true,
      refundId: `re_mock_${paymentIntentId}`,
      amount,
    };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const chargeId = paymentIntent.latest_charge as string;

    if (!chargeId) {
      return {
        success: false,
        amount: 0,
        error: 'No charge found for payment intent',
      };
    }

    const refund = await stripe.refunds.create({
      charge: chargeId,
      amount,
      reason: reason === 'requested_by_customer' ? 'requested_by_customer' : undefined,
    });

    return {
      success: refund.status === 'succeeded',
      refundId: refund.id,
      amount: refund.amount,
    };
  } catch (error) {
    console.error('Stripe partial refund error:', error);
    return {
      success: false,
      amount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// WEBHOOK HANDLING
// ============================================

/**
 * Verify and construct Stripe webhook event
 *
 * @param payload - Raw webhook payload
 * @param signature - Stripe signature header
 * @returns Verified Stripe event
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event | null {
  if (MOCK_MODE || !stripe) {
    return null;
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return null;
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return null;
  }
}

// ============================================
// PAYMENT METHOD MANAGEMENT
// ============================================

/**
 * Retrieve payment method details
 *
 * @param paymentMethodId - Stripe payment method ID
 * @returns Payment method details or null
 */
export async function getPaymentMethod(
  paymentMethodId: string
): Promise<Stripe.PaymentMethod | null> {
  if (MOCK_MODE || !stripe) {
    return null;
  }

  try {
    return await stripe.paymentMethods.retrieve(paymentMethodId);
  } catch (error) {
    console.error('Error retrieving payment method:', error);
    return null;
  }
}

// ============================================
// MOCK IMPLEMENTATIONS
// ============================================

function createMockPaymentIntent(paymentInfo: PaymentInfo): PaymentResult {
  const mockPaymentIntentId = `pi_mock_${Date.now()}`;
  const mockChargeId = `ch_mock_${Date.now()}`;

  console.log('[MOCK STRIPE] Creating payment intent:', {
    amount: paymentInfo.amount,
    currency: paymentInfo.currency,
    email: paymentInfo.billingDetails.email,
  });

  return {
    success: true,
    paymentIntentId: mockPaymentIntentId,
    chargeId: mockChargeId,
  };
}

function createMockRefund(paymentIntentId: string): RefundResult {
  const mockRefundId = `re_mock_${Date.now()}`;

  console.log('[MOCK STRIPE] Processing refund for:', paymentIntentId);

  return {
    success: true,
    refundId: mockRefundId,
    amount: 100000, // Mock amount
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Convert amount from dollars to cents
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert amount from cents to dollars
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Format amount as currency string
 */
export function formatCurrency(cents: number, currency: string = 'USD'): string {
  const dollars = centsToDollars(cents);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(dollars);
}
