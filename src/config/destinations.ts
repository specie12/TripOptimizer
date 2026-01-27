/**
 * Static Destination Configuration
 *
 * Mock destination data for MVP. In production, this would come from
 * flight/hotel APIs.
 */

export interface MockFlight {
  provider: string;
  basePrice: number; // Base price in cents (will be adjusted by origin)
  flightDuration: number; // Hours
}

export interface MockHotel {
  name: string;
  pricePerNight: number; // Price per night in cents
  rating: number | null;
}

export interface DestinationData {
  name: string;
  flights: MockFlight[];
  hotels: MockHotel[];
}

/**
 * Mock destination data with 2-3 flight/hotel options each
 *
 * Prices are base prices that can be adjusted based on origin city
 * and travel dates in a real implementation.
 */
export const DESTINATIONS: Record<string, DestinationData> = {
  'Paris': {
    name: 'Paris',
    flights: [
      { provider: 'Air France', basePrice: 45000, flightDuration: 8 },
      { provider: 'Delta', basePrice: 52000, flightDuration: 9 },
      { provider: 'United', basePrice: 48000, flightDuration: 8.5 },
    ],
    hotels: [
      { name: 'Hotel Le Marais', pricePerNight: 18000, rating: 4.2 },
      { name: 'Ibis Paris Centre', pricePerNight: 12000, rating: 3.8 },
      { name: 'Hotel de Ville', pricePerNight: 25000, rating: 4.5 },
    ],
  },
  'Tokyo': {
    name: 'Tokyo',
    flights: [
      { provider: 'Japan Airlines', basePrice: 85000, flightDuration: 14 },
      { provider: 'ANA', basePrice: 82000, flightDuration: 14 },
      { provider: 'United', basePrice: 78000, flightDuration: 15 },
    ],
    hotels: [
      { name: 'Shinjuku Granbell', pricePerNight: 15000, rating: 4.3 },
      { name: 'APA Hotel Shibuya', pricePerNight: 10000, rating: 3.9 },
      { name: 'Park Hyatt Tokyo', pricePerNight: 45000, rating: 4.8 },
    ],
  },
  'London': {
    name: 'London',
    flights: [
      { provider: 'British Airways', basePrice: 42000, flightDuration: 7 },
      { provider: 'Virgin Atlantic', basePrice: 48000, flightDuration: 7.5 },
      { provider: 'American Airlines', basePrice: 44000, flightDuration: 8 },
    ],
    hotels: [
      { name: 'Premier Inn London', pricePerNight: 14000, rating: 4.0 },
      { name: 'Travelodge Central', pricePerNight: 11000, rating: 3.5 },
      { name: 'The Strand Palace', pricePerNight: 22000, rating: 4.4 },
    ],
  },
  'Barcelona': {
    name: 'Barcelona',
    flights: [
      { provider: 'Iberia', basePrice: 38000, flightDuration: 9 },
      { provider: 'Vueling', basePrice: 32000, flightDuration: 9.5 },
      { provider: 'Delta', basePrice: 45000, flightDuration: 10 },
    ],
    hotels: [
      { name: 'Hotel Barcelona Centro', pricePerNight: 12000, rating: 4.1 },
      { name: 'Generator Barcelona', pricePerNight: 8000, rating: 3.7 },
      { name: 'Hotel Arts Barcelona', pricePerNight: 35000, rating: 4.7 },
    ],
  },
  'Rome': {
    name: 'Rome',
    flights: [
      { provider: 'Alitalia', basePrice: 40000, flightDuration: 9 },
      { provider: 'Delta', basePrice: 46000, flightDuration: 10 },
      { provider: 'United', basePrice: 43000, flightDuration: 9.5 },
    ],
    hotels: [
      { name: 'Hotel Colosseum', pricePerNight: 13000, rating: 4.0 },
      { name: 'Hotel Trevi', pricePerNight: 16000, rating: 4.2 },
      { name: 'Rome Cavalieri', pricePerNight: 40000, rating: 4.6 },
    ],
  },
  'Amsterdam': {
    name: 'Amsterdam',
    flights: [
      { provider: 'KLM', basePrice: 35000, flightDuration: 8 },
      { provider: 'Delta', basePrice: 42000, flightDuration: 8.5 },
      { provider: 'United', basePrice: 38000, flightDuration: 9 },
    ],
    hotels: [
      { name: 'NH Amsterdam Centre', pricePerNight: 15000, rating: 4.1 },
      { name: 'Ibis Amsterdam', pricePerNight: 10000, rating: 3.6 },
      { name: 'Waldorf Astoria', pricePerNight: 50000, rating: 4.9 },
    ],
  },
  'Dubai': {
    name: 'Dubai',
    flights: [
      { provider: 'Emirates', basePrice: 95000, flightDuration: 14 },
      { provider: 'Etihad', basePrice: 88000, flightDuration: 14.5 },
      { provider: 'Qatar Airways', basePrice: 92000, flightDuration: 15 },
    ],
    hotels: [
      { name: 'Rove Downtown Dubai', pricePerNight: 12000, rating: 4.2 },
      { name: 'Ibis Al Barsha', pricePerNight: 9000, rating: 3.8 },
      { name: 'Atlantis The Palm', pricePerNight: 55000, rating: 4.7 },
    ],
  },
  'Singapore': {
    name: 'Singapore',
    flights: [
      { provider: 'Singapore Airlines', basePrice: 92000, flightDuration: 18 },
      { provider: 'United', basePrice: 98000, flightDuration: 19 },
      { provider: 'ANA', basePrice: 95000, flightDuration: 18.5 },
    ],
    hotels: [
      { name: 'Hotel 81 Bugis', pricePerNight: 11000, rating: 3.9 },
      { name: 'Park Royal on Pickering', pricePerNight: 18000, rating: 4.4 },
      { name: 'Marina Bay Sands', pricePerNight: 60000, rating: 4.8 },
    ],
  },
  'New York': {
    name: 'New York',
    flights: [
      { provider: 'Delta', basePrice: 38000, flightDuration: 6 },
      { provider: 'American Airlines', basePrice: 42000, flightDuration: 6.5 },
      { provider: 'United', basePrice: 40000, flightDuration: 6 },
    ],
    hotels: [
      { name: 'Pod 51 Hotel', pricePerNight: 16000, rating: 4.0 },
      { name: 'YOTEL New York', pricePerNight: 20000, rating: 4.2 },
      { name: 'The Plaza Hotel', pricePerNight: 75000, rating: 4.6 },
    ],
  },
  'Bangkok': {
    name: 'Bangkok',
    flights: [
      { provider: 'Thai Airways', basePrice: 82000, flightDuration: 17 },
      { provider: 'ANA', basePrice: 85000, flightDuration: 18 },
      { provider: 'Qatar Airways', basePrice: 79000, flightDuration: 17.5 },
    ],
    hotels: [
      { name: 'ibis Bangkok Riverside', pricePerNight: 7000, rating: 4.1 },
      { name: 'Novotel Bangkok', pricePerNight: 11000, rating: 4.3 },
      { name: 'Mandarin Oriental', pricePerNight: 45000, rating: 4.8 },
    ],
  },
  'Mexico City': {
    name: 'Mexico City',
    flights: [
      { provider: 'Aeromexico', basePrice: 45000, flightDuration: 5.5 },
      { provider: 'United', basePrice: 48000, flightDuration: 6 },
      { provider: 'Delta', basePrice: 46000, flightDuration: 5.5 },
    ],
    hotels: [
      { name: 'Hotel Benidorm', pricePerNight: 8000, rating: 4.0 },
      { name: 'NH Collection Mexico City', pricePerNight: 13000, rating: 4.3 },
      { name: 'Four Seasons Mexico City', pricePerNight: 42000, rating: 4.7 },
    ],
  },
};

/**
 * Get list of available destination names
 */
export function getAvailableDestinations(): string[] {
  return Object.keys(DESTINATIONS);
}

/**
 * Get destination data by name (case-insensitive)
 */
export function getDestination(name: string): DestinationData | undefined {
  const normalized = name.trim();

  // Try exact match first
  if (DESTINATIONS[normalized]) {
    return DESTINATIONS[normalized];
  }

  // Try case-insensitive match
  const key = Object.keys(DESTINATIONS).find(
    (k) => k.toLowerCase() === normalized.toLowerCase()
  );

  return key ? DESTINATIONS[key] : undefined;
}

/**
 * Get random destinations for suggestions
 */
export function getRandomDestinations(count: number): string[] {
  const all = getAvailableDestinations();
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, all.length));
}
