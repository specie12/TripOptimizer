/**
 * AI Agent Service Implementation
 *
 * Implements the 4 AI agents with strict boundaries.
 * This service wraps Claude API calls with clear interfaces and audit logging.
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  ActivityDiscoveryAgent,
  ActivityDiscoveryParams,
  DiscoveredActivity,
  ItineraryCompositionAgent,
  ItineraryCompositionParams,
  ItineraryDay,
  ParsingAgent,
  ParsingParams,
  ParsedBookingData,
  VerificationAgent,
  VerificationParams,
  VerificationResult,
  logAIAgentCall,
} from '../agents/ai-agents';

// Initialize Anthropic client (will be null in mock mode)
let anthropic: Anthropic | null = null;

const MOCK_MODE = process.env.MOCK_CLAUDE === 'true';
const MODEL = 'claude-3-haiku-20240307';

if (!MOCK_MODE && process.env.ANTHROPIC_API_KEY) {
  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

// ============================================
// AGENT 1: ACTIVITY DISCOVERY AGENT
// ============================================

class ActivityDiscoveryAgentImpl implements ActivityDiscoveryAgent {
  async discoverActivities(params: ActivityDiscoveryParams): Promise<DiscoveredActivity[]> {
    const startTime = Date.now();

    if (MOCK_MODE || !anthropic) {
      return this.generateMockActivities(params);
    }

    try {
      const prompt = this.buildActivityDiscoveryPrompt(params);

      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      });

      const textBlock = response.content.find((block) => block.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        throw new Error('No text response from Claude');
      }

      const activities = this.parseActivityDiscoveryResponse(textBlock.text);

      logAIAgentCall({
        timestamp: new Date().toISOString(),
        agentType: 'ACTIVITY_DISCOVERY',
        input: params,
        output: activities,
        modelUsed: MODEL,
        processingTimeMs: Date.now() - startTime,
        success: true,
      });

      return activities;
    } catch (error) {
      console.error('Activity discovery error:', error);

      logAIAgentCall({
        timestamp: new Date().toISOString(),
        agentType: 'ACTIVITY_DISCOVERY',
        input: params,
        output: null,
        modelUsed: MOCK_MODE ? 'mock' : MODEL,
        processingTimeMs: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Fallback to mock in development
      if (process.env.NODE_ENV === 'development') {
        return this.generateMockActivities(params);
      }

      throw error;
    }
  }

  private buildActivityDiscoveryPrompt(params: ActivityDiscoveryParams): string {
    const budgetInDollars = (params.budget / 100).toFixed(2);
    const interestsStr = params.interests?.join(', ') || 'general sightseeing';

    return `You are an activity discovery assistant. Find activities in ${params.destination} for ${params.dates.start} to ${params.dates.end} matching these interests: ${interestsStr}.

Total activity budget: $${budgetInDollars}
Number of days: ${params.numberOfDays}

Return ONLY a JSON array with this exact structure:
[
  {
    "name": "Activity Name",
    "category": "cultural|food|adventure|relaxation|shopping|nightlife|other",
    "typicalPriceRange": { "min": <cents>, "max": <cents> },
    "duration": <minutes>,
    "description": "Brief description"
  }
]

CRITICAL RULES:
1. Do NOT make up activities that don't exist
2. Do NOT set final prices (only typical price RANGE)
3. Do NOT rank or score activities
4. Return NULL if you don't have information
5. Maximum 30 activities
6. typicalPriceRange should be in cents (e.g., 2500 = $25.00)
7. Include mix of free and paid activities
8. Focus on activities that match the interests: ${interestsStr}

Return ONLY the JSON array, nothing else:`;
  }

  private parseActivityDiscoveryResponse(rawJson: string): DiscoveredActivity[] {
    let cleanJson = rawJson.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.slice(7);
    }
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.slice(3);
    }
    if (cleanJson.endsWith('```')) {
      cleanJson = cleanJson.slice(0, -3);
    }
    cleanJson = cleanJson.trim();

    const parsed = JSON.parse(cleanJson);
    if (!Array.isArray(parsed)) {
      throw new Error('Expected JSON array');
    }

    return parsed.map((item) => ({
      name: item.name,
      category: this.normalizeCategory(item.category),
      typicalPriceRange: {
        min: item.typicalPriceRange?.min || 0,
        max: item.typicalPriceRange?.max || 0,
      },
      duration: item.duration || null,
      description: item.description || '',
    }));
  }

  private normalizeCategory(
    category: string
  ): 'cultural' | 'food' | 'adventure' | 'relaxation' | 'shopping' | 'nightlife' | 'other' {
    const validCategories = ['cultural', 'food', 'adventure', 'relaxation', 'shopping', 'nightlife'];
    const lower = category.toLowerCase();
    return validCategories.includes(lower)
      ? (lower as 'cultural' | 'food' | 'adventure' | 'relaxation' | 'shopping' | 'nightlife')
      : 'other';
  }

  private generateMockActivities(params: ActivityDiscoveryParams): DiscoveredActivity[] {
    // Mock activities based on destination
    const mockActivitiesByDestination: Record<string, DiscoveredActivity[]> = {
      Paris: [
        {
          name: 'Visit the Louvre Museum',
          category: 'cultural',
          typicalPriceRange: { min: 1700, max: 2000 },
          duration: 180,
          description: 'Explore world-famous art collections',
        },
        {
          name: 'Eiffel Tower Tour',
          category: 'cultural',
          typicalPriceRange: { min: 2500, max: 3500 },
          duration: 120,
          description: 'Visit iconic landmark with city views',
        },
        {
          name: 'Seine River Cruise',
          category: 'relaxation',
          typicalPriceRange: { min: 1500, max: 2500 },
          duration: 90,
          description: 'Scenic boat tour along the Seine',
        },
        {
          name: 'Montmartre Food Tour',
          category: 'food',
          typicalPriceRange: { min: 5000, max: 8000 },
          duration: 180,
          description: 'Taste local cheese, wine, and pastries',
        },
      ],
      Barcelona: [
        {
          name: 'Sagrada Familia Tour',
          category: 'cultural',
          typicalPriceRange: { min: 2600, max: 3300 },
          duration: 120,
          description: "Guided tour of Gaudí's masterpiece",
        },
        {
          name: 'Tapas Food Tour',
          category: 'food',
          typicalPriceRange: { min: 6000, max: 9000 },
          duration: 180,
          description: 'Sample authentic tapas and local wines',
        },
        {
          name: 'Park Güell Visit',
          category: 'cultural',
          typicalPriceRange: { min: 1000, max: 1300 },
          duration: 90,
          description: "Explore Gaudí's colorful park",
        },
        {
          name: 'Beach Day at Barceloneta',
          category: 'relaxation',
          typicalPriceRange: { min: 0, max: 1000 },
          duration: 240,
          description: 'Relax on the beach with optional water sports',
        },
      ],
    };

    const activities = mockActivitiesByDestination[params.destination] || [
      {
        name: 'City Walking Tour',
        category: 'cultural',
        typicalPriceRange: { min: 2000, max: 4000 },
        duration: 180,
        description: 'Explore main attractions on foot',
      },
      {
        name: 'Local Food Experience',
        category: 'food',
        typicalPriceRange: { min: 5000, max: 8000 },
        duration: 120,
        description: 'Taste authentic local cuisine',
      },
      {
        name: 'Museum Visit',
        category: 'cultural',
        typicalPriceRange: { min: 1500, max: 2500 },
        duration: 120,
        description: 'Visit local museum',
      },
    ];

    return activities;
  }
}

// ============================================
// AGENT 2: ITINERARY COMPOSITION AGENT
// ============================================

class ItineraryCompositionAgentImpl implements ItineraryCompositionAgent {
  async composeItinerary(params: ItineraryCompositionParams): Promise<ItineraryDay[]> {
    const startTime = Date.now();

    if (MOCK_MODE || !anthropic) {
      return this.generateMockItinerary(params);
    }

    try {
      const prompt = this.buildItineraryCompositionPrompt(params);

      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      });

      const textBlock = response.content.find((block) => block.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        throw new Error('No text response from Claude');
      }

      const itinerary = this.parseItineraryResponse(textBlock.text);

      logAIAgentCall({
        timestamp: new Date().toISOString(),
        agentType: 'ITINERARY_COMPOSITION',
        input: params,
        output: itinerary,
        modelUsed: MODEL,
        processingTimeMs: Date.now() - startTime,
        success: true,
      });

      return itinerary;
    } catch (error) {
      console.error('Itinerary composition error:', error);

      logAIAgentCall({
        timestamp: new Date().toISOString(),
        agentType: 'ITINERARY_COMPOSITION',
        input: params,
        output: null,
        modelUsed: MOCK_MODE ? 'mock' : MODEL,
        processingTimeMs: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Fallback to mock
      if (process.env.NODE_ENV === 'development') {
        return this.generateMockItinerary(params);
      }

      throw error;
    }
  }

  private buildItineraryCompositionPrompt(params: ItineraryCompositionParams): string {
    const activitiesStr = params.activities
      .map((a) => `- ${a.name} (${a.date}${a.time ? ' at ' + a.time : ''})`)
      .join('\n');

    return `You are an itinerary composition assistant. Create a day-by-day schedule for this trip using the CONFIRMED bookings below.

Destination: ${params.destination}
Dates: ${params.dates.start} to ${params.dates.end}

CONFIRMED FLIGHT:
- Outbound: ${params.flight.outbound.provider} ${params.flight.outbound.flightNumber}
  Departure: ${params.flight.outbound.departure}
  Arrival: ${params.flight.outbound.arrival}
${params.flight.return ? `- Return: ${params.flight.return.provider} ${params.flight.return.flightNumber}\n  Departure: ${params.flight.return.departure}\n  Arrival: ${params.flight.return.arrival}` : ''}

CONFIRMED HOTEL:
- ${params.hotel.name}
  Check-in: ${params.hotel.checkIn}
  Check-out: ${params.hotel.checkOut}
${params.hotel.address ? `  Address: ${params.hotel.address}` : ''}

CONFIRMED ACTIVITIES:
${activitiesStr}

Return a JSON array representing each day:
[
  {
    "day": 1,
    "date": "YYYY-MM-DD",
    "title": "Short day title",
    "activities": [
      {
        "time": "HH:MM",
        "type": "flight|hotel|activity|meal|transport|free-time",
        "name": "Activity name",
        "description": "Brief description"
      }
    ],
    "meals": ["Meal suggestion 1", "Meal suggestion 2"],
    "notes": "Logistical tips and recommendations"
  }
]

RULES:
1. Use ONLY the confirmed bookings provided
2. Do NOT add unbooked activities
3. Do NOT change times or bookings
4. Arrange activities logically (consider travel time, meal breaks)
5. Add helpful notes (e.g., "Book restaurant reservation in advance")
6. Include meal suggestions based on location

Return ONLY the JSON array, nothing else:`;
  }

  private parseItineraryResponse(rawJson: string): ItineraryDay[] {
    let cleanJson = rawJson.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.slice(7);
    }
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.slice(3);
    }
    if (cleanJson.endsWith('```')) {
      cleanJson = cleanJson.slice(0, -3);
    }
    cleanJson = cleanJson.trim();

    const parsed = JSON.parse(cleanJson);
    if (!Array.isArray(parsed)) {
      throw new Error('Expected JSON array');
    }

    return parsed as ItineraryDay[];
  }

  private generateMockItinerary(params: ItineraryCompositionParams): ItineraryDay[] {
    const startDate = new Date(params.dates.start);
    const endDate = new Date(params.dates.end);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const itinerary: ItineraryDay[] = [];

    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];

      itinerary.push({
        day: i + 1,
        date: dateStr,
        title: i === 0 ? 'Arrival Day' : i === days - 1 ? 'Departure Day' : `Day ${i + 1} - Exploring`,
        activities: [
          {
            time: '09:00',
            type: 'meal',
            name: 'Breakfast',
            description: 'Start your day with a local breakfast',
          },
          {
            time: '10:00',
            type: 'activity',
            name: 'Morning exploration',
            description: 'Explore local attractions',
          },
          {
            time: '13:00',
            type: 'meal',
            name: 'Lunch',
            description: 'Try local cuisine',
          },
          {
            time: '15:00',
            type: 'activity',
            name: 'Afternoon activity',
            description: 'Continued sightseeing',
          },
          {
            time: '19:00',
            type: 'meal',
            name: 'Dinner',
            description: 'Evening dining experience',
          },
        ],
        meals: ['Breakfast at hotel', 'Lunch at local restaurant', 'Dinner near hotel'],
        notes: 'Remember to bring comfortable walking shoes',
      });
    }

    return itinerary;
  }
}

// ============================================
// SINGLETON INSTANCES
// ============================================

export const activityDiscoveryAgent: ActivityDiscoveryAgent = new ActivityDiscoveryAgentImpl();
export const itineraryCompositionAgent: ItineraryCompositionAgent = new ItineraryCompositionAgentImpl();

// Parsing and Verification agents are already implemented in separate services
// We'll import and re-export them for consistency
export { parseBookingContent as parsingAgentParse } from './parsing.service';
export { verifyEntity as verificationAgentVerify } from './verification.service';
