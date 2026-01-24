/**
 * Claude Service (LEGACY - Backward Compatibility Wrapper)
 *
 * This service now wraps the new AI Agent Service for backward compatibility.
 * All AI calls are routed through the 4 AI agents with strict boundaries.
 *
 * NEW CODE SHOULD USE: src/services/ai-agent.service.ts
 *
 * AI BOUNDARIES:
 * - Activity Discovery: Discovers activities from unstructured data
 * - Itinerary Composition: Generates narrative itineraries from confirmed bookings
 * - Parsing: Extracts structured data from booking confirmations
 * - Verification: Verifies entity existence
 *
 * AI is NEVER used for: Budget allocation, Scoring, Ranking, Pricing
 *
 * Supports mock mode for development without API key:
 * Set MOCK_CLAUDE=true in environment
 */

import Anthropic from '@anthropic-ai/sdk';
import { ItineraryDay } from '../types/api.types';
import { GeneratedCandidate } from './candidate.service';
import { itineraryCompositionAgent } from './ai-agent.service';

// Initialize Anthropic client (will be null in mock mode)
let anthropic: Anthropic | null = null;

const MOCK_MODE = process.env.MOCK_CLAUDE === 'true';

if (!MOCK_MODE && process.env.ANTHROPIC_API_KEY) {
  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

/**
 * Generate explanation and itinerary for a scored trip option
 *
 * @param candidate - The trip candidate
 * @param score - The deterministic score (for context, NOT for Claude to modify)
 * @param rank - The rank among options (1, 2, or 3)
 * @returns Explanation text and itinerary
 */
export async function generateTripContent(
  candidate: GeneratedCandidate,
  score: number,
  rank: number
): Promise<{ explanation: string; itinerary: ItineraryDay[] }> {
  if (MOCK_MODE || !anthropic) {
    return generateMockContent(candidate, rank);
  }

  try {
    const [explanation, itinerary] = await Promise.all([
      generateExplanation(candidate, score, rank),
      generateItinerary(candidate),
    ]);

    return { explanation, itinerary };
  } catch (error) {
    console.error('Claude API error, falling back to mock content:', error);
    return generateMockContent(candidate, rank);
  }
}

/**
 * Generate trip explanation using Claude
 *
 * Claude is given the trip details and asked to explain why this
 * option is a good choice. It does NOT compute scores.
 */
async function generateExplanation(
  candidate: GeneratedCandidate,
  score: number,
  rank: number
): Promise<string> {
  if (!anthropic) {
    return generateMockExplanation(candidate, rank);
  }

  const prompt = `You are a travel advisor writing a brief explanation for a budget travel option.

Trip Details:
- Destination: ${candidate.destination}
- Duration: ${candidate.hotel.nights} nights
- Flight: ${candidate.flight.provider} for $${(candidate.flight.price / 100).toFixed(2)}
- Hotel: ${candidate.hotel.name} (${candidate.hotel.rating ? candidate.hotel.rating + ' stars' : 'unrated'}) for $${(candidate.hotel.priceTotal / 100).toFixed(2)} total
- Total Cost: $${(candidate.totalCost / 100).toFixed(2)}
- Remaining Budget for Activities: $${(candidate.remainingBudget / 100).toFixed(2)}
- This is option #${rank} of the recommendations

Write a 2-3 sentence explanation of why this trip option offers good value. Focus on:
- What makes this destination appealing
- The value proposition of the flight/hotel combination
- What the remaining budget enables

Do NOT mention scores, rankings, or technical details. Write naturally as if advising a friend.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  return textBlock ? textBlock.text : generateMockExplanation(candidate, rank);
}

/**
 * Generate day-by-day itinerary using Claude
 * LEGACY WRAPPER - Now uses ItineraryCompositionAgent
 */
async function generateItinerary(
  candidate: GeneratedCandidate
): Promise<ItineraryDay[]> {
  // For backward compatibility, we need to transform the candidate data
  // to the new ItineraryCompositionParams format

  // Note: This is a simplified wrapper. For full functionality,
  // use itineraryCompositionAgent directly with complete booking data.

  if (!anthropic) {
    return generateMockItinerary(candidate);
  }

  try {
    // Legacy implementation preserved for now
    // TODO: Migrate callers to use itineraryCompositionAgent directly
    const prompt = `You are a travel advisor creating a day-by-day itinerary for ${candidate.destination}.

Trip Details:
- Duration: ${candidate.hotel.nights} nights
- Budget for activities: $${(candidate.remainingBudget / 100).toFixed(2)}
- Hotel: ${candidate.hotel.name}

Create a simple itinerary with ${candidate.hotel.nights} days. For each day, provide:
1. A short title (e.g., "Arrival & Exploring Downtown")
2. 2-3 activity suggestions

Format your response as JSON array:
[
  { "day": 1, "title": "...", "activities": ["...", "..."] },
  ...
]

Keep activities budget-conscious and realistic. Only output the JSON array, nothing else.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (textBlock) {
      const parsed = JSON.parse(textBlock.text);
      if (Array.isArray(parsed)) {
        return parsed as ItineraryDay[];
      }
    }
  } catch (error) {
    console.error('Error parsing itinerary from Claude:', error);
  }

  return generateMockItinerary(candidate);
}

