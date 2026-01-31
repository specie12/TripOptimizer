/**
 * Flight Integration
 *
 * Abstraction layer for flight search APIs.
 * Uses Amadeus API for real flight data.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  FlightIntegrationProvider,
  FlightSearchCriteria,
  FlightResult,
  IntegrationResponse,
  IntegrationStatus,
} from '../types/integration.types';
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
    return !!process.env.AMADEUS_API_KEY && !!process.env.AMADEUS_API_SECRET;
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
        maxPrice: criteria.maxPrice ? Math.floor(criteria.maxPrice / 100) : undefined, // Convert cents to dollars for Amadeus
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
      throw error;
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
// FLIGHT INTEGRATION SERVICE
// =============================================================================

/**
 * Flight integration service with provider fallback
 */
class FlightIntegrationService {
  private providers: FlightIntegrationProvider[];
  private currentProvider: FlightIntegrationProvider;

  constructor() {
    this.providers = [
      new AmadeusFlightProvider(),
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
        const response = await this.currentProvider.search(criteria);
        if (response.data.length > 0) {
          return response;
        }
        console.log(`[Flights] ${this.currentProvider.name} returned 0 results, trying fallback...`);
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
          if (response.data.length > 0) {
            return response;
          }
        } catch (error) {
          console.error(`Flight provider ${provider.name} failed:`, error);
        }
      }
    }

    // All providers returned empty or failed
    return {
      data: [],
      provider: 'none',
      status: IntegrationStatus.ERROR,
      cached: false,
      timestamp: new Date(),
      error: 'All flight providers returned no results. Ensure AMADEUS_API_KEY and AMADEUS_API_SECRET are configured.',
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
