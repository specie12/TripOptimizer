/**
 * Activity Database Seed
 *
 * Comprehensive database of popular activities for major destinations.
 * Used as fallback when AI/API discovery fails.
 *
 * Format:
 * - Prices in cents
 * - Duration in minutes
 * - Categories: cultural, food, adventure, relaxation, shopping, nightlife, other
 */

import { DiscoveredActivity } from '../agents/ai-agents';

export const ACTIVITY_DATABASE: Record<string, DiscoveredActivity[]> = {
  // ============================================
  // BARCELONA, SPAIN
  // ============================================
  Barcelona: [
    {
      name: 'Sagrada Familia Tour',
      category: 'cultural',
      typicalPriceRange: { min: 2600, max: 3400 },
      duration: 120,
      description: 'Explore Gaudí\'s unfinished masterpiece with skip-the-line access',
    },
    {
      name: 'Park Güell Visit',
      category: 'cultural',
      typicalPriceRange: { min: 1000, max: 1300 },
      duration: 90,
      description: 'Wander through Gaudí\'s colorful mosaic park',
    },
    {
      name: 'Tapas Walking Tour',
      category: 'food',
      typicalPriceRange: { min: 6000, max: 9000 },
      duration: 180,
      description: 'Sample authentic tapas at local bars in Gothic Quarter',
    },
    {
      name: 'La Boqueria Market Visit',
      category: 'food',
      typicalPriceRange: { min: 0, max: 0 },
      duration: 60,
      description: 'Browse fresh produce and local delicacies at famous market',
    },
    {
      name: 'Beach Day at Barceloneta',
      category: 'relaxation',
      typicalPriceRange: { min: 0, max: 0 },
      duration: 240,
      description: 'Relax on Barcelona\'s most popular beach',
    },
    {
      name: 'Gothic Quarter Walking Tour',
      category: 'cultural',
      typicalPriceRange: { min: 0, max: 2500 },
      duration: 120,
      description: 'Discover medieval streets and Roman ruins',
    },
    {
      name: 'Camp Nou Stadium Tour',
      category: 'cultural',
      typicalPriceRange: { min: 2800, max: 3500 },
      duration: 90,
      description: 'Tour FC Barcelona\'s iconic stadium and museum',
    },
    {
      name: 'Montjuïc Cable Car Ride',
      category: 'adventure',
      typicalPriceRange: { min: 1300, max: 1700 },
      duration: 30,
      description: 'Aerial views of Barcelona and harbor',
    },
    {
      name: 'Wine Tasting in Penedès',
      category: 'food',
      typicalPriceRange: { min: 7000, max: 12000 },
      duration: 300,
      description: 'Day trip to nearby wine region with tastings',
    },
    {
      name: 'Flamenco Show',
      category: 'nightlife',
      typicalPriceRange: { min: 3500, max: 6000 },
      duration: 90,
      description: 'Authentic flamenco performance with drinks',
    },
  ],

  // ============================================
  // PARIS, FRANCE
  // ============================================
  Paris: [
    {
      name: 'Eiffel Tower Summit',
      category: 'cultural',
      typicalPriceRange: { min: 2800, max: 3500 },
      duration: 120,
      description: 'Ascend to the top of Paris\'s iconic landmark',
    },
    {
      name: 'Louvre Museum Tour',
      category: 'cultural',
      typicalPriceRange: { min: 1700, max: 5000 },
      duration: 180,
      description: 'Explore world-famous art including Mona Lisa',
    },
    {
      name: 'Seine River Cruise',
      category: 'relaxation',
      typicalPriceRange: { min: 1500, max: 4000 },
      duration: 60,
      description: 'Scenic boat tour past Parisian landmarks',
    },
    {
      name: 'Montmartre Walking Tour',
      category: 'cultural',
      typicalPriceRange: { min: 0, max: 2500 },
      duration: 120,
      description: 'Discover artists\' quarter and Sacré-Cœur',
    },
    {
      name: 'French Cooking Class',
      category: 'food',
      typicalPriceRange: { min: 8000, max: 15000 },
      duration: 180,
      description: 'Learn to make classic French dishes',
    },
    {
      name: 'Versailles Palace Day Trip',
      category: 'cultural',
      typicalPriceRange: { min: 5000, max: 9000 },
      duration: 360,
      description: 'Visit Louis XIV\'s opulent palace and gardens',
    },
    {
      name: 'Wine & Cheese Tasting',
      category: 'food',
      typicalPriceRange: { min: 4500, max: 8000 },
      duration: 120,
      description: 'Sample French wines and artisan cheeses',
    },
    {
      name: 'Moulin Rouge Show',
      category: 'nightlife',
      typicalPriceRange: { min: 9000, max: 18000 },
      duration: 120,
      description: 'Iconic cabaret show with dinner option',
    },
    {
      name: 'Latin Quarter Food Tour',
      category: 'food',
      typicalPriceRange: { min: 6000, max: 10000 },
      duration: 180,
      description: 'Taste your way through historic neighborhood',
    },
    {
      name: 'Luxembourg Gardens Stroll',
      category: 'relaxation',
      typicalPriceRange: { min: 0, max: 0 },
      duration: 90,
      description: 'Peaceful walk through beautiful gardens',
    },
  ],

  // ============================================
  // TOKYO, JAPAN
  // ============================================
  Tokyo: [
    {
      name: 'Tsukiji Fish Market Tour',
      category: 'food',
      typicalPriceRange: { min: 4000, max: 8000 },
      duration: 180,
      description: 'Early morning market visit with sushi breakfast',
    },
    {
      name: 'Senso-ji Temple Visit',
      category: 'cultural',
      typicalPriceRange: { min: 0, max: 0 },
      duration: 90,
      description: 'Tokyo\'s oldest temple in Asakusa',
    },
    {
      name: 'Shibuya Crossing Experience',
      category: 'cultural',
      typicalPriceRange: { min: 0, max: 0 },
      duration: 30,
      description: 'World\'s busiest pedestrian crossing',
    },
    {
      name: 'Sushi Making Class',
      category: 'food',
      typicalPriceRange: { min: 8000, max: 15000 },
      duration: 150,
      description: 'Learn to make authentic sushi',
    },
    {
      name: 'Tokyo Skytree Observatory',
      category: 'cultural',
      typicalPriceRange: { min: 2500, max: 3500 },
      duration: 90,
      description: 'Panoramic city views from Japan\'s tallest tower',
    },
    {
      name: 'Harajuku Fashion Walk',
      category: 'shopping',
      typicalPriceRange: { min: 0, max: 0 },
      duration: 120,
      description: 'Explore trendy fashion district',
    },
    {
      name: 'Traditional Tea Ceremony',
      category: 'cultural',
      typicalPriceRange: { min: 4000, max: 7000 },
      duration: 90,
      description: 'Experience authentic Japanese tea ritual',
    },
    {
      name: 'Sumo Wrestling Tournament',
      category: 'cultural',
      typicalPriceRange: { min: 5000, max: 15000 },
      duration: 240,
      description: 'Watch traditional sumo matches (seasonal)',
    },
    {
      name: 'Shinjuku Robot Restaurant',
      category: 'nightlife',
      typicalPriceRange: { min: 8000, max: 12000 },
      duration: 90,
      description: 'Futuristic dinner show experience',
    },
    {
      name: 'Mt. Fuji Day Trip',
      category: 'adventure',
      typicalPriceRange: { min: 10000, max: 18000 },
      duration: 600,
      description: 'Guided tour to Japan\'s iconic mountain',
    },
  ],

  // ============================================
  // NEW YORK CITY, USA
  // ============================================
  'New York': [
    {
      name: 'Statue of Liberty & Ellis Island',
      category: 'cultural',
      typicalPriceRange: { min: 2400, max: 3500 },
      duration: 240,
      description: 'Ferry to iconic statue and immigration museum',
    },
    {
      name: 'Central Park Walking Tour',
      category: 'relaxation',
      typicalPriceRange: { min: 0, max: 3000 },
      duration: 120,
      description: 'Explore Manhattan\'s famous green space',
    },
    {
      name: 'Broadway Show',
      category: 'nightlife',
      typicalPriceRange: { min: 8000, max: 25000 },
      duration: 150,
      description: 'World-class theater performance',
    },
    {
      name: 'Metropolitan Museum of Art',
      category: 'cultural',
      typicalPriceRange: { min: 2500, max: 3000 },
      duration: 180,
      description: 'One of the world\'s largest art museums',
    },
    {
      name: 'Brooklyn Bridge Walk',
      category: 'relaxation',
      typicalPriceRange: { min: 0, max: 0 },
      duration: 60,
      description: 'Cross iconic bridge with city views',
    },
    {
      name: 'Food Tour in Greenwich Village',
      category: 'food',
      typicalPriceRange: { min: 7000, max: 12000 },
      duration: 180,
      description: 'Sample diverse cuisines in historic neighborhood',
    },
    {
      name: 'Empire State Building Observatory',
      category: 'cultural',
      typicalPriceRange: { min: 4200, max: 7500 },
      duration: 90,
      description: 'Iconic skyscraper views day or night',
    },
    {
      name: '9/11 Memorial & Museum',
      category: 'cultural',
      typicalPriceRange: { min: 0, max: 2800 },
      duration: 120,
      description: 'Moving tribute to September 11th',
    },
    {
      name: 'High Line Park Walk',
      category: 'relaxation',
      typicalPriceRange: { min: 0, max: 0 },
      duration: 90,
      description: 'Elevated park on historic rail line',
    },
    {
      name: 'Shopping on Fifth Avenue',
      category: 'shopping',
      typicalPriceRange: { min: 0, max: 0 },
      duration: 180,
      description: 'Browse luxury stores and flagship shops',
    },
  ],

  // ============================================
  // LONDON, UNITED KINGDOM
  // ============================================
  London: [
    {
      name: 'Tower of London Tour',
      category: 'cultural',
      typicalPriceRange: { min: 3100, max: 3700 },
      duration: 150,
      description: 'Historic fortress and Crown Jewels',
    },
    {
      name: 'British Museum Visit',
      category: 'cultural',
      typicalPriceRange: { min: 0, max: 0 },
      duration: 180,
      description: 'World history and culture collections (free entry)',
    },
    {
      name: 'Westminster Abbey & Big Ben',
      category: 'cultural',
      typicalPriceRange: { min: 2700, max: 3200 },
      duration: 120,
      description: 'Gothic church and iconic clock tower',
    },
    {
      name: 'West End Theatre Show',
      category: 'nightlife',
      typicalPriceRange: { min: 5000, max: 15000 },
      duration: 150,
      description: 'World-class musical or play',
    },
    {
      name: 'Afternoon Tea Experience',
      category: 'food',
      typicalPriceRange: { min: 4000, max: 8000 },
      duration: 120,
      description: 'Traditional British tea with sandwiches and scones',
    },
    {
      name: 'Thames River Cruise',
      category: 'relaxation',
      typicalPriceRange: { min: 1500, max: 3500 },
      duration: 60,
      description: 'Sightseeing cruise past London landmarks',
    },
    {
      name: 'Camden Market Exploration',
      category: 'shopping',
      typicalPriceRange: { min: 0, max: 0 },
      duration: 120,
      description: 'Browse eclectic market stalls',
    },
    {
      name: 'Stonehenge Day Trip',
      category: 'cultural',
      typicalPriceRange: { min: 8000, max: 13000 },
      duration: 480,
      description: 'Visit prehistoric monument outside London',
    },
    {
      name: 'London Eye Ride',
      category: 'adventure',
      typicalPriceRange: { min: 3500, max: 4500 },
      duration: 45,
      description: 'Giant Ferris wheel with panoramic views',
    },
    {
      name: 'Pub Crawl in Shoreditch',
      category: 'nightlife',
      typicalPriceRange: { min: 3000, max: 5000 },
      duration: 180,
      description: 'Explore trendy bars and pubs',
    },
  ],

  // ============================================
  // ROME, ITALY
  // ============================================
  Rome: [
    {
      name: 'Colosseum & Roman Forum',
      category: 'cultural',
      typicalPriceRange: { min: 2000, max: 5500 },
      duration: 180,
      description: 'Ancient amphitheater and ruins',
    },
    {
      name: 'Vatican Museums & Sistine Chapel',
      category: 'cultural',
      typicalPriceRange: { min: 3000, max: 7000 },
      duration: 240,
      description: 'Renaissance art and Michelangelo\'s masterpiece',
    },
    {
      name: 'Trevi Fountain Visit',
      category: 'cultural',
      typicalPriceRange: { min: 0, max: 0 },
      duration: 30,
      description: 'Iconic baroque fountain (free)',
    },
    {
      name: 'Pasta Making Class',
      category: 'food',
      typicalPriceRange: { min: 7000, max: 12000 },
      duration: 180,
      description: 'Learn to make traditional Italian pasta',
    },
    {
      name: 'Food Tour in Trastevere',
      category: 'food',
      typicalPriceRange: { min: 6000, max: 10000 },
      duration: 180,
      description: 'Sample authentic Roman cuisine',
    },
    {
      name: 'Pantheon Visit',
      category: 'cultural',
      typicalPriceRange: { min: 0, max: 500 },
      duration: 45,
      description: 'Ancient Roman temple with massive dome',
    },
    {
      name: 'Spanish Steps & Borghese Gardens',
      category: 'relaxation',
      typicalPriceRange: { min: 0, max: 0 },
      duration: 90,
      description: 'Elegant stairway and peaceful park',
    },
    {
      name: 'Wine Tasting in Frascati',
      category: 'food',
      typicalPriceRange: { min: 6000, max: 11000 },
      duration: 300,
      description: 'Day trip to nearby wine region',
    },
    {
      name: 'Vespa Tour of Rome',
      category: 'adventure',
      typicalPriceRange: { min: 12000, max: 18000 },
      duration: 180,
      description: 'Explore the city on a classic scooter',
    },
    {
      name: 'Pompeii Day Trip',
      category: 'cultural',
      typicalPriceRange: { min: 10000, max: 16000 },
      duration: 540,
      description: 'Visit ancient city preserved by volcanic ash',
    },
  ],
};

