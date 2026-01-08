/**
 * Lightweight Event Tracking
 *
 * Tracks only specific user interactions:
 * - Viewing a trip option
 * - Expanding "Why this works"
 * - Clicking booking links
 *
 * For MVP, events are logged to console.
 * In production, these would be sent to a backend endpoint.
 */

export type TrackingEvent =
  | 'VIEW_TRIP_OPTION'
  | 'EXPAND_EXPLANATION'
  | 'CLICK_BOOK_FLIGHT'
  | 'CLICK_BOOK_HOTEL'
  | 'VIEW_TRIP_DETAILS';

interface TrackingPayload {
  event: TrackingEvent;
  tripOptionId?: string;
  destination?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/**
 * Track a user interaction event
 */
export function trackEvent(
  event: TrackingEvent,
  data?: {
    tripOptionId?: string;
    destination?: string;
    metadata?: Record<string, unknown>;
  }
): void {
  const payload: TrackingPayload = {
    event,
    tripOptionId: data?.tripOptionId,
    destination: data?.destination,
    timestamp: new Date().toISOString(),
    metadata: data?.metadata,
  };

  // For MVP: log to console
  // In production: send to /api/tracking endpoint
  if (process.env.NODE_ENV === 'development') {
    console.log('[Tracking]', payload);
  }

  // Future: send to backend
  // fetch('/api/tracking', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(payload),
  // });
}

/**
 * Track when a trip option card comes into view
 */
export function trackTripView(tripOptionId: string, destination: string): void {
  trackEvent('VIEW_TRIP_OPTION', { tripOptionId, destination });
}

/**
 * Track when user expands "Why this works" section
 */
export function trackExpandExplanation(
  tripOptionId: string,
  destination: string
): void {
  trackEvent('EXPAND_EXPLANATION', { tripOptionId, destination });
}

/**
 * Track when user clicks "Book flight" button
 */
export function trackBookFlightClick(
  tripOptionId: string,
  destination: string,
  provider: string
): void {
  trackEvent('CLICK_BOOK_FLIGHT', {
    tripOptionId,
    destination,
    metadata: { provider },
  });
}

/**
 * Track when user clicks "Book hotel" button
 */
export function trackBookHotelClick(
  tripOptionId: string,
  destination: string,
  hotelName: string
): void {
  trackEvent('CLICK_BOOK_HOTEL', {
    tripOptionId,
    destination,
    metadata: { hotelName },
  });
}

/**
 * Track when user views trip details
 */
export function trackViewDetails(
  tripOptionId: string,
  destination: string
): void {
  trackEvent('VIEW_TRIP_DETAILS', { tripOptionId, destination });
}
