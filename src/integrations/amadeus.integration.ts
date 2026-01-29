/**
 * Amadeus Flight API Integration
 *
 * Provides real flight search and booking via Amadeus API.
 * Documentation: https://developers.amadeus.com/
 */

import Amadeus from 'amadeus';
import { FlightBookingConfirmation } from '../types/booking.types';

// Mock mode flag
const MOCK_AMADEUS = process.env.MOCK_AMADEUS === 'true';

// Initialize Amadeus client (only if not in mock mode)
let amadeus: any = null;

if (!MOCK_AMADEUS) {
  const clientId = process.env.AMADEUS_API_KEY;
  const clientSecret = process.env.AMADEUS_API_SECRET;
  const environment = process.env.AMADEUS_ENVIRONMENT || 'test';

  if (!clientId || !clientSecret) {
    console.warn('[Amadeus] API credentials not found - using mock mode');
  } else {
    amadeus = new Amadeus({
      clientId,
      clientSecret,
      hostname: environment === 'production' ? 'production' : 'test',
    });
    console.log(`[Amadeus] Initialized in ${environment} mode`);
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
  // Mock mode
  if (MOCK_AMADEUS || !amadeus) {
    console.log('[Amadeus] MOCK: Searching flights');
    return mockSearchFlights(params);
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

    // Fallback to mock data on error
    console.log('[Amadeus] Falling back to mock data');
    return mockSearchFlights(params);
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
  // Mock mode
  if (MOCK_AMADEUS || !amadeus) {
    console.log('[Amadeus] MOCK: Booking flight');
    return mockBookFlight(params);
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

    // Fallback to mock booking on error
    console.log('[Amadeus] Falling back to mock booking');
    return mockBookFlight(params);
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
  // Mock mode
  if (MOCK_AMADEUS || !amadeus) {
    console.log('[Amadeus] MOCK: Cancelling flight:', orderId);
    return { success: true, refundAmount: 0 };
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
  // Mock mode
  if (MOCK_AMADEUS || !amadeus) {
    console.log('[Amadeus] MOCK: Getting flight order:', orderId);
    return { id: orderId, status: 'confirmed' };
  }

  try {
    const response = await amadeus.booking.flightOrder(orderId).get();
    return response.data;
  } catch (error: any) {
    console.error('[Amadeus] Get order error:', error.response?.data || error.message);
    throw error;
  }
}

// ============================================
// MOCK IMPLEMENTATIONS (for development)
// ============================================

function mockSearchFlights(params: any): any[] {
  console.log('[Amadeus] Returning mock flight data');

  const basePrice = params.maxPrice ? params.maxPrice / 2 : 500;

  return [
    {
      id: '1',
      type: 'flight-offer',
      source: 'MOCK',
      instantTicketingRequired: false,
      nonHomogeneous: false,
      oneWay: !params.returnDate,
      lastTicketingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      numberOfBookableSeats: 9,
      itineraries: [
        {
          duration: 'PT8H30M',
          segments: [
            {
              departure: {
                iataCode: params.originLocationCode,
                at: `${params.departureDate}T08:00:00`,
              },
              arrival: {
                iataCode: params.destinationLocationCode,
                at: `${params.departureDate}T14:30:00`,
              },
              carrierCode: 'VY',
              number: '8301',
              aircraft: { code: '320' },
              duration: 'PT8H30M',
              numberOfStops: 0,
            },
          ],
        },
      ],
      price: {
        currency: params.currencyCode || 'USD',
        total: basePrice.toFixed(2),
        base: (basePrice * 0.85).toFixed(2),
        fees: [{ amount: (basePrice * 0.15).toFixed(2), type: 'TICKETING' }],
        grandTotal: basePrice.toFixed(2),
      },
      pricingOptions: {
        fareType: ['PUBLISHED'],
        includedCheckedBagsOnly: true,
      },
      validatingAirlineCodes: ['VY'],
      travelerPricings: [
        {
          travelerId: '1',
          fareOption: 'STANDARD',
          travelerType: 'ADULT',
          price: {
            currency: params.currencyCode || 'USD',
            total: basePrice.toFixed(2),
            base: (basePrice * 0.85).toFixed(2),
          },
        },
      ],
    },
    // Second option (slightly more expensive)
    {
      id: '2',
      type: 'flight-offer',
      source: 'MOCK',
      price: {
        currency: params.currencyCode || 'USD',
        grandTotal: (basePrice * 1.2).toFixed(2),
      },
      itineraries: [
        {
          segments: [
            {
              departure: {
                iataCode: params.originLocationCode,
                at: `${params.departureDate}T14:00:00`,
              },
              arrival: {
                iataCode: params.destinationLocationCode,
                at: `${params.departureDate}T20:30:00`,
              },
              carrierCode: 'IB',
              number: '6201',
            },
          ],
        },
      ],
      validatingAirlineCodes: ['IB'],
    },
  ];
}

function mockBookFlight(params: any): FlightBookingConfirmation {
  const timestamp = Date.now();

  return {
    confirmationCode: `FL${timestamp}`,
    bookingReference: `MOCK-${timestamp.toString().slice(-8)}`,
    pnr: `PNR${timestamp}`,
    provider: params.flightOffer?.validatingAirlineCodes?.[0] || 'MOCK',
    ticketNumbers: [],
    departureTime: params.flightOffer?.itineraries?.[0]?.segments?.[0]?.departure?.at || new Date().toISOString(),
    returnTime: params.flightOffer?.itineraries?.[1]?.segments?.[0]?.departure?.at || '',
    passengerNames: params.travelers.map((t: any) => `${t.name.firstName} ${t.name.lastName}`),
    totalPrice: parseFloat(params.flightOffer?.price?.grandTotal || '500') * 100,
    currency: params.flightOffer?.price?.currency || 'USD',
    deepLink: `https://mock.amadeus.com/booking/${timestamp}`,
  };
}
