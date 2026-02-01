/**
 * Chat Service — AI Trip Planning Chatbot
 *
 * Uses Claude tool_use mode to gather trip parameters from natural language
 * conversation. Supports mock mode for development without API key.
 */

import Anthropic from '@anthropic-ai/sdk';

const MOCK_MODE = process.env.MOCK_CLAUDE === 'true';

let anthropic: Anthropic | null = null;

if (!MOCK_MODE && process.env.ANTHROPIC_API_KEY) {
  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ExtractedTripParams {
  originCity: string;
  destination?: string;
  startDate?: string;
  numberOfDays: number;
  budgetTotal: number;
  travelStyle: 'BUDGET' | 'MID_RANGE' | 'BALANCED' | 'LUXURY';
  tripPace?: 'RELAXED' | 'BALANCED' | 'PACKED';
  accommodationType?: 'HOTELS' | 'AIRBNB' | 'RESORTS' | 'HOSTELS';
  interests?: string[];
  numberOfTravelers?: number;
}

interface ChatResponse {
  reply: string;
  status: 'gathering' | 'ready';
  extractedParams?: ExtractedTripParams;
}

const SYSTEM_PROMPT = `You are a friendly and helpful travel planning assistant for TripOptimizer. Your job is to have a natural conversation to gather trip details from the user.

You need to collect these REQUIRED fields before planning can begin:
1. originCity — where they're traveling from
2. numberOfDays — how long the trip should be (1-30 days)
3. budgetTotal — their total budget in US dollars
4. travelStyle — one of: BUDGET, MID_RANGE, BALANCED, LUXURY

You can also optionally gather:
- destination — where they want to go (if not specified, the system will suggest destinations)
- startDate — when they want to travel (ISO date format like 2025-06-15)
- tripPace — RELAXED, BALANCED, or PACKED
- accommodationType — HOTELS, AIRBNB, RESORTS, or HOSTELS
- interests — array of interest categories like CULTURE_HISTORY, FOOD_DINING, OUTDOOR_ADVENTURE, NIGHTLIFE, BEACH_RELAXATION, SHOPPING, ARTS_ENTERTAINMENT, SPORTS_FITNESS, NATURE_WILDLIFE, FAMILY_FRIENDLY
- numberOfTravelers — how many people

Guidelines:
- Be conversational and warm, but concise
- Ask about 1-2 things at a time, don't overwhelm the user
- If they mention a budget, interpret it as US dollars
- If they say something vague like "a week", interpret as 7 days
- If they say "cheap" or "budget-friendly", use BUDGET style. "Moderate" or "mid-range" → MID_RANGE. "Balanced" or no preference → BALANCED. "Luxury" or "splurge" → LUXURY
- Once you have ALL 4 required fields, call the extract_trip_parameters tool
- Don't ask for optional fields if the user seems eager to get started — just extract what you have`;

const EXTRACT_TOOL: Anthropic.Tool = {
  name: 'extract_trip_parameters',
  description: 'Extract the gathered trip parameters to start planning. Call this when you have collected at least: originCity, numberOfDays, budgetTotal, and travelStyle.',
  input_schema: {
    type: 'object' as const,
    properties: {
      originCity: { type: 'string', description: 'The city the user is traveling from' },
      destination: { type: 'string', description: 'The desired destination city' },
      startDate: { type: 'string', description: 'Trip start date in ISO format (YYYY-MM-DD)' },
      numberOfDays: { type: 'number', description: 'Number of days for the trip (1-30)' },
      budgetTotal: { type: 'number', description: 'Total budget in US dollars' },
      travelStyle: { type: 'string', enum: ['BUDGET', 'MID_RANGE', 'BALANCED', 'LUXURY'], description: 'Travel style preference' },
      tripPace: { type: 'string', enum: ['RELAXED', 'BALANCED', 'PACKED'], description: 'Desired trip pace' },
      accommodationType: { type: 'string', enum: ['HOTELS', 'AIRBNB', 'RESORTS', 'HOSTELS'], description: 'Preferred accommodation type' },
      interests: { type: 'array', items: { type: 'string' }, description: 'Interest categories' },
      numberOfTravelers: { type: 'number', description: 'Number of travelers' },
    },
    required: ['originCity', 'numberOfDays', 'budgetTotal', 'travelStyle'],
  },
};

function validateParams(params: ExtractedTripParams): string | null {
  if (params.numberOfDays < 1 || params.numberOfDays > 30) {
    return 'The trip duration should be between 1 and 30 days. Could you clarify how long you\'d like your trip to be?';
  }
  if (params.budgetTotal < 100) {
    return 'The minimum budget is $100. Could you provide a higher budget amount?';
  }
  if (!['BUDGET', 'MID_RANGE', 'BALANCED', 'LUXURY'].includes(params.travelStyle)) {
    return 'I need to understand your travel style better. Would you prefer budget, mid-range, balanced, or luxury?';
  }
  return null;
}

/**
 * Process a chat message and return a response.
 */
export async function processMessage(
  message: string,
  conversationHistory: ConversationMessage[]
): Promise<ChatResponse> {
  if (MOCK_MODE || !anthropic) {
    return processMockMessage(message, conversationHistory);
  }

  // Cap history to last 20 messages
  const trimmedHistory = conversationHistory.slice(-20);

  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...trimmedHistory,
    { role: 'user', content: message },
  ];

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: [EXTRACT_TOOL],
      messages,
    });

    // Check if Claude called the tool
    const toolUseBlock = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
    );

    if (toolUseBlock && toolUseBlock.name === 'extract_trip_parameters') {
      const rawParams = toolUseBlock.input as Record<string, unknown>;

      const extractedParams: ExtractedTripParams = {
        originCity: rawParams.originCity as string,
        numberOfDays: rawParams.numberOfDays as number,
        budgetTotal: Math.round((rawParams.budgetTotal as number) * 100), // dollars → cents
        travelStyle: rawParams.travelStyle as ExtractedTripParams['travelStyle'],
      };

      if (rawParams.destination) extractedParams.destination = rawParams.destination as string;
      if (rawParams.startDate) extractedParams.startDate = rawParams.startDate as string;
      if (rawParams.tripPace) extractedParams.tripPace = rawParams.tripPace as ExtractedTripParams['tripPace'];
      if (rawParams.accommodationType) extractedParams.accommodationType = rawParams.accommodationType as ExtractedTripParams['accommodationType'];
      if (rawParams.interests) extractedParams.interests = rawParams.interests as string[];
      if (rawParams.numberOfTravelers) extractedParams.numberOfTravelers = rawParams.numberOfTravelers as number;

      // Validate
      const validationError = validateParams(extractedParams);
      if (validationError) {
        return { reply: validationError, status: 'gathering' };
      }

      // Get the text reply if present, otherwise generate one
      const textBlock = response.content.find(
        (block): block is Anthropic.TextBlock => block.type === 'text'
      );
      const reply = textBlock?.text || `Great! I've got everything I need. Let me find the best trip options for you — a ${extractedParams.numberOfDays}-day trip from ${extractedParams.originCity}${extractedParams.destination ? ` to ${extractedParams.destination}` : ''} with a $${rawParams.budgetTotal} budget. Searching now!`;

      return { reply, status: 'ready', extractedParams };
    }

    // Text-only response — still gathering
    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );
    const reply = textBlock?.text || 'Could you tell me more about the trip you have in mind?';

    return { reply, status: 'gathering' };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStatus = (error as { status?: number })?.status;
    console.error(`Chat service Claude API error [status=${errStatus}]: ${errMsg}`);
    return {
      reply: 'I\'m sorry, I encountered an issue. Could you try rephrasing your message?',
      status: 'gathering',
    };
  }
}

/**
 * Mock mode: simple state machine for development.
 */
function processMockMessage(
  message: string,
  conversationHistory: ConversationMessage[]
): ChatResponse {
  const turnCount = conversationHistory.length;

  if (turnCount === 0) {
    return {
      reply: 'That sounds exciting! Where would you be traveling from, and do you have a destination in mind?',
      status: 'gathering',
    };
  }

  if (turnCount <= 2) {
    return {
      reply: 'Great choice! What\'s your approximate budget for the trip, and how many days are you thinking?',
      status: 'gathering',
    };
  }

  // Turn 3+: return ready with hardcoded Paris trip params
  return {
    reply: 'Perfect! I have everything I need. Let me find the best trip options for you — a 5-day trip from New York to Paris with a $2,000 budget. Searching now!',
    status: 'ready',
    extractedParams: {
      originCity: 'New York',
      destination: 'Paris',
      numberOfDays: 5,
      budgetTotal: 200000, // $2000 in cents
      travelStyle: 'BALANCED',
    },
  };
}
