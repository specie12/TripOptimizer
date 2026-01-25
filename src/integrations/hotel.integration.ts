/**
 * Hotel Integration
 *
 * Abstraction layer for hotel search APIs.
 * Supports mock provider for development and real providers for production.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  HotelIntegrationProvider,
  HotelSearchCriteria,
  HotelResult,
  IntegrationResponse,
  IntegrationStatus,
} from '../types/integration.types';
import { getDestination, MockHotel } from '../config/destinations';
import { cacheService } from '../services/cache.service';

// =============================================================================
// MOCK HOTEL PROVIDER
// =============================================================================

/**
 * Mock hotel provider using static destination data
 */
class MockHotelProvider implements HotelIntegrationProvider {
  name = 'MockHotelProvider';

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async search(criteria: HotelSearchCriteria): Promise<IntegrationResponse<HotelResult[]>> {
    // Check cache first
    const cacheKey = {
      destination: criteria.destination,
      checkInDate: criteria.checkInDate,
      checkOutDate: criteria.checkOutDate,
      numberOfNights: criteria.numberOfNights,
    };
    const cached = cacheService.get<HotelResult[]>('hotels', cacheKey);

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

    // Convert mock hotels to integration format
    const results: HotelResult[] = destData.hotels
      .map((hotel) => this.transformMockHotel(hotel, criteria))
      .filter((hotel) => {
        // Filter by max price if specified
        if (criteria.maxPrice && hotel.priceTotal > criteria.maxPrice) {
          return false;
        }
        // Filter by min rating if specified
        if (criteria.minRating && hotel.rating !== null && hotel.rating < criteria.minRating) {
          return false;
        }
        return true;
      })
      .slice(0, criteria.maxResults ?? 10);

    // Cache the results
    cacheService.set('hotels', cacheKey, results);

    return {
      data: results,
      provider: this.name,
      status: IntegrationStatus.MOCK,
      cached: false,
      timestamp: new Date(),
    };
  }

  /**
   * Transform mock hotel data to integration format
   */
  private transformMockHotel(mockHotel: MockHotel, criteria: HotelSearchCriteria): HotelResult {
    const priceTotal = mockHotel.pricePerNight * criteria.numberOfNights;

    // Generate random review count based on rating
    const reviewCount = mockHotel.rating
      ? Math.floor(Math.random() * 1000) + (mockHotel.rating * 200)
      : undefined;

    // Generate random amenities
    const amenitiesList = [
      'Free WiFi',
      'Air Conditioning',
      'Breakfast Included',
      'Gym',
      'Pool',
      'Parking',
      'Room Service',
      'Bar/Lounge',
      'Spa',
      'Restaurant',
    ];
    const numAmenities = Math.floor(Math.random() * 5) + 3; // 3-7 amenities
    const amenities = amenitiesList
      .sort(() => Math.random() - 0.5)
      .slice(0, numAmenities);

    return {
      id: uuidv4(),
      name: mockHotel.name,
      priceTotal,
      pricePerNight: mockHotel.pricePerNight,
      rating: mockHotel.rating,
      reviewCount,
      amenities,
      deepLink: `https://hotels.example.com/${criteria.destination}/${mockHotel.name.replace(/\s/g, '-').toLowerCase()}`,
    };
  }
}

// =============================================================================
// HOTEL INTEGRATION SERVICE
// =============================================================================

/**
 * Hotel integration service with provider fallback
 */
class HotelIntegrationService {
  private providers: HotelIntegrationProvider[];
  private currentProvider: HotelIntegrationProvider;

  constructor() {
    // Initialize with mock provider
    // In production, add real providers here
    this.providers = [new MockHotelProvider()];
    this.currentProvider = this.providers[0];
  }

  /**
   * Search for hotels using current provider with fallback
   */
  async search(criteria: HotelSearchCriteria): Promise<IntegrationResponse<HotelResult[]>> {
    // Try current provider first
    if (await this.currentProvider.isAvailable()) {
      try {
        return await this.currentProvider.search(criteria);
      } catch (error) {
        console.error(`Hotel provider ${this.currentProvider.name} failed:`, error);
      }
    }

    // Try fallback providers
    for (const provider of this.providers) {
      if (provider === this.currentProvider) continue;

      if (await provider.isAvailable()) {
        try {
          console.log(`Falling back to hotel provider: ${provider.name}`);
          const response = await provider.search(criteria);
          this.currentProvider = provider; // Switch to working provider
          return response;
        } catch (error) {
          console.error(`Hotel provider ${provider.name} failed:`, error);
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
      error: 'All hotel providers unavailable',
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
  addProvider(provider: HotelIntegrationProvider): void {
    this.providers.push(provider);
  }
}

// Singleton instance
export const hotelIntegration = new HotelIntegrationService();

// =============================================================================
// BOOKING FUNCTIONS (for booking-orchestrator.service.ts)
// =============================================================================

import { HotelBookingConfirmation } from '../types/booking.types';

const MOCK_HOTELS = process.env.MOCK_HOTELS === 'true';

/**
 * Book a hotel
 *
 * NOTE: Most hotel APIs don't support direct booking without partner approval.
 * This implementation generates a booking confirmation and deep link.
 */
export async function bookHotel(params: {
  hotelId: string;
  hotelName: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  nights: number;
  guests: Array<{
    firstName: string;
    lastName: string;
    email: string;
  }>;
  totalPrice: number; // in cents
  currency?: string;
}): Promise<HotelBookingConfirmation> {
  console.log('[Hotels] Booking hotel:', params.hotelName);

  // Generate deep link for hotel booking
  const deepLink = `https://www.booking.com/hotel/${params.hotelId}.html?checkin=${params.checkIn}&checkout=${params.checkOut}&group_adults=${params.guests.length}`;

  const confirmation: HotelBookingConfirmation = {
    confirmationCode: `HT${Date.now()}`,
    bookingReference: `DEEPLINK-${params.hotelId.slice(0, 8).toUpperCase()}`,
    hotelName: params.hotelName,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    nights: params.nights,
    guestNames: params.guests.map(g => `${g.firstName} ${g.lastName}`),
    totalPrice: params.totalPrice,
    currency: params.currency || 'USD',
    deepLink,
  };

  console.log('[Hotels] Hotel booking created:', confirmation.confirmationCode);
  return confirmation;
}

/**
 * Cancel a hotel booking
 */
export async function cancelHotel(bookingId: string): Promise<{
  success: boolean;
  refundAmount?: number;
  error?: string;
}> {
  console.log('[Hotels] Cancelling hotel booking:', bookingId);

  // TODO: Implement real cancellation when booking API is available
  return { success: true, refundAmount: 0 };
}
