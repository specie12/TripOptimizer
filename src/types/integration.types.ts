/**
 * Integration Types
 *
 * Common types and interfaces for external API integrations.
 * Provides abstraction layer for flights, hotels, and activities.
 */

// =============================================================================
// COMMON INTEGRATION TYPES
// =============================================================================

/**
 * Integration provider status
 */
export enum IntegrationStatus {
  AVAILABLE = 'AVAILABLE',
  UNAVAILABLE = 'UNAVAILABLE',
  ERROR = 'ERROR',
  MOCK = 'MOCK',
}

/**
 * Base integration response
 */
export interface IntegrationResponse<T> {
  /** Response data */
  data: T;

  /** Provider that returned the data */
  provider: string;

  /** Status of the integration */
  status: IntegrationStatus;

  /** Whether data came from cache */
  cached: boolean;

  /** Timestamp of the response */
  timestamp: Date;

  /** Optional error message */
  error?: string;
}

/**
 * Search criteria base
 */
export interface SearchCriteria {
  /** Maximum number of results to return */
  maxResults?: number;

  /** Maximum price in cents */
  maxPrice?: number;
}

// =============================================================================
// FLIGHT INTEGRATION TYPES
// =============================================================================

/**
 * Flight search criteria
 */
export interface FlightSearchCriteria extends SearchCriteria {
  /** Origin airport code or city */
  origin: string;

  /** Destination airport code or city */
  destination: string;

  /** Departure date (ISO 8601) */
  departureDate: string;

  /** Return date (ISO 8601) */
  returnDate: string;

  /** Number of passengers */
  passengers?: number;

  /** Cabin class */
  class?: 'economy' | 'premium_economy' | 'business' | 'first';

  /** Maximum number of stops */
  maxStops?: number;
}

/**
 * Flight result from integration
 */
export interface FlightResult {
  /** Unique identifier */
  id: string;

  /** Airline/provider name */
  provider: string;

  /** Price in cents */
  price: number;

  /** Departure time (ISO 8601) */
  departureTime: string;

  /** Arrival time at destination (ISO 8601) */
  arrivalTime: string;

  /** Return departure time (ISO 8601) */
  returnDepartureTime: string;

  /** Return arrival time (ISO 8601) */
  returnTime: string;

  /** Flight duration in minutes (one way) */
  duration?: number;

  /** Number of stops */
  stops?: number;

  /** Deep link for booking */
  deepLink: string;
}

// =============================================================================
// HOTEL INTEGRATION TYPES
// =============================================================================

/**
 * Hotel search criteria
 */
export interface HotelSearchCriteria extends SearchCriteria {
  /** Destination city or location */
  destination: string;

  /** Check-in date (ISO 8601) */
  checkInDate: string;

  /** Check-out date (ISO 8601) */
  checkOutDate: string;

  /** Number of guests */
  guests?: number;

  /** Minimum rating (1-5 stars) */
  minRating?: number;

  /** Number of nights */
  numberOfNights: number;
}

/**
 * Hotel result from integration
 */
export interface HotelResult {
  /** Unique identifier */
  id: string;

  /** Hotel name */
  name: string;

  /** Total price in cents for entire stay */
  priceTotal: number;

  /** Price per night in cents */
  pricePerNight: number;

  /** Rating (1-5 stars) */
  rating: number | null;

  /** Number of reviews */
  reviewCount?: number;

  /** Hotel amenities */
  amenities?: string[];

  /** Deep link for booking */
  deepLink: string;
}

// =============================================================================
// ACTIVITY INTEGRATION TYPES
// =============================================================================

/**
 * Activity search criteria
 */
export interface ActivitySearchCriteria extends SearchCriteria {
  /** Destination city */
  destination: string;

  /** Activity categories to filter by */
  categories?: string[];

  /** Minimum rating (0-5) */
  minRating?: number;

  /** Maximum duration in minutes */
  maxDuration?: number;
}

/**
 * Activity result from integration
 */
export interface ActivityResult {
  /** Unique identifier */
  id: string;

  /** Activity name */
  name: string;

  /** Activity category */
  category: string;

  /** Description */
  description: string;

  /** Duration in minutes */
  duration: number;

  /** Price in cents (0 when API doesn't provide pricing) */
  price: number;

  /** Rating (0-5) */
  rating?: number | null;

  /** Number of reviews */
  reviewCount?: number;

  /** Deep link for booking */
  deepLink: string;

  /** Image URL */
  imageUrl?: string | null;

  /** Available from date */
  availableFrom?: string;

  /** Available to date */
  availableTo?: string;
}

// =============================================================================
// INTEGRATION PROVIDER INTERFACES
// =============================================================================

/**
 * Flight integration provider interface
 */
export interface FlightIntegrationProvider {
  /** Provider name */
  name: string;

  /** Search for flights */
  search(criteria: FlightSearchCriteria): Promise<IntegrationResponse<FlightResult[]>>;

  /** Check if provider is available */
  isAvailable(): Promise<boolean>;
}

/**
 * Hotel integration provider interface
 */
export interface HotelIntegrationProvider {
  /** Provider name */
  name: string;

  /** Search for hotels */
  search(criteria: HotelSearchCriteria): Promise<IntegrationResponse<HotelResult[]>>;

  /** Check if provider is available */
  isAvailable(): Promise<boolean>;
}

/**
 * Activity integration provider interface
 */
export interface ActivityIntegrationProvider {
  /** Provider name */
  name: string;

  /** Search for activities */
  search(criteria: ActivitySearchCriteria): Promise<IntegrationResponse<ActivityResult[]>>;

  /** Check if provider is available */
  isAvailable(): Promise<boolean>;
}

// =============================================================================
// CACHE TYPES
// =============================================================================

/**
 * Cache entry
 */
export interface CacheEntry<T> {
  /** Cached data */
  data: T;

  /** Timestamp when cached */
  cachedAt: Date;

  /** TTL in milliseconds */
  ttl: number;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Enable/disable caching */
  enabled: boolean;

  /** Default TTL in milliseconds (default: 5 minutes) */
  defaultTTL: number;

  /** Maximum cache size (number of entries) */
  maxSize: number;
}
