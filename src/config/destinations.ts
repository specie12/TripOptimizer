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
  'Madrid': {
    name: 'Madrid',
    flights: [
      { provider: 'Iberia', basePrice: 42000, flightDuration: 8 },
      { provider: 'Air Europa', basePrice: 38000, flightDuration: 8.5 },
      { provider: 'Delta', basePrice: 46000, flightDuration: 9 },
    ],
    hotels: [
      { name: 'Hotel Puerta del Sol', pricePerNight: 11000, rating: 4.0 },
      { name: 'Ibis Madrid Centro', pricePerNight: 9000, rating: 3.7 },
      { name: 'Hotel Ritz Madrid', pricePerNight: 48000, rating: 4.8 },
    ],
  },
  'Lisbon': {
    name: 'Lisbon',
    flights: [
      { provider: 'TAP Portugal', basePrice: 36000, flightDuration: 7.5 },
      { provider: 'Lufthansa', basePrice: 41000, flightDuration: 8 },
      { provider: 'United', basePrice: 44000, flightDuration: 9 },
    ],
    hotels: [
      { name: 'Hotel Lisboa', pricePerNight: 10000, rating: 4.1 },
      { name: 'Ibis Lisboa', pricePerNight: 8000, rating: 3.6 },
      { name: 'Four Seasons Ritz Lisbon', pricePerNight: 52000, rating: 4.9 },
    ],
  },
  'Los Angeles': {
    name: 'Los Angeles',
    flights: [
      { provider: 'United', basePrice: 32000, flightDuration: 5.5 },
      { provider: 'Delta', basePrice: 35000, flightDuration: 5.5 },
      { provider: 'American Airlines', basePrice: 33000, flightDuration: 6 },
    ],
    hotels: [
      { name: 'Ace Hotel Downtown LA', pricePerNight: 18000, rating: 4.2 },
      { name: 'Holiday Inn LA', pricePerNight: 14000, rating: 3.8 },
      { name: 'Beverly Wilshire', pricePerNight: 65000, rating: 4.7 },
    ],
  },
  'Miami': {
    name: 'Miami',
    flights: [
      { provider: 'American Airlines', basePrice: 28000, flightDuration: 3.5 },
      { provider: 'Delta', basePrice: 31000, flightDuration: 3.5 },
      { provider: 'United', basePrice: 29000, flightDuration: 4 },
    ],
    hotels: [
      { name: 'Yve Hotel Miami', pricePerNight: 16000, rating: 4.1 },
      { name: 'Hampton Inn Miami Beach', pricePerNight: 13000, rating: 3.9 },
      { name: 'Fontainebleau Miami Beach', pricePerNight: 55000, rating: 4.6 },
    ],
  },
  'Istanbul': {
    name: 'Istanbul',
    flights: [
      { provider: 'Turkish Airlines', basePrice: 68000, flightDuration: 11 },
      { provider: 'Lufthansa', basePrice: 75000, flightDuration: 12 },
      { provider: 'Emirates', basePrice: 72000, flightDuration: 13 },
    ],
    hotels: [
      { name: 'Hotel Sultania', pricePerNight: 9000, rating: 4.2 },
      { name: 'Ibis Istanbul', pricePerNight: 7000, rating: 3.7 },
      { name: 'Ciragan Palace Kempinski', pricePerNight: 58000, rating: 4.8 },
    ],
  },
  'Cape Town': {
    name: 'Cape Town',
    flights: [
      { provider: 'South African Airways', basePrice: 98000, flightDuration: 18 },
      { provider: 'Emirates', basePrice: 105000, flightDuration: 20 },
      { provider: 'Lufthansa', basePrice: 102000, flightDuration: 19 },
    ],
    hotels: [
      { name: 'Camps Bay Retreat', pricePerNight: 20000, rating: 4.4 },
      { name: 'Table Bay Hotel', pricePerNight: 25000, rating: 4.5 },
      { name: 'One&Only Cape Town', pricePerNight: 65000, rating: 4.8 },
    ],
  },
  'Montreal': {
    name: 'Montreal',
    flights: [
      { provider: 'Air Canada', basePrice: 35000, flightDuration: 6.5 },
      { provider: 'Air Transat', basePrice: 29900, flightDuration: 6.5 },
      { provider: 'United', basePrice: 32000, flightDuration: 7 },
    ],
    hotels: [
      { name: 'Hotel Bonaventure Montreal', pricePerNight: 15000, rating: 4.0 },
      { name: 'Auberge du Vieux-Port', pricePerNight: 20000, rating: 4.5 },
      { name: 'Fairmont The Queen Elizabeth', pricePerNight: 28000, rating: 4.6 },
    ],
  },
  'Vancouver': {
    name: 'Vancouver',
    flights: [
      { provider: 'Air Canada', basePrice: 38000, flightDuration: 5.5 },
      { provider: 'WestJet', basePrice: 35000, flightDuration: 5.5 },
      { provider: 'United', basePrice: 36000, flightDuration: 6 },
    ],
    hotels: [
      { name: 'Sandman Hotel Vancouver', pricePerNight: 14000, rating: 4.0 },
      { name: 'Hyatt Regency Vancouver', pricePerNight: 22000, rating: 4.4 },
      { name: 'Fairmont Hotel Vancouver', pricePerNight: 32000, rating: 4.7 },
    ],
  },
  'Seattle': {
    name: 'Seattle',
    flights: [
      { provider: 'Alaska Airlines', basePrice: 28000, flightDuration: 5 },
      { provider: 'Delta', basePrice: 30000, flightDuration: 5 },
      { provider: 'United', basePrice: 29000, flightDuration: 5.5 },
    ],
    hotels: [
      { name: 'Hotel Ballard', pricePerNight: 16000, rating: 4.2 },
      { name: 'Hyatt at Olive 8', pricePerNight: 19000, rating: 4.3 },
      { name: 'Fairmont Olympic Hotel', pricePerNight: 35000, rating: 4.6 },
    ],
  },
  'Denver': {
    name: 'Denver',
    flights: [
      { provider: 'United', basePrice: 25000, flightDuration: 4 },
      { provider: 'Southwest', basePrice: 23000, flightDuration: 4 },
      { provider: 'Delta', basePrice: 26000, flightDuration: 4.5 },
    ],
    hotels: [
      { name: 'Hotel Teatro', pricePerNight: 17000, rating: 4.3 },
      { name: 'The Crawford Hotel', pricePerNight: 22000, rating: 4.5 },
      { name: 'Four Seasons Denver', pricePerNight: 38000, rating: 4.7 },
    ],
  },
  'Boston': {
    name: 'Boston',
    flights: [
      { provider: 'JetBlue', basePrice: 26000, flightDuration: 5.5 },
      { provider: 'Delta', basePrice: 29000, flightDuration: 5.5 },
      { provider: 'United', basePrice: 27000, flightDuration: 6 },
    ],
    hotels: [
      { name: 'The Godfrey Hotel Boston', pricePerNight: 18000, rating: 4.2 },
      { name: 'Hyatt Regency Boston', pricePerNight: 23000, rating: 4.4 },
      { name: 'Four Seasons Boston', pricePerNight: 55000, rating: 4.8 },
    ],
  },
  'Washington DC': {
    name: 'Washington DC',
    flights: [
      { provider: 'American Airlines', basePrice: 24000, flightDuration: 5 },
      { provider: 'United', basePrice: 26000, flightDuration: 5 },
      { provider: 'Delta', basePrice: 25000, flightDuration: 5.5 },
    ],
    hotels: [
      { name: 'Hotel Hive', pricePerNight: 16000, rating: 4.0 },
      { name: 'The Mayflower Hotel', pricePerNight: 24000, rating: 4.4 },
      { name: 'The Hay-Adams', pricePerNight: 48000, rating: 4.7 },
    ],
  },
  'Chicago': {
    name: 'Chicago',
    flights: [
      { provider: 'United', basePrice: 22000, flightDuration: 4.5 },
      { provider: 'American Airlines', basePrice: 24000, flightDuration: 4.5 },
      { provider: 'Southwest', basePrice: 21000, flightDuration: 5 },
    ],
    hotels: [
      { name: 'Hotel Chicago Downtown', pricePerNight: 15000, rating: 4.1 },
      { name: 'Hyatt Centric Chicago', pricePerNight: 20000, rating: 4.3 },
      { name: 'The Langham Chicago', pricePerNight: 42000, rating: 4.8 },
    ],
  },
  'San Francisco': {
    name: 'San Francisco',
    flights: [
      { provider: 'United', basePrice: 30000, flightDuration: 5.5 },
      { provider: 'Alaska Airlines', basePrice: 28000, flightDuration: 5.5 },
      { provider: 'Delta', basePrice: 31000, flightDuration: 6 },
    ],
    hotels: [
      { name: 'Hotel Zephyr', pricePerNight: 19000, rating: 4.2 },
      { name: 'Hyatt Regency SF', pricePerNight: 24000, rating: 4.4 },
      { name: 'Fairmont San Francisco', pricePerNight: 45000, rating: 4.7 },
    ],
  },
  'Berlin': {
    name: 'Berlin',
    flights: [
      { provider: 'Lufthansa', basePrice: 46000, flightDuration: 9 },
      { provider: 'United', basePrice: 52000, flightDuration: 10 },
      { provider: 'Air France', basePrice: 49000, flightDuration: 9.5 },
    ],
    hotels: [
      { name: 'Hotel Adlon Kempinski', pricePerNight: 25000, rating: 4.5 },
      { name: 'NH Collection Berlin', pricePerNight: 13000, rating: 4.2 },
      { name: 'The Ritz-Carlton Berlin', pricePerNight: 38000, rating: 4.8 },
    ],
  },
  'Munich': {
    name: 'Munich',
    flights: [
      { provider: 'Lufthansa', basePrice: 48000, flightDuration: 9.5 },
      { provider: 'United', basePrice: 54000, flightDuration: 10 },
      { provider: 'Delta', basePrice: 51000, flightDuration: 10 },
    ],
    hotels: [
      { name: 'Hotel Vier Jahreszeiten', pricePerNight: 22000, rating: 4.6 },
      { name: 'Novotel Munich', pricePerNight: 14000, rating: 4.1 },
      { name: 'Mandarin Oriental Munich', pricePerNight: 48000, rating: 4.9 },
    ],
  },
  'Vienna': {
    name: 'Vienna',
    flights: [
      { provider: 'Austrian Airlines', basePrice: 50000, flightDuration: 10 },
      { provider: 'Lufthansa', basePrice: 52000, flightDuration: 10.5 },
      { provider: 'United', basePrice: 55000, flightDuration: 11 },
    ],
    hotels: [
      { name: 'Hotel Sacher Wien', pricePerNight: 28000, rating: 4.6 },
      { name: 'Austria Trend Hotel', pricePerNight: 15000, rating: 4.2 },
      { name: 'The Ritz-Carlton Vienna', pricePerNight: 45000, rating: 4.8 },
    ],
  },
  'Prague': {
    name: 'Prague',
    flights: [
      { provider: 'Czech Airlines', basePrice: 42000, flightDuration: 9.5 },
      { provider: 'Lufthansa', basePrice: 46000, flightDuration: 10 },
      { provider: 'United', basePrice: 48000, flightDuration: 10.5 },
    ],
    hotels: [
      { name: 'Hotel Golden Star', pricePerNight: 10000, rating: 4.1 },
      { name: 'Hotel Marriott Prague', pricePerNight: 16000, rating: 4.4 },
      { name: 'Four Seasons Prague', pricePerNight: 42000, rating: 4.8 },
    ],
  },
  'Budapest': {
    name: 'Budapest',
    flights: [
      { provider: 'Lufthansa', basePrice: 44000, flightDuration: 10 },
      { provider: 'Austrian Airlines', basePrice: 46000, flightDuration: 10.5 },
      { provider: 'United', basePrice: 50000, flightDuration: 11 },
    ],
    hotels: [
      { name: 'Corinthia Budapest', pricePerNight: 18000, rating: 4.5 },
      { name: 'Ibis Budapest Centrum', pricePerNight: 9000, rating: 3.8 },
      { name: 'Four Seasons Gresham Palace', pricePerNight: 48000, rating: 4.9 },
    ],
  },
  'Athens': {
    name: 'Athens',
    flights: [
      { provider: 'Aegean Airlines', basePrice: 52000, flightDuration: 11 },
      { provider: 'Lufthansa', basePrice: 56000, flightDuration: 11.5 },
      { provider: 'United', basePrice: 58000, flightDuration: 12 },
    ],
    hotels: [
      { name: 'Hotel Grande Bretagne', pricePerNight: 24000, rating: 4.6 },
      { name: 'Athens Marriott', pricePerNight: 15000, rating: 4.2 },
      { name: 'King George Athens', pricePerNight: 35000, rating: 4.7 },
    ],
  },
  'Copenhagen': {
    name: 'Copenhagen',
    flights: [
      { provider: 'SAS', basePrice: 48000, flightDuration: 8.5 },
      { provider: 'Lufthansa', basePrice: 52000, flightDuration: 9 },
      { provider: 'United', basePrice: 54000, flightDuration: 9.5 },
    ],
    hotels: [
      { name: 'Copenhagen Admiral Hotel', pricePerNight: 18000, rating: 4.3 },
      { name: 'Scandic Copenhagen', pricePerNight: 14000, rating: 4.0 },
      { name: 'Nimb Hotel', pricePerNight: 52000, rating: 4.8 },
    ],
  },
  'Stockholm': {
    name: 'Stockholm',
    flights: [
      { provider: 'SAS', basePrice: 50000, flightDuration: 9 },
      { provider: 'Lufthansa', basePrice: 54000, flightDuration: 9.5 },
      { provider: 'United', basePrice: 56000, flightDuration: 10 },
    ],
    hotels: [
      { name: 'Hotel Rival', pricePerNight: 16000, rating: 4.2 },
      { name: 'Radisson Blu Waterfront', pricePerNight: 19000, rating: 4.4 },
      { name: 'Grand Hôtel Stockholm', pricePerNight: 46000, rating: 4.7 },
    ],
  },
  'Seoul': {
    name: 'Seoul',
    flights: [
      { provider: 'Korean Air', basePrice: 88000, flightDuration: 14 },
      { provider: 'Asiana Airlines', basePrice: 85000, flightDuration: 14 },
      { provider: 'United', basePrice: 92000, flightDuration: 15 },
    ],
    hotels: [
      { name: 'Ibis Styles Seoul', pricePerNight: 10000, rating: 4.0 },
      { name: 'Lotte Hotel Seoul', pricePerNight: 20000, rating: 4.5 },
      { name: 'Four Seasons Seoul', pricePerNight: 42000, rating: 4.8 },
    ],
  },
  'Hong Kong': {
    name: 'Hong Kong',
    flights: [
      { provider: 'Cathay Pacific', basePrice: 90000, flightDuration: 16 },
      { provider: 'United', basePrice: 95000, flightDuration: 17 },
      { provider: 'ANA', basePrice: 93000, flightDuration: 16.5 },
    ],
    hotels: [
      { name: 'Ibis Hong Kong Central', pricePerNight: 14000, rating: 4.1 },
      { name: 'Hyatt Centric Victoria', pricePerNight: 22000, rating: 4.4 },
      { name: 'The Peninsula Hong Kong', pricePerNight: 65000, rating: 4.9 },
    ],
  },
  'Taipei': {
    name: 'Taipei',
    flights: [
      { provider: 'EVA Air', basePrice: 86000, flightDuration: 15 },
      { provider: 'China Airlines', basePrice: 82000, flightDuration: 15 },
      { provider: 'United', basePrice: 88000, flightDuration: 16 },
    ],
    hotels: [
      { name: 'CityInn Hotel Plus', pricePerNight: 9000, rating: 4.0 },
      { name: 'Grand Hyatt Taipei', pricePerNight: 18000, rating: 4.5 },
      { name: 'Mandarin Oriental Taipei', pricePerNight: 38000, rating: 4.8 },
    ],
  },
  'Kuala Lumpur': {
    name: 'Kuala Lumpur',
    flights: [
      { provider: 'Malaysia Airlines', basePrice: 84000, flightDuration: 20 },
      { provider: 'ANA', basePrice: 88000, flightDuration: 21 },
      { provider: 'Qatar Airways', basePrice: 86000, flightDuration: 20.5 },
    ],
    hotels: [
      { name: 'Hotel Stripes KL', pricePerNight: 11000, rating: 4.2 },
      { name: 'Mandarin Oriental KL', pricePerNight: 19000, rating: 4.6 },
      { name: 'The St. Regis Kuala Lumpur', pricePerNight: 35000, rating: 4.8 },
    ],
  },
  'Manila': {
    name: 'Manila',
    flights: [
      { provider: 'Philippine Airlines', basePrice: 88000, flightDuration: 18 },
      { provider: 'ANA', basePrice: 92000, flightDuration: 19 },
      { provider: 'United', basePrice: 90000, flightDuration: 18.5 },
    ],
    hotels: [
      { name: 'City Garden Grand Hotel', pricePerNight: 9000, rating: 4.0 },
      { name: 'Makati Shangri-La', pricePerNight: 15000, rating: 4.5 },
      { name: 'The Peninsula Manila', pricePerNight: 28000, rating: 4.7 },
    ],
  },
  'Shanghai': {
    name: 'Shanghai',
    flights: [
      { provider: 'China Eastern', basePrice: 86000, flightDuration: 15 },
      { provider: 'United', basePrice: 92000, flightDuration: 16 },
      { provider: 'ANA', basePrice: 89000, flightDuration: 15.5 },
    ],
    hotels: [
      { name: 'Hotel Indigo Shanghai', pricePerNight: 13000, rating: 4.3 },
      { name: 'The Portman Ritz-Carlton', pricePerNight: 22000, rating: 4.6 },
      { name: 'The Peninsula Shanghai', pricePerNight: 48000, rating: 4.9 },
    ],
  },
  'Beijing': {
    name: 'Beijing',
    flights: [
      { provider: 'Air China', basePrice: 88000, flightDuration: 14 },
      { provider: 'United', basePrice: 94000, flightDuration: 15 },
      { provider: 'ANA', basePrice: 91000, flightDuration: 14.5 },
    ],
    hotels: [
      { name: 'Hotel Eclat Beijing', pricePerNight: 16000, rating: 4.4 },
      { name: 'China World Summit Wing', pricePerNight: 25000, rating: 4.7 },
      { name: 'The Peninsula Beijing', pricePerNight: 45000, rating: 4.8 },
    ],
  },
  'Buenos Aires': {
    name: 'Buenos Aires',
    flights: [
      { provider: 'Aerolíneas Argentinas', basePrice: 78000, flightDuration: 11 },
      { provider: 'United', basePrice: 82000, flightDuration: 11.5 },
      { provider: 'Delta', basePrice: 80000, flightDuration: 11 },
    ],
    hotels: [
      { name: 'Hotel Madero', pricePerNight: 15000, rating: 4.3 },
      { name: 'Alvear Palace Hotel', pricePerNight: 28000, rating: 4.7 },
      { name: 'Four Seasons Buenos Aires', pricePerNight: 38000, rating: 4.8 },
    ],
  },
  'Rio de Janeiro': {
    name: 'Rio de Janeiro',
    flights: [
      { provider: 'LATAM', basePrice: 76000, flightDuration: 10.5 },
      { provider: 'United', basePrice: 80000, flightDuration: 11 },
      { provider: 'Delta', basePrice: 78000, flightDuration: 10.5 },
    ],
    hotels: [
      { name: 'Porto Bay Rio Internacional', pricePerNight: 16000, rating: 4.2 },
      { name: 'Belmond Copacabana Palace', pricePerNight: 42000, rating: 4.7 },
      { name: 'Fairmont Rio de Janeiro', pricePerNight: 32000, rating: 4.6 },
    ],
  },
  'Lima': {
    name: 'Lima',
    flights: [
      { provider: 'LATAM', basePrice: 62000, flightDuration: 8 },
      { provider: 'United', basePrice: 66000, flightDuration: 8.5 },
      { provider: 'Avianca', basePrice: 64000, flightDuration: 8 },
    ],
    hotels: [
      { name: 'Hotel B', pricePerNight: 14000, rating: 4.4 },
      { name: 'Belmond Miraflores Park', pricePerNight: 24000, rating: 4.6 },
      { name: 'Country Club Lima Hotel', pricePerNight: 32000, rating: 4.7 },
    ],
  },
  'Bogota': {
    name: 'Bogota',
    flights: [
      { provider: 'Avianca', basePrice: 58000, flightDuration: 6 },
      { provider: 'United', basePrice: 62000, flightDuration: 6.5 },
      { provider: 'LATAM', basePrice: 60000, flightDuration: 6 },
    ],
    hotels: [
      { name: 'Hotel de la Opera', pricePerNight: 12000, rating: 4.3 },
      { name: 'JW Marriott Bogota', pricePerNight: 18000, rating: 4.5 },
      { name: 'Four Seasons Casa Medina', pricePerNight: 28000, rating: 4.7 },
    ],
  },
  'Santiago': {
    name: 'Santiago',
    flights: [
      { provider: 'LATAM', basePrice: 72000, flightDuration: 10 },
      { provider: 'United', basePrice: 76000, flightDuration: 10.5 },
      { provider: 'Delta', basePrice: 74000, flightDuration: 10 },
    ],
    hotels: [
      { name: 'Hotel Boutique Tremo', pricePerNight: 13000, rating: 4.3 },
      { name: 'The Ritz-Carlton Santiago', pricePerNight: 22000, rating: 4.6 },
      { name: 'Mandarin Oriental Santiago', pricePerNight: 35000, rating: 4.8 },
    ],
  },
  'Johannesburg': {
    name: 'Johannesburg',
    flights: [
      { provider: 'South African Airways', basePrice: 92000, flightDuration: 16 },
      { provider: 'Emirates', basePrice: 98000, flightDuration: 18 },
      { provider: 'Lufthansa', basePrice: 95000, flightDuration: 17 },
    ],
    hotels: [
      { name: 'The Peech Hotel', pricePerNight: 14000, rating: 4.4 },
      { name: 'Saxon Hotel', pricePerNight: 28000, rating: 4.7 },
      { name: 'Four Seasons The Westcliff', pricePerNight: 42000, rating: 4.8 },
    ],
  },
  'Nairobi': {
    name: 'Nairobi',
    flights: [
      { provider: 'Kenya Airways', basePrice: 94000, flightDuration: 17 },
      { provider: 'Emirates', basePrice: 100000, flightDuration: 19 },
      { provider: 'Lufthansa', basePrice: 97000, flightDuration: 18 },
    ],
    hotels: [
      { name: 'The Boma Nairobi', pricePerNight: 12000, rating: 4.2 },
      { name: 'Villa Rosa Kempinski', pricePerNight: 22000, rating: 4.6 },
      { name: 'Hemingways Nairobi', pricePerNight: 38000, rating: 4.8 },
    ],
  },
  'Marrakech': {
    name: 'Marrakech',
    flights: [
      { provider: 'Royal Air Maroc', basePrice: 68000, flightDuration: 8 },
      { provider: 'Lufthansa', basePrice: 74000, flightDuration: 9 },
      { provider: 'Air France', basePrice: 71000, flightDuration: 8.5 },
    ],
    hotels: [
      { name: 'Riad Palais Sebban', pricePerNight: 11000, rating: 4.4 },
      { name: 'La Mamounia', pricePerNight: 42000, rating: 4.8 },
      { name: 'Royal Mansour Marrakech', pricePerNight: 88000, rating: 4.9 },
    ],
  },
  'Cairo': {
    name: 'Cairo',
    flights: [
      { provider: 'EgyptAir', basePrice: 72000, flightDuration: 12 },
      { provider: 'Lufthansa', basePrice: 78000, flightDuration: 13 },
      { provider: 'Emirates', basePrice: 75000, flightDuration: 14 },
    ],
    hotels: [
      { name: 'Steigenberger Hotel Tahrir', pricePerNight: 10000, rating: 4.2 },
      { name: 'The Nile Ritz-Carlton', pricePerNight: 22000, rating: 4.6 },
      { name: 'Four Seasons Cairo', pricePerNight: 35000, rating: 4.7 },
    ],
  },
  'Sydney': {
    name: 'Sydney',
    flights: [
      { provider: 'Qantas', basePrice: 120000, flightDuration: 20 },
      { provider: 'United', basePrice: 125000, flightDuration: 21 },
      { provider: 'Air New Zealand', basePrice: 122000, flightDuration: 20.5 },
    ],
    hotels: [
      { name: 'QT Sydney', pricePerNight: 18000, rating: 4.3 },
      { name: 'Shangri-La Sydney', pricePerNight: 32000, rating: 4.6 },
      { name: 'Park Hyatt Sydney', pricePerNight: 65000, rating: 4.8 },
    ],
  },
  'Melbourne': {
    name: 'Melbourne',
    flights: [
      { provider: 'Qantas', basePrice: 118000, flightDuration: 19 },
      { provider: 'United', basePrice: 123000, flightDuration: 20 },
      { provider: 'Air New Zealand', basePrice: 120000, flightDuration: 19.5 },
    ],
    hotels: [
      { name: 'Hotel Lindrum', pricePerNight: 17000, rating: 4.4 },
      { name: 'Crown Towers Melbourne', pricePerNight: 28000, rating: 4.6 },
      { name: 'Park Hyatt Melbourne', pricePerNight: 48000, rating: 4.8 },
    ],
  },
  'Auckland': {
    name: 'Auckland',
    flights: [
      { provider: 'Air New Zealand', basePrice: 115000, flightDuration: 18 },
      { provider: 'Qantas', basePrice: 120000, flightDuration: 19 },
      { provider: 'United', basePrice: 118000, flightDuration: 18.5 },
    ],
    hotels: [
      { name: 'Hotel DeBrett', pricePerNight: 16000, rating: 4.3 },
      { name: 'SkyCity Hotel Auckland', pricePerNight: 22000, rating: 4.5 },
      { name: 'Sofitel Auckland Viaduct', pricePerNight: 35000, rating: 4.7 },
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
