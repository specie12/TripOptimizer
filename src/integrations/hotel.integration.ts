/**
 * Hotel Integration
 *
 * Abstraction layer for hotel search APIs.
 * Supports mock provider for development and real providers for production.
 */

import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import {
  HotelIntegrationProvider,
  HotelSearchCriteria,
  HotelResult,
  IntegrationResponse,
  IntegrationStatus,
} from '../types/integration.types';
import { getDestination, MockHotel } from '../config/destinations';
import { cacheService } from '../services/cache.service';

// Environment variables
const MOCK_HOTELS = process.env.MOCK_HOTELS === 'true';
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOTELS_HOST || 'booking-com.p.rapidapi.com';

// =============================================================================
// RAPIDAPI HOTEL PROVIDER (Booking.com)
// =============================================================================

/**
 * RapidAPI hotel provider using Booking.com API
 */
class RapidAPIHotelProvider implements HotelIntegrationProvider {
  name = 'RapidAPI-Booking.com';
  private apiKey: string;
  private host: string;

  constructor(apiKey: string, host: string) {
    this.apiKey = apiKey;
    this.host = host;
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey && !!this.host;
  }

  async search(criteria: HotelSearchCriteria): Promise<IntegrationResponse<HotelResult[]>> {
    try {
      console.log(`[${this.name}] Searching hotels for ${criteria.destination}`);

      // Check cache first
      const cacheKey = {
        destination: criteria.destination,
        checkInDate: criteria.checkInDate,
        checkOutDate: criteria.checkOutDate,
        numberOfNights: criteria.numberOfNights,
        maxPrice: criteria.maxPrice,
      };
      const cached = cacheService.get<HotelResult[]>('hotels-rapidapi', cacheKey);

      if (cached) {
        console.log(`[${this.name}] Returning cached results`);
        return {
          data: cached,
          provider: this.name,
          status: IntegrationStatus.AVAILABLE,
          cached: true,
          timestamp: new Date(),
        };
      }

      // Step 1: Search for destination to get destination ID
      const destinationInfo = await this.getDestinationId(criteria.destination);
      if (!destinationInfo) {
        console.warn(`[${this.name}] Destination not found: ${criteria.destination}`);
        // Throw error to trigger fallback to mock provider
        throw new Error(`Destination ${criteria.destination} not found via API`);
      }

      // Step 2: Search for hotels
      const hotels = await this.searchHotels(destinationInfo.destId, destinationInfo.searchType, criteria);

      // Step 3: Transform and filter results
      const results: HotelResult[] = hotels
        .map((hotel) => this.transformHotel(hotel, criteria))
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

      console.log(`[${this.name}] Found ${results.length} hotels`);

      // Cache the results
      cacheService.set('hotels-rapidapi', cacheKey, results);

      return {
        data: results,
        provider: this.name,
        status: IntegrationStatus.AVAILABLE,
        cached: false,
        timestamp: new Date(),
      };
    } catch (error: any) {
      console.error(`[${this.name}] Search failed:`, error.message);
      // Re-throw error to trigger fallback to next provider
      throw error;
    }
  }

  /**
   * Get destination ID from destination name
   */
  private async getDestinationId(destination: string): Promise<{ destId: string; searchType: string } | null> {
    try {
      const response = await axios.get(`https://${this.host}/api/v1/hotels/searchDestination`, {
        params: {
          query: destination,
        },
        headers: {
          'x-rapidapi-host': this.host,
          'x-rapidapi-key': this.apiKey,
        },
        timeout: 10000,
      });

      if (response.data?.status && response.data?.data && response.data.data.length > 0) {
        // Return the first match's dest_id and search_type
        const firstResult = response.data.data[0];
        return {
          destId: firstResult.dest_id,
          searchType: firstResult.search_type || 'city',
        };
      }

      return null;
    } catch (error: any) {
      console.error(`[${this.name}] Failed to get destination ID:`, error.response?.status, error.message);
      return null;
    }
  }

  /**
   * Search for hotels by destination ID
   */
  private async searchHotels(destinationId: string, searchType: string, criteria: HotelSearchCriteria): Promise<any[]> {
    try {
      const response = await axios.get(`https://${this.host}/api/v1/hotels/searchHotels`, {
        params: {
          dest_id: destinationId,
          search_type: searchType.toUpperCase(),
          arrival_date: criteria.checkInDate,
          departure_date: criteria.checkOutDate,
          adults: criteria.guests || 2,
          room_qty: 1,
          currency_code: 'USD',
        },
        headers: {
          'x-rapidapi-host': this.host,
          'x-rapidapi-key': this.apiKey,
        },
        timeout: 15000,
      });

      return response.data?.data?.hotels || [];
    } catch (error: any) {
      console.error(`[${this.name}] Failed to search hotels:`, error.response?.status, error.message);
      throw error;
    }
  }

  /**
   * Transform Booking.com API response to HotelResult format
   */
  private transformHotel(hotel: any, criteria: HotelSearchCriteria): HotelResult {
    // Extract price information from booking-com15 API
    const pricePerNight = hotel.min_total_price
      ? Math.round(parseFloat(hotel.min_total_price) * 100) // Convert to cents
      : hotel.price_breakdown?.gross_price
      ? Math.round(parseFloat(hotel.price_breakdown.gross_price) * 100)
      : 10000; // Fallback to $100/night

    const priceTotal = pricePerNight * criteria.numberOfNights;

    // Extract rating (booking-com15 uses propertyClass or review_score)
    let rating = null;
    if (hotel.property_class) {
      rating = parseFloat(hotel.property_class);
    } else if (hotel.review_score) {
      rating = parseFloat(hotel.review_score) / 2; // Convert 0-10 to 0-5
    }

    // Extract amenities from property description
    const amenities: string[] = [];
    if (hotel.hotel_facilities) {
      amenities.push(...hotel.hotel_facilities.slice(0, 5));
    } else if (hotel.unit_configuration_label) {
      amenities.push(hotel.unit_configuration_label);
    }

    // Generate deep link
    const deepLink = hotel.url || `https://www.booking.com/hotel/id${hotel.hotel_id}.html`;

    return {
      id: hotel.hotel_id?.toString() || uuidv4(),
      name: hotel.hotel_name || hotel.property?.name || 'Hotel',
      priceTotal,
      pricePerNight,
      rating,
      reviewCount: hotel.review_count || hotel.review_nr ? parseInt(hotel.review_count || hotel.review_nr) : undefined,
      amenities,
      deepLink,
    };
  }
}

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
    this.providers = [];

    // Add RapidAPI provider if credentials are available and not in mock mode
    if (!MOCK_HOTELS && RAPIDAPI_KEY && RAPIDAPI_HOST) {
      const rapidApiProvider = new RapidAPIHotelProvider(RAPIDAPI_KEY, RAPIDAPI_HOST);
      this.providers.push(rapidApiProvider);
      console.log('[Hotels] Using RapidAPI (Booking.com) provider');
    }

    // Always add mock provider as fallback
    this.providers.push(new MockHotelProvider());

    // Set current provider to the first available one
    this.currentProvider = this.providers[0];

    if (MOCK_HOTELS) {
      console.log('[Hotels] Using Mock provider (MOCK_HOTELS=true)');
    }
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
