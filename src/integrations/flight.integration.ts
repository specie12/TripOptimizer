/**
 * Flight Integration
 *
 * Abstraction layer for flight search APIs.
 * Supports mock provider for development and real providers for production.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  FlightIntegrationProvider,
  FlightSearchCriteria,
  FlightResult,
  IntegrationResponse,
  IntegrationStatus,
} from '../types/integration.types';
import { getDestination, MockFlight } from '../config/destinations';
import { cacheService } from '../services/cache.service';
import { searchFlights as amadeusSearchFlights, getAirportCode as amadeusGetAirportCode } from './amadeus.integration';
import { getCachedAirportCode, cacheAirportCode } from '../services/airport-cache.service';

// =============================================================================
// AMADEUS FLIGHT PROVIDER (Real API)
// =============================================================================

/**
 * Amadeus flight provider using real Amadeus API
 */
class AmadeusFlightProvider implements FlightIntegrationProvider {
  name = 'AmadeusFlightProvider';

  async isAvailable(): Promise<boolean> {
    // Check if Amadeus is configured (not in mock mode)
    return process.env.MOCK_AMADEUS !== 'true' &&
           !!process.env.AMADEUS_API_KEY &&
           !!process.env.AMADEUS_API_SECRET;
  }

  async search(criteria: FlightSearchCriteria): Promise<IntegrationResponse<FlightResult[]>> {
    console.log('[AmadeusProvider] Searching flights via Amadeus API');

    try {
      // Convert our criteria to Amadeus format
      const amadeusResults = await amadeusSearchFlights({
        originLocationCode: await this.getAirportCode(criteria.origin),
        destinationLocationCode: await this.getAirportCode(criteria.destination),
        departureDate: criteria.departureDate.split('T')[0], // YYYY-MM-DD
        returnDate: criteria.returnDate ? criteria.returnDate.split('T')[0] : undefined,
        adults: 1, // TODO: Get from criteria
        maxPrice: criteria.maxPrice,
        currencyCode: 'USD',
      });

      // Transform Amadeus results to our FlightResult format
      const flights: FlightResult[] = amadeusResults.map((flight: any) => {
        const outboundSegments = flight.itineraries?.[0]?.segments || [];
        const inboundSegments = flight.itineraries?.[1]?.segments || [];
        const lastOutboundSegment = outboundSegments[outboundSegments.length - 1];

        return {
          id: flight.id || uuidv4(),
          provider: flight.validatingAirlineCodes?.[0] || 'Unknown',
          price: parseFloat(flight.price?.grandTotal || '0') * 100, // Convert to cents
          departureTime: outboundSegments[0]?.departure?.at || new Date().toISOString(),
          arrivalTime: lastOutboundSegment?.arrival?.at || new Date().toISOString(),
          returnDepartureTime: inboundSegments[0]?.departure?.at || undefined,
          returnTime: inboundSegments.length > 0 && inboundSegments[inboundSegments.length - 1]?.arrival?.at
            ? inboundSegments[inboundSegments.length - 1].arrival.at
            : undefined,
          stops: outboundSegments.length - 1,
          deepLink: `https://www.amadeus.com/booking/${flight.id}`,
        };
      });

      console.log(`[AmadeusProvider] Found ${flights.length} real flights`);

      return {
        data: flights,
        provider: this.name,
        status: IntegrationStatus.AVAILABLE,
        cached: false,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('[AmadeusProvider] Search failed:', error);
      throw error; // Let the service try fallback providers
    }
  }

  /**
   * Convert city name to airport code using API-first approach with database caching
   * Resolution order: Database cache → Amadeus API → Emergency fallback → Error
   */
  private async getAirportCode(city: string): Promise<string> {
    console.log(`[FlightIntegration] Resolving airport code for: ${city}`);

    // Emergency fallback ONLY - used if Amadeus API is completely down
    // These 10 cities cover ~40% of global travel volume
    const EMERGENCY_AIRPORT_CODES: Record<string, string> = {
      'New York': 'JFK',
      'London': 'LHR',
      'Paris': 'CDG',
      'Tokyo': 'NRT',
      'Dubai': 'DXB',
      'Singapore': 'SIN',
      'Sydney': 'SYD',
      'Toronto': 'YYZ',
      'Los Angeles': 'LAX',
      'Hong Kong': 'HKG',
    };

    // Step 1: Check database cache (fastest - no API call)
    const cachedCode = await getCachedAirportCode(city);
    if (cachedCode) {
      console.log(`[FlightIntegration] ✓ ${city} → ${cachedCode} (cached)`);
      return cachedCode;
    }

    // Step 2: Try Amadeus Location API (PRIMARY method)
    try {
      const amadeusCode = await amadeusGetAirportCode(city);
      if (amadeusCode) {
        console.log(`[FlightIntegration] ✓ ${city} → ${amadeusCode} (Amadeus API)`);
        // Cache for future requests
        await cacheAirportCode(city, amadeusCode, 'amadeus');
        return amadeusCode;
      }
    } catch (error: any) {
      console.warn(`[FlightIntegration] Amadeus API error for ${city}:`, error.message);
    }

    // Step 3: Emergency fallback (only if Amadeus API failed)
    if (EMERGENCY_AIRPORT_CODES[city]) {
      const code = EMERGENCY_AIRPORT_CODES[city];
      console.log(`[FlightIntegration] ⚠️  ${city} → ${code} (emergency fallback)`);
      // Cache it so we don't keep hitting this path
      await cacheAirportCode(city, code, 'manual');
      return code;
    }

    // Step 4: Complete failure - throw descriptive error
    console.error(`[FlightIntegration] ✗ Could not resolve airport code for: ${city}`);
    throw new Error(
      `Unable to find airport for "${city}". ` +
      `Please try: (1) A nearby major city (2) Full city name (3) Airport code directly (e.g., "YUL" for Montreal)`
    );
  }
}

// =============================================================================
// MOCK FLIGHT PROVIDER
// =============================================================================

/**
 * Mock flight provider using static destination data
 */
class MockFlightProvider implements FlightIntegrationProvider {
  name = 'MockFlightProvider';

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async search(criteria: FlightSearchCriteria): Promise<IntegrationResponse<FlightResult[]>> {
    // Check cache first
    const cacheKey = {
      origin: criteria.origin,
      destination: criteria.destination,
      departureDate: criteria.departureDate,
      returnDate: criteria.returnDate,
    };
    const cached = cacheService.get<FlightResult[]>('flights', cacheKey);

    if (cached) {
      return {
        data: cached,
        provider: this.name,
        status: IntegrationStatus.MOCK,
        cached: true,
        timestamp: new Date(),
      };
    }

    // Get destination data
    const destData = getDestination(criteria.destination);
    if (!destData) {
      return {
        data: [],
        provider: this.name,
        status: IntegrationStatus.MOCK,
        cached: false,
        timestamp: new Date(),
        error: `Destination ${criteria.destination} not found`,
      };
    }

    // Convert mock flights to integration format
    const results: FlightResult[] = destData.flights
      .map((flight) => this.transformMockFlight(flight, criteria))
      .filter((flight) => {
        // Filter by max price if specified
        if (criteria.maxPrice && flight.price > criteria.maxPrice) {
          return false;
        }
        // Filter by max stops if specified
        if (criteria.maxStops !== undefined && flight.stops !== undefined) {
          return flight.stops <= criteria.maxStops;
        }
        return true;
      })
      .slice(0, criteria.maxResults ?? 10);

    // Cache the results
    cacheService.set('flights', cacheKey, results);

    return {
      data: results,
      provider: this.name,
      status: IntegrationStatus.MOCK,
      cached: false,
      timestamp: new Date(),
    };
  }

