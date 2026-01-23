/**
 * Mock Activities Configuration (Phase 3)
 *
 * Realistic mock activity data for various destinations
 * In production, this would be replaced with real API integrations
 */

import { ActivityCategory } from '@prisma/client';
import { ActivityCandidate } from '../types/activity.types';

// Re-export ActivityCandidate for integrations
export type { ActivityCandidate };

/**
 * Activity database by destination
 */
export const MOCK_ACTIVITIES: Record<string, ActivityCandidate[]> = {
  Paris: [
    {
      name: 'Eiffel Tower Summit Access',
      category: ActivityCategory.ATTRACTION,
      description:
        'Skip-the-line access to the Eiffel Tower summit with breathtaking views of Paris. Includes elevator to the top.',
      duration: 120,
      price: 3500, // $35
      rating: 4.7,
      reviewCount: 12543,
      deepLink: 'https://example.com/eiffel-tower',
      imageUrl: 'https://example.com/images/eiffel.jpg',
    },
    {
      name: 'Louvre Museum Guided Tour',
      category: ActivityCategory.ATTRACTION,
      description:
        'Expert-guided 3-hour tour of the Louvre, including Mona Lisa and Venus de Milo. Skip-the-line entry included.',
      duration: 180,
      price: 6900, // $69
      rating: 4.8,
      reviewCount: 8932,
      deepLink: 'https://example.com/louvre-tour',
      imageUrl: 'https://example.com/images/louvre.jpg',
    },
    {
      name: 'Seine River Dinner Cruise',
      category: ActivityCategory.EXPERIENCE,
      description:
        '2.5-hour dinner cruise on the Seine with live music, 3-course meal, and panoramic views of Paris landmarks.',
      duration: 150,
      price: 8500, // $85
      rating: 4.6,
      reviewCount: 5421,
      deepLink: 'https://example.com/seine-cruise',
      imageUrl: 'https://example.com/images/seine.jpg',
    },
    {
      name: 'Versailles Palace & Gardens Tour',
      category: ActivityCategory.TOUR,
      description:
        'Full-day guided tour of Versailles Palace and gardens with roundtrip transport from Paris. Skip-the-line access.',
      duration: 480,
      price: 9900, // $99
      rating: 4.9,
      reviewCount: 7654,
      deepLink: 'https://example.com/versailles',
      imageUrl: 'https://example.com/images/versailles.jpg',
    },
    {
      name: 'Montmartre Walking Tour',
      category: ActivityCategory.TOUR,
      description:
        '2-hour walking tour of Montmartre including Sacré-Cœur, artists square, and charming cobblestone streets.',
      duration: 120,
      price: 2900, // $29
      rating: 4.7,
      reviewCount: 3210,
      deepLink: 'https://example.com/montmartre',
      imageUrl: 'https://example.com/images/montmartre.jpg',
    },
    {
      name: 'French Cooking Class',
      category: ActivityCategory.EXPERIENCE,
      description:
        'Hands-on French cooking class with a professional chef. Learn to make classic dishes and enjoy your creations.',
      duration: 210,
      price: 12500, // $125
      rating: 4.9,
      reviewCount: 1876,
      deepLink: 'https://example.com/cooking-class',
      imageUrl: 'https://example.com/images/cooking.jpg',
    },
    {
      name: 'Moulin Rouge Show',
      category: ActivityCategory.ENTERTAINMENT,
      description:
        'Evening show at the legendary Moulin Rouge cabaret, including champagne and optional dinner.',
      duration: 120,
      price: 11000, // $110
      rating: 4.5,
      reviewCount: 4532,
      deepLink: 'https://example.com/moulin-rouge',
      imageUrl: 'https://example.com/images/moulin.jpg',
    },
  ],

  Tokyo: [
    {
      name: 'Tokyo Skytree Admission',
      category: ActivityCategory.ATTRACTION,
      description:
        'Fast-track entry to Tokyo Skytree observation decks with stunning 360° views of the city.',
      duration: 90,
      price: 2800, // $28
      rating: 4.6,
      reviewCount: 9876,
      deepLink: 'https://example.com/skytree',
      imageUrl: 'https://example.com/images/skytree.jpg',
    },
    {
      name: 'Sushi Making Class',
      category: ActivityCategory.EXPERIENCE,
      description:
        'Learn to make authentic sushi from a professional chef in a traditional Tokyo kitchen. Includes meal.',
      duration: 180,
      price: 9500, // $95
      rating: 4.9,
      reviewCount: 2341,
      deepLink: 'https://example.com/sushi-class',
      imageUrl: 'https://example.com/images/sushi.jpg',
    },
    {
      name: 'Mt. Fuji Day Trip',
      category: ActivityCategory.TOUR,
      description:
        'Full-day guided tour to Mt. Fuji and Lake Kawaguchi with roundtrip transport from Tokyo.',
      duration: 600,
      price: 11900, // $119
      rating: 4.8,
      reviewCount: 5632,
      deepLink: 'https://example.com/fuji-tour',
      imageUrl: 'https://example.com/images/fuji.jpg',
    },
    {
      name: 'Shibuya & Harajuku Walking Tour',
      category: ActivityCategory.TOUR,
      description:
        '3-hour walking tour of Tokyo\'s trendiest neighborhoods with a local guide. Includes street food samples.',
      duration: 180,
      price: 4500, // $45
      rating: 4.7,
      reviewCount: 3456,
      deepLink: 'https://example.com/shibuya-tour',
      imageUrl: 'https://example.com/images/shibuya.jpg',
    },
    {
      name: 'Traditional Tea Ceremony',
      category: ActivityCategory.EXPERIENCE,
      description:
        'Authentic Japanese tea ceremony experience in a traditional tea house with kimono rental included.',
      duration: 120,
      price: 7800, // $78
      rating: 4.8,
      reviewCount: 1987,
      deepLink: 'https://example.com/tea-ceremony',
      imageUrl: 'https://example.com/images/tea.jpg',
    },
    {
      name: 'TeamLab Borderless Museum',
      category: ActivityCategory.ATTRACTION,
      description:
        'Immersive digital art museum with interactive installations and stunning visual experiences.',
      duration: 150,
      price: 3200, // $32
      rating: 4.9,
      reviewCount: 8765,
      deepLink: 'https://example.com/teamlab',
      imageUrl: 'https://example.com/images/teamlab.jpg',
    },
  ],

  London: [
    {
      name: 'Tower of London & Crown Jewels',
      category: ActivityCategory.ATTRACTION,
      description:
        'Skip-the-line access to the historic Tower of London with Yeoman Warder tour and Crown Jewels viewing.',
      duration: 180,
      price: 4200, // $42
      rating: 4.7,
      reviewCount: 11234,
      deepLink: 'https://example.com/tower-london',
      imageUrl: 'https://example.com/images/tower.jpg',
    },
    {
      name: 'London Eye Fast Track',
      category: ActivityCategory.ATTRACTION,
      description:
        'Fast-track 30-minute rotation on the iconic London Eye with panoramic views of the city.',
      duration: 45,
      price: 3800, // $38
      rating: 4.6,
      reviewCount: 15678,
      deepLink: 'https://example.com/london-eye',
      imageUrl: 'https://example.com/images/eye.jpg',
    },
    {
      name: 'Harry Potter Warner Bros. Studio Tour',
      category: ActivityCategory.TOUR,
      description:
        'Full-day tour of the Warner Bros. Studio with sets, costumes, and props from the Harry Potter films. Includes transport.',
      duration: 420,
      price: 12500, // $125
      rating: 4.9,
      reviewCount: 9876,
      deepLink: 'https://example.com/harry-potter',
      imageUrl: 'https://example.com/images/potter.jpg',
    },
    {
      name: 'West End Theatre Show',
      category: ActivityCategory.ENTERTAINMENT,
      description:
        'Premium seats to a top West End musical or play. Show selection based on availability.',
      duration: 180,
      price: 8500, // $85
      rating: 4.8,
      reviewCount: 6543,
      deepLink: 'https://example.com/west-end',
      imageUrl: 'https://example.com/images/theatre.jpg',
    },
    {
      name: 'British Museum Guided Tour',
      category: ActivityCategory.ATTRACTION,
      description:
        '2.5-hour expert-guided tour of the British Museum highlights including Rosetta Stone and Egyptian mummies.',
      duration: 150,
      price: 4900, // $49
      rating: 4.7,
      reviewCount: 4321,
      deepLink: 'https://example.com/british-museum',
      imageUrl: 'https://example.com/images/museum.jpg',
    },
    {
      name: 'Thames River Cruise',
      category: ActivityCategory.EXPERIENCE,
      description:
        'Sightseeing cruise on the Thames from Westminster to Greenwich with live commentary.',
      duration: 90,
      price: 2800, // $28
      rating: 4.5,
      reviewCount: 7654,
      deepLink: 'https://example.com/thames-cruise',
      imageUrl: 'https://example.com/images/thames.jpg',
    },
  ],

  'New York': [
    {
      name: 'Statue of Liberty & Ellis Island Tour',
      category: ActivityCategory.TOUR,
      description:
        'Ferry tour to Statue of Liberty and Ellis Island with skip-the-line access and audio guide.',
      duration: 240,
      price: 4500, // $45
      rating: 4.6,
      reviewCount: 18765,
      deepLink: 'https://example.com/statue-liberty',
      imageUrl: 'https://example.com/images/liberty.jpg',
    },
    {
      name: 'Empire State Building Observatory',
      category: ActivityCategory.ATTRACTION,
      description:
        'Skip-the-line access to the iconic Empire State Building 86th floor observatory.',
      duration: 90,
      price: 4200, // $42
      rating: 4.7,
      reviewCount: 23456,
      deepLink: 'https://example.com/empire-state',
      imageUrl: 'https://example.com/images/empire.jpg',
    },
    {
      name: 'Broadway Show Premium Seats',
      category: ActivityCategory.ENTERTAINMENT,
      description:
        'Premium orchestra seats to a top Broadway show. Selection includes Hamilton, Wicked, and more.',
      duration: 180,
      price: 15000, // $150
      rating: 4.9,
      reviewCount: 12345,
      deepLink: 'https://example.com/broadway',
      imageUrl: 'https://example.com/images/broadway.jpg',
    },
    {
      name: 'Central Park Bike Tour',
      category: ActivityCategory.TOUR,
      description:
        '2-hour guided bike tour of Central Park with bike and helmet rental included.',
      duration: 120,
      price: 5500, // $55
      rating: 4.8,
      reviewCount: 6789,
      deepLink: 'https://example.com/central-park',
      imageUrl: 'https://example.com/images/park.jpg',
    },
    {
      name: 'MoMA Museum Admission',
      category: ActivityCategory.ATTRACTION,
      description:
        'Skip-the-line entry to the Museum of Modern Art with world-class collection of modern and contemporary art.',
      duration: 150,
      price: 2800, // $28
      rating: 4.7,
      reviewCount: 9876,
      deepLink: 'https://example.com/moma',
      imageUrl: 'https://example.com/images/moma.jpg',
    },
  ],

  Barcelona: [
    {
      name: 'Sagrada Familia Skip-the-Line',
      category: ActivityCategory.ATTRACTION,
      description:
        'Fast-track entry to Gaudí\'s masterpiece with tower access and audio guide.',
      duration: 120,
      price: 3900, // $39
      rating: 4.9,
      reviewCount: 16789,
      deepLink: 'https://example.com/sagrada',
      imageUrl: 'https://example.com/images/sagrada.jpg',
    },
    {
      name: 'Park Güell Guided Tour',
      category: ActivityCategory.TOUR,
      description:
        '2-hour guided tour of Park Güell with skip-the-line entry and insights into Gaudí\'s work.',
      duration: 120,
      price: 3200, // $32
      rating: 4.7,
      reviewCount: 8765,
      deepLink: 'https://example.com/park-guell',
      imageUrl: 'https://example.com/images/guell.jpg',
    },
    {
      name: 'Tapas Walking Tour',
      category: ActivityCategory.EXPERIENCE,
      description:
        '3-hour tapas and wine tasting tour through the Gothic Quarter with a local guide.',
      duration: 180,
      price: 7900, // $79
      rating: 4.8,
      reviewCount: 5432,
      deepLink: 'https://example.com/tapas-tour',
      imageUrl: 'https://example.com/images/tapas.jpg',
    },
    {
      name: 'Flamenco Show with Dinner',
      category: ActivityCategory.ENTERTAINMENT,
      description:
        'Authentic flamenco performance in a traditional tablao with 3-course dinner and drinks.',
      duration: 180,
      price: 9500, // $95
      rating: 4.9,
      reviewCount: 4321,
      deepLink: 'https://example.com/flamenco',
      imageUrl: 'https://example.com/images/flamenco.jpg',
    },
    {
      name: 'Montserrat Monastery Day Trip',
      category: ActivityCategory.TOUR,
      description:
        'Full-day tour to Montserrat mountain monastery with roundtrip transport and wine tasting.',
      duration: 480,
      price: 8500, // $85
      rating: 4.7,
      reviewCount: 6543,
      deepLink: 'https://example.com/montserrat',
      imageUrl: 'https://example.com/images/montserrat.jpg',
    },
  ],
};

/**
 * Get mock activities for a destination
 */
export function getMockActivitiesForDestination(destination: string): ActivityCandidate[] {
  // Try exact match first
  if (MOCK_ACTIVITIES[destination]) {
    return MOCK_ACTIVITIES[destination];
  }

  // Try case-insensitive match
  const normalizedDestination = destination.toLowerCase();
  for (const [key, activities] of Object.entries(MOCK_ACTIVITIES)) {
    if (key.toLowerCase() === normalizedDestination) {
      return activities;
    }
  }

  // Return Paris as default fallback
  return MOCK_ACTIVITIES.Paris;
}

/**
 * Get all available destinations
 */
export function getAvailableDestinations(): string[] {
  return Object.keys(MOCK_ACTIVITIES);
}
