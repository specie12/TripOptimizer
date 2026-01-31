/**
 * Amadeus Flight API Integration
 *
 * Provides real flight search and booking via Amadeus API.
 * Documentation: https://developers.amadeus.com/
 */

// @ts-ignore - amadeus package doesn't have TypeScript definitions
import Amadeus from 'amadeus';
import { FlightBookingConfirmation } from '../types/booking.types';

// Initialize Amadeus client
let amadeus: any = null;

const clientId = process.env.AMADEUS_API_KEY;
const clientSecret = process.env.AMADEUS_API_SECRET;
const environment = process.env.AMADEUS_ENVIRONMENT || 'test';

if (!clientId || !clientSecret) {
  console.warn('[Amadeus] API credentials not found - flight search will not be available');
} else {
  amadeus = new Amadeus({
    clientId,
    clientSecret,
    hostname: environment === 'production' ? 'production' : 'test',
  });
  console.log(`[Amadeus] Initialized in ${environment} mode`);
}

/**
 * Get airport code from city name using Amadeus Location API
 * Includes retry logic for transient errors and rate limiting
 */
export async function getAirportCode(
  cityName: string,
  retryCount = 0
): Promise<string | null> {
  if (!amadeus) {
    throw new Error('Amadeus not configured — set AMADEUS_API_KEY and AMADEUS_API_SECRET');
  }

  try {
    const response = await amadeus.referenceData.locations.get({
      keyword: cityName,
      subType: 'CITY,AIRPORT',
    });

    if (response.data && response.data.length > 0) {
      // Get the first result's IATA code
      const location = response.data[0];
      const iataCode = location.iataCode;

      console.log(`[Amadeus] Resolved ${cityName} → ${iataCode} (${location.name})`);
      return iataCode;
    }

    console.warn(`[Amadeus] No airport found for ${cityName}`);
    return null;
  } catch (error: any) {
    // Retry on rate limit or transient server errors
    const statusCode = error.response?.statusCode || error.response?.status;
    if (retryCount < 2 && (statusCode === 429 || (statusCode >= 500 && statusCode < 600))) {
      const waitTime = 1000 * (retryCount + 1); // Exponential backoff: 1s, 2s
      console.log(`[Amadeus] Retrying location search for ${cityName} (attempt ${retryCount + 1}) after ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return getAirportCode(cityName, retryCount + 1);
    }

    console.error(`[Amadeus] Location search error for ${cityName}:`, error.message);
    return null;
  }
}

/**
 * Search for flights
 */
export async function searchFlights(params: {
  originLocationCode: string; // e.g., "NYC"
  destinationLocationCode: string; // e.g., "BCN"
  departureDate: string; // YYYY-MM-DD
  returnDate?: string; // YYYY-MM-DD (optional for one-way)
  adults: number;
  maxPrice?: number;
  currencyCode?: string;
}): Promise<any[]> {
  if (!amadeus) {
    throw new Error('Amadeus not configured — set AMADEUS_API_KEY and AMADEUS_API_SECRET');
  }

  try {
    const searchParams: any = {
      originLocationCode: params.originLocationCode,
      destinationLocationCode: params.destinationLocationCode,
      departureDate: params.departureDate,
      adults: params.adults,
      currencyCode: params.currencyCode || 'USD',
      max: 50, // Limit results
      nonStop: false, // Allow connecting flights
    };

    // Add return date if provided
    if (params.returnDate) {
      searchParams.returnDate = params.returnDate;
    }

    console.log(`[Amadeus] Searching flights: ${params.originLocationCode} → ${params.destinationLocationCode} on ${params.departureDate}`);
    const response = await amadeus.shopping.flightOffersSearch.get(searchParams);

    // Filter by max price if provided
    let flights = response.data || [];
    if (params.maxPrice) {
      flights = flights.filter((flight: any) => {
        const price = parseFloat(flight.price?.grandTotal || '0');
        return price <= params.maxPrice!;
      });
    }

    console.log(`[Amadeus] Found ${flights.length} flight offers`);
    return flights;
  } catch (error: any) {
    console.error('[Amadeus] Flight search error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Book a flight
 */
export async function bookFlight(params: {
  flightOffer: any; // The complete flight offer from search results
  travelers: Array<{
    id: string;
    dateOfBirth: string; // YYYY-MM-DD
    name: {
      firstName: string;
      lastName: string;
    };
    gender: 'MALE' | 'FEMALE';
    contact: {
      emailAddress: string;
      phones: Array<{
        deviceType: 'MOBILE';
        countryCallingCode: string;
        number: string;
      }>;
    };
  }>;
}): Promise<FlightBookingConfirmation> {
  if (!amadeus) {
    throw new Error('Amadeus not configured — set AMADEUS_API_KEY and AMADEUS_API_SECRET');
  }

  try {
    // Price confirmation before booking (required by Amadeus)
    const pricingResponse = await amadeus.shopping.flightOffers.pricing.post({
      data: {
        type: 'flight-offers-pricing',
        flightOffers: [params.flightOffer],
      },
    });

    const pricedOffer = pricingResponse.data.flightOffers[0];

    // Create flight order
    const response = await amadeus.booking.flightOrders.post({
      data: {
        type: 'flight-order',
        flightOffers: [pricedOffer],
        travelers: params.travelers,
      },
    });

    const order = response.data;

    // Convert Amadeus response to our FlightBookingConfirmation format
    const confirmation: FlightBookingConfirmation = {
      confirmationCode: order.id,
      bookingReference: order.associatedRecords?.[0]?.reference || `REF-${order.id.slice(0, 8)}`,
      pnr: order.associatedRecords?.[0]?.originSystemCode || order.id,
      provider: order.flightOffers[0].validatingAirlineCodes[0],
      ticketNumbers: order.ticketNumbers || [],
      departureTime: order.flightOffers[0].itineraries[0].segments[0].departure.at,
      returnTime: order.flightOffers[0].itineraries[1]?.segments[0]?.departure.at || '',
      passengerNames: params.travelers.map(t => `${t.name.firstName} ${t.name.lastName}`),
      totalPrice: parseFloat(order.flightOffers[0].price.grandTotal) * 100, // Convert to cents
      currency: order.flightOffers[0].price.currency,
      deepLink: `https://www.amadeus.com/manage-booking/${order.id}`,
    };

    console.log('[Amadeus] Flight booked successfully:', confirmation.confirmationCode);
    return confirmation;
  } catch (error: any) {
    console.error('[Amadeus] Booking error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Cancel a flight booking
 */
export async function cancelFlight(orderId: string): Promise<{
  success: boolean;
  refundAmount?: number;
  error?: string;
}> {
  if (!amadeus) {
    throw new Error('Amadeus not configured — set AMADEUS_API_KEY and AMADEUS_API_SECRET');
  }

  try {
    await amadeus.booking.flightOrder(orderId).delete();
    console.log('[Amadeus] Flight cancelled successfully:', orderId);
    return { success: true };
  } catch (error: any) {
    console.error('[Amadeus] Cancellation error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.message || 'Failed to cancel flight',
    };
  }
}

/**
 * Get flight booking details
 */
export async function getFlightOrder(orderId: string): Promise<any> {
  if (!amadeus) {
    throw new Error('Amadeus not configured — set AMADEUS_API_KEY and AMADEUS_API_SECRET');
  }

  try {
    const response = await amadeus.booking.flightOrder(orderId).get();
    return response.data;
  } catch (error: any) {
    console.error('[Amadeus] Get order error:', error.response?.data || error.message);
    throw error;
  }
}