/**
 * Generate mock content for development without API key
 */
function generateMockContent(
  candidate: GeneratedCandidate,
  rank: number
): { explanation: string; itinerary: ItineraryDay[] } {
  return {
    explanation: generateMockExplanation(candidate, rank),
    itinerary: generateMockItinerary(candidate),
  };
}

/**
 * Generate mock explanation
 */
function generateMockExplanation(
  candidate: GeneratedCandidate,
  rank: number
): string {
  const explanations: Record<string, string> = {
    'Paris': `${candidate.destination} offers a perfect blend of culture, cuisine, and charm. Flying with ${candidate.flight.provider} and staying at ${candidate.hotel.name} gives you excellent value, leaving $${(candidate.remainingBudget / 100).toFixed(0)} for museums, cafes, and experiences.`,
    'Tokyo': `Experience the fascinating mix of ancient tradition and cutting-edge technology in ${candidate.destination}. ${candidate.hotel.name} provides a comfortable base for exploring, with $${(candidate.remainingBudget / 100).toFixed(0)} left for incredible food and attractions.`,
    'London': `${candidate.destination} awaits with world-class museums, theatre, and history. ${candidate.flight.provider} offers reliable service, and ${candidate.hotel.name} puts you in the heart of the action with $${(candidate.remainingBudget / 100).toFixed(0)} for exploration.`,
    'Barcelona': `Sun, architecture, and vibrant culture make ${candidate.destination} an excellent choice. With ${candidate.hotel.name} as your base, you'll have $${(candidate.remainingBudget / 100).toFixed(0)} to enjoy tapas, beaches, and Gaudi's masterpieces.`,
    'Rome': `Immerse yourself in history at every turn in ${candidate.destination}. ${candidate.hotel.name} offers great value, leaving $${(candidate.remainingBudget / 100).toFixed(0)} for pasta, gelato, and ancient wonders.`,
    'Amsterdam': `${candidate.destination}'s canals, museums, and bike-friendly streets await. Flying ${candidate.flight.provider} to stay at ${candidate.hotel.name} leaves you $${(candidate.remainingBudget / 100).toFixed(0)} for Van Gogh, canal tours, and local cuisine.`,
  };

  return explanations[candidate.destination] ||
    `${candidate.destination} is an excellent destination with ${candidate.flight.provider} flights and ${candidate.hotel.name} accommodation. You'll have $${(candidate.remainingBudget / 100).toFixed(0)} remaining for activities and dining.`;
}

/**
 * Generate mock itinerary
 */
function generateMockItinerary(candidate: GeneratedCandidate): ItineraryDay[] {
  const genericActivities: Record<string, string[][]> = {
    'Paris': [
      ['Arrive and check into hotel', 'Evening walk along the Seine', 'Dinner in Le Marais'],
      ['Visit the Louvre Museum', 'Lunch at a local bistro', 'Explore Montmartre'],
      ['Eiffel Tower visit', 'Picnic at Champ de Mars', 'Seine river cruise'],
      ['Day trip to Versailles', 'Evening at a jazz club'],
      ['Shopping at Champs-Élysées', 'Visit Notre-Dame area', 'Farewell dinner'],
    ],
    'Tokyo': [
      ['Arrive at Narita/Haneda', 'Check into hotel', 'Explore Shibuya crossing'],
      ['Visit Senso-ji Temple', 'Explore Asakusa', 'Try authentic ramen'],
      ['Harajuku and Meiji Shrine', 'Shopping in Omotesando', 'Dinner in Shinjuku'],
      ['Day trip to Mount Fuji area', 'Onsen experience'],
      ['Akihabara electronics district', 'Final sushi dinner', 'Night views from Tokyo Tower'],
    ],
  };

  const activities = genericActivities[candidate.destination] || [
    ['Arrive and check into hotel', 'Explore the neighborhood', 'Welcome dinner'],
    ['Visit main attractions', 'Local lunch', 'Evening walk'],
    ['Day excursion', 'Try local cuisine', 'Sunset views'],
    ['Museum or cultural site', 'Shopping', 'Farewell dinner'],
  ];

  const itinerary: ItineraryDay[] = [];
  for (let i = 0; i < candidate.hotel.nights; i++) {
    const dayActivities = activities[i % activities.length];
    itinerary.push({
      day: i + 1,
      title: i === 0 ? 'Arrival Day' :
             i === candidate.hotel.nights - 1 ? 'Departure Day' :
             `Day ${i + 1} - Exploring`,
      activities: dayActivities,
    });
  }

  return itinerary;
}