  /**
   * Transform mock flight data to integration format
   */
  private transformMockFlight(
    mockFlight: MockFlight,
    criteria: FlightSearchCriteria
  ): FlightResult {
    const departureDate = new Date(criteria.departureDate);
    const returnDate = new Date(criteria.returnDate);

    // Add some randomness to departure/arrival times
    const departureHour = 6 + Math.floor(Math.random() * 12); // 6 AM - 6 PM
    const departureDT = new Date(departureDate);
    departureDT.setHours(departureHour, 0, 0, 0);

    // Calculate arrival time based on flight duration
    const arrivalDT = new Date(departureDT);
    arrivalDT.setHours(arrivalDT.getHours() + mockFlight.flightDuration);

    // Return flight times
    const returnHour = 6 + Math.floor(Math.random() * 12);
    const returnDepartureDT = new Date(returnDate);
    returnDepartureDT.setHours(returnHour, 0, 0, 0);

    const returnArrivalDT = new Date(returnDepartureDT);
    returnArrivalDT.setHours(returnArrivalDT.getHours() + mockFlight.flightDuration);

    // Random stops (0-2)
    const stops = Math.random() < 0.7 ? 0 : Math.random() < 0.5 ? 1 : 2;

    return {
      id: uuidv4(),
      provider: mockFlight.provider,
      price: mockFlight.basePrice,
      departureTime: departureDT.toISOString(),
      arrivalTime: arrivalDT.toISOString(),
      returnDepartureTime: returnDepartureDT.toISOString(),
      returnTime: returnArrivalDT.toISOString(),
      duration: Math.floor(mockFlight.flightDuration * 60), // Convert to minutes
      stops,
      deepLink: `https://flights.example.com/${criteria.origin}-${criteria.destination}?provider=${mockFlight.provider}`,
    };
  }
}

// =============================================================================
// FLIGHT INTEGRATION SERVICE
// =============================================================================

/**
 * Flight integration service with provider fallback
 */
class FlightIntegrationService {
  private providers: FlightIntegrationProvider[];
  private currentProvider: FlightIntegrationProvider;

  constructor() {
    // Initialize with Amadeus provider first, then mock as fallback
    this.providers = [
      new AmadeusFlightProvider(),  // Try real API first
      new MockFlightProvider(),      // Fallback to mock
    ];
    this.currentProvider = this.providers[0];
  }

  /**
   * Search for flights using current provider with fallback
   */
  async search(criteria: FlightSearchCriteria): Promise<IntegrationResponse<FlightResult[]>> {
    // Try current provider first
    if (await this.currentProvider.isAvailable()) {
      try {
        return await this.currentProvider.search(criteria);
      } catch (error) {
        console.error(`Flight provider ${this.currentProvider.name} failed:`, error);
      }
    }

    // Try fallback providers
    for (const provider of this.providers) {
      if (provider === this.currentProvider) continue;

      if (await provider.isAvailable()) {
        try {
          console.log(`Falling back to flight provider: ${provider.name}`);
          const response = await provider.search(criteria);
          this.currentProvider = provider; // Switch to working provider
          return response;
        } catch (error) {
          console.error(`Flight provider ${provider.name} failed:`, error);
        }
      }
    }

    // All providers failed
    return {
      data: [],
      provider: 'none',
      status: IntegrationStatus.ERROR,
      cached: false,
      timestamp: new Date(),
      error: 'All flight providers unavailable',
    };
  }

  /**
   * Get current provider name
   */
  getProviderName(): string {
    return this.currentProvider.name;
  }

  /**
   * Add a new provider
   */
  addProvider(provider: FlightIntegrationProvider): void {
    this.providers.push(provider);
  }
}

// Singleton instance
export const flightIntegration = new FlightIntegrationService();
