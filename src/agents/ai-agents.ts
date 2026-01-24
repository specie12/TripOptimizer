/**
 * AI Agent Interfaces
 *
 * Defines strict boundaries for AI usage in TripOptimizer.
 * AI is ONLY used for:
 * 1. Activity Discovery (unstructured data discovery)
 * 2. Itinerary Composition (narrative generation)
 * 3. Parsing (data extraction)
 * 4. Verification (entity existence)
 *
 * AI is NEVER used for:
 * - Budget allocation (deterministic)
 * - Scoring/ranking (deterministic)
 * - Pricing decisions (deterministic)
 * - Booking decisions (deterministic)
 */

// ============================================
// AGENT 1: ACTIVITY DISCOVERY AGENT
// ============================================

export interface ActivityDiscoveryParams {
  destination: string;
  dates: {
    start: string; // ISO date
    end: string; // ISO date
  };
  interests?: string[]; // e.g., ["food", "museums", "adventure"]
  budget: number; // cents
  numberOfDays: number;
}

export interface DiscoveredActivity {
  name: string;
  category: 'cultural' | 'food' | 'adventure' | 'relaxation' | 'shopping' | 'nightlife' | 'other';
  typicalPriceRange: {
    min: number; // cents
    max: number; // cents
  };
  duration?: number; // minutes
  description: string;
}

export interface ActivityDiscoveryAgent {
  /**
   * Discover activities from unstructured sources
   *
   * ALLOWED TO:
   * - Suggest activities based on interests
   * - Structure unstructured data (reviews, descriptions)
   * - Categorize activity types
   * - Output typical price RANGE (not final prices)
   *
   * FORBIDDEN TO:
   * - Set final prices
   * - Rank or score activities
   * - Make booking decisions
   * - Override budget constraints
   * - Generate fabricated activities
   */
  discoverActivities(params: ActivityDiscoveryParams): Promise<DiscoveredActivity[]>;
}

// ============================================
// AGENT 2: ITINERARY COMPOSITION AGENT
// ============================================

export interface ItineraryCompositionParams {
  destination: string;
  dates: {
    start: string; // ISO date
    end: string; // ISO date
  };
  flight: {
    outbound: {
      departure: string; // ISO datetime
      arrival: string; // ISO datetime
      provider: string;
      flightNumber: string;
    };
    return?: {
      departure: string; // ISO datetime
      arrival: string; // ISO datetime
      provider: string;
      flightNumber: string;
    };
  };
  hotel: {
    name: string;
    checkIn: string; // ISO date
    checkOut: string; // ISO date
    address?: string;
  };
  activities: Array<{
    name: string;
    date: string; // ISO date
    time?: string; // HH:MM
    duration?: number; // minutes
    description?: string;
  }>;
}

export interface ItineraryDay {
  day: number;
  date: string; // ISO date
  title: string;
  activities: Array<{
    time: string; // HH:MM
    type: 'flight' | 'hotel' | 'activity' | 'meal' | 'transport' | 'free-time';
    name: string;
    description?: string;
  }>;
  meals?: string[]; // Meal suggestions
  notes?: string; // Logistical tips
}

export interface ItineraryCompositionAgent {
  /**
   * Compose day-by-day itinerary from confirmed bookings
   *
   * ALLOWED TO:
   * - Arrange confirmed bookings into daily schedule
   * - Generate narrative descriptions
   * - Suggest optimal timing/sequencing
   * - Add logistical tips (travel time, meal suggestions)
   * - Format output as JSON or Markdown
   *
   * FORBIDDEN TO:
   * - Change bookings
   * - Add unbookable activities
   * - Override user selections
   * - Make pricing decisions
   * - Rank trip options
   */
  composeItinerary(params: ItineraryCompositionParams): Promise<ItineraryDay[]>;
}

// ============================================
// AGENT 3: PARSING AGENT
// ============================================

export interface ParsingParams {
  rawText: string;
  documentType?: 'EMAIL' | 'PDF' | 'TEXT';
}

export interface ParsedBookingData {
  vendor: {
    name: string | null;
    category: 'FLIGHT' | 'HOTEL' | 'CAR' | 'ACTIVITY' | 'OTHER';
    brandConfidence: number; // 0-1
  };
  booking: {
    confirmationNumber: string | null;
    bookingDate: string | null; // ISO date
    status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
  };
  contact: {
    phone: string | null;
    email: string | null;
    whatsapp: string | null;
    website: string | null;
  };
  location: {
    address: string | null;
    city: string | null;
    country: string | null;
  };
  timing: {
    startDateTime: string | null; // ISO datetime
    endDateTime: string | null; // ISO datetime
    checkInTime: string | null; // HH:MM
    checkOutTime: string | null; // HH:MM
  };
  instructions: {
    checkIn: string | null;
    specialNotes: string | null;
  };
}

export interface ParsingAgent {
  /**
   * Extract structured data from unstructured booking confirmations
   *
   * ALLOWED TO:
   * - Extract structured data from unstructured text
   * - Identify vendor names, confirmation codes, dates
   * - Parse contact information
   * - Return NULL for missing/ambiguous data
   *
   * FORBIDDEN TO:
   * - Guess missing information
   * - Generate fake confirmation codes
   * - Modify extracted data
   * - Make assumptions about prices
   */
  parseBookingConfirmation(params: ParsingParams): Promise<{
    data: ParsedBookingData;
    confidence: number; // 0-1
    warnings: string[];
  }>;
}

// ============================================
// AGENT 4: VERIFICATION AGENT
// ============================================

export interface VerificationParams {
  entityType: 'hotel' | 'restaurant' | 'activity' | 'transport' | 'other';
  name: string;
  location?: {
    address?: string;
    city?: string;
    country?: string;
  };
  website?: string;
}

export interface VerificationResult {
  status: 'VERIFIED' | 'UNVERIFIED' | 'UNKNOWN';
  confidence: number | null; // 0-1
  signals: {
    websiteResolves: boolean | null;
    appearsOperational: boolean | null;
    closureSignalDetected: boolean | null;
  };
  notes: string | null;
}

export interface VerificationAgent {
  /**
   * Verify entity existence and operational status
   *
   * ALLOWED TO:
   * - Check if entity exists (web search, knowledge base)
   * - Return confidence level (VERIFIED/UNVERIFIED/UNKNOWN)
   * - Provide operational status (open/closed)
   * - Return source of verification
   *
   * FORBIDDEN TO:
   * - Fabricate entities
   * - Guess addresses or contact info
   * - Make recommendations
   * - Override user input
   */
  verifyEntity(params: VerificationParams): Promise<VerificationResult>;
}

// ============================================
// AUDIT LOGGING
// ============================================

/**
 * Log all AI agent calls for compliance and debugging
 */
export interface AIAgentAuditLog {
  timestamp: string; // ISO datetime
  agentType: 'ACTIVITY_DISCOVERY' | 'ITINERARY_COMPOSITION' | 'PARSING' | 'VERIFICATION';
  input: unknown;
  output: unknown;
  modelUsed: string;
  tokensUsed?: number;
  processingTimeMs: number;
  success: boolean;
  error?: string;
}

export function logAIAgentCall(log: AIAgentAuditLog): void {
  // In production, this would write to a database or logging service
  console.log('[AI AGENT AUDIT]', {
    ...log,
    // Truncate large inputs/outputs in console
    input: JSON.stringify(log.input).substring(0, 200),
    output: JSON.stringify(log.output).substring(0, 200),
  });
}