/**
 * Get activities for a destination
 * Returns empty array if destination not found
 */
export function getActivitiesForDestination(destination: string): DiscoveredActivity[] {
  // Try exact match first
  if (ACTIVITY_DATABASE[destination]) {
    return ACTIVITY_DATABASE[destination];
  }

  // Try case-insensitive match
  const normalizedDest = destination.toLowerCase();
  for (const [key, activities] of Object.entries(ACTIVITY_DATABASE)) {
    if (key.toLowerCase() === normalizedDest) {
      return activities;
    }
  }

  // Try partial match (e.g., "New York City" matches "New York")
  for (const [key, activities] of Object.entries(ACTIVITY_DATABASE)) {
    if (normalizedDest.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedDest)) {
      return activities;
    }
  }

  return [];
}

/**
 * Get all available destinations
 */
export function getAvailableDestinations(): string[] {
  return Object.keys(ACTIVITY_DATABASE);
}

/**
 * Filter activities by category and budget
 */
export function filterActivities(
  activities: DiscoveredActivity[],
  options: {
    categories?: string[];
    maxBudget?: number;
    minDuration?: number;
    maxDuration?: number;
  }
): DiscoveredActivity[] {
  let filtered = activities;

  if (options.categories && options.categories.length > 0) {
    filtered = filtered.filter((a) => options.categories!.includes(a.category));
  }

  if (options.maxBudget !== undefined) {
    filtered = filtered.filter((a) => a.typicalPriceRange.min <= options.maxBudget!);
  }

  if (options.minDuration !== undefined) {
    filtered = filtered.filter((a) => !a.duration || a.duration >= options.minDuration!);
  }

  if (options.maxDuration !== undefined) {
    filtered = filtered.filter((a) => !a.duration || a.duration <= options.maxDuration!);
  }

  return filtered;
}
