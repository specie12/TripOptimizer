/**
 * Monetization-Specific Tracking
 *
 * Separate from core tracking to maintain isolation.
 */

export type MonetizationEvent =
  | 'PRO_UPSELL_VIEW'
  | 'PRO_UPSELL_CLICK'
  | 'PRO_UPSELL_DISMISS';

interface MonetizationPayload {
  event: MonetizationEvent;
  source?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/**
 * Track monetization event
 */
function trackMonetizationEvent(
  event: MonetizationEvent,
  data?: { source?: string; metadata?: Record<string, unknown> }
): void {
  const payload: MonetizationPayload = {
    event,
    source: data?.source,
    timestamp: new Date().toISOString(),
    metadata: data?.metadata,
  };

  if (process.env.NODE_ENV === 'development') {
    console.log('[Monetization Tracking]', payload);
  }

  // Future: Send to analytics endpoint
}

export function trackProUpsellView(source: string): void {
  trackMonetizationEvent('PRO_UPSELL_VIEW', { source });
}

export function trackProUpsellClick(source: string): void {
  trackMonetizationEvent('PRO_UPSELL_CLICK', { source });
}

export function trackProUpsellDismiss(source: string): void {
  trackMonetizationEvent('PRO_UPSELL_DISMISS', { source });
}
