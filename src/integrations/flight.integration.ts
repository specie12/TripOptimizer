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
    // Initialize with mock provider
    // In production, add real providers here
    this.providers = [new MockFlightProvider()];
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
