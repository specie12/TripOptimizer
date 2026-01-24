# AI Agent Boundaries - TripOptimizer

**Last Updated**: 2026-01-24
**Status**: Phase 1 Complete

---

## Overview

TripOptimizer uses AI **ONLY** for specific, well-defined tasks where AI excels: unstructured data discovery, narrative generation, and data extraction. All budget allocation, scoring, ranking, and pricing decisions are **100% deterministic**.

This document defines the strict boundaries for AI usage in the system.

---

## The 4 AI Agents

### 1. Activity Discovery Agent

**Purpose**: Discover activities from unstructured sources (reviews, blogs, local knowledge)

**Implemented In**: `src/services/ai-agent.service.ts` → `ActivityDiscoveryAgentImpl`

**When Invoked**:
- During trip planning, after budget allocation
- When user requests activity suggestions for a destination

**Input**:
```typescript
{
  destination: "Barcelona",
  dates: { start: "2026-03-15", end: "2026-03-22" },
  interests: ["food", "museums", "architecture"],
  budget: 30000, // cents
  numberOfDays: 7
}
```

**Output**:
```typescript
[
  {
    name: "Sagrada Familia Tour",
    category: "cultural",
    typicalPriceRange: { min: 2500, max: 3500 },
    duration: 120,
    description: "Guided tour of Gaudí's masterpiece"
  }
]
```

**✅ ALLOWED TO**:
- Suggest activities based on interests
- Structure unstructured data (reviews, descriptions)
- Categorize activity types (cultural, food, adventure, etc.)
- Output typical price **RANGE** (not final prices)
- Discover activities from knowledge base and web search

**❌ FORBIDDEN TO**:
- Set final prices (only typical price range)
- Rank or score activities (deterministic service does this)
- Make booking decisions
- Override budget constraints
- Generate fabricated activities

**Audit Log**: All calls logged to console and database

---

### 2. Itinerary Composition Agent

**Purpose**: Generate human-readable day-by-day itinerary from confirmed bookings

**Implemented In**: `src/services/ai-agent.service.ts` → `ItineraryCompositionAgentImpl`

**When Invoked**:
- After top 3 trip options are selected
- After component swaps (hotel/flight/activity changes)
- After booking confirmation

**Input**:
```typescript
{
  destination: "Barcelona",
  dates: { start: "2026-03-15", end: "2026-03-22" },
  flight: {
    outbound: {
      departure: "2026-03-15T08:00:00Z",
      arrival: "2026-03-15T20:00:00Z",
      provider: "Delta",
      flightNumber: "DL123"
    }
  },
  hotel: {
    name: "Hotel Barcelona",
    checkIn: "2026-03-15",
    checkOut: "2026-03-22"
  },
  activities: [
    {
      name: "Sagrada Familia Tour",
      date: "2026-03-16",
      time: "10:00"
    }
  ]
}
```

**Output**:
```typescript
[
  {
    day: 1,
    date: "2026-03-15",
    title: "Arrival Day",
    activities: [
      {
        time: "08:00",
        type: "flight",
        name: "Departure from NYC",
        description: "Delta DL123"
      },
      {
        time: "20:00",
        type: "arrival",
        name: "Arrival in Barcelona"
      }
    ],
    meals: ["Dinner near hotel"],
    notes: "Rest after long flight. Early bedtime recommended."
  }
]
```

**✅ ALLOWED TO**:
- Arrange confirmed bookings into daily schedule
- Generate narrative descriptions
- Suggest optimal timing/sequencing
- Add logistical tips (travel time, meal suggestions)
- Format output as JSON or Markdown

**❌ FORBIDDEN TO**:
- Change bookings or prices
- Add unbookable activities
- Override user selections
- Make pricing decisions
- Rank trip options

**Audit Log**: All calls logged to console and database

---

### 3. Parsing Agent

**Purpose**: Extract structured data from unstructured booking confirmations

**Implemented In**: `src/services/parsing.service.ts` → `parseBookingContent()`

**When Invoked**:
- User uploads booking confirmation email/PDF
- After external booking (user booked outside system)
- Integration with email inbox (future feature)

**Input**:
```typescript
{
  rawText: "Dear John Smith, Your reservation is confirmed! Booking Reference: BA12345...",
  documentType: "EMAIL"
}
```

**Output**:
```typescript
{
  data: {
    vendor: {
      name: "Grand Hotel Barcelona",
      category: "HOTEL",
      brandConfidence: 0.9
    },
    booking: {
      confirmationNumber: "BA12345",
      bookingDate: "2026-03-15",
      status: "CONFIRMED"
    },
    contact: {
      phone: "+34 123 456 789",
      email: "hotel@example.com"
    },
    location: {
      city: "Barcelona",
      country: "Spain"
    }
  },
  confidence: 0.85,
  warnings: []
}
```

**✅ ALLOWED TO**:
- Extract structured data from unstructured text
- Identify vendor names, confirmation codes, dates
- Parse contact information
- Return NULL for missing/ambiguous data

**❌ FORBIDDEN TO**:
- Guess missing information
- Generate fake confirmation codes
- Modify extracted data
- Make assumptions about prices

**Special Rule**: "NULL over guess" - Always return NULL for uncertain data

**Audit Log**: All calls logged to console and database

---

### 4. Verification Agent

**Purpose**: Verify entity existence and operational status

**Implemented In**: `src/services/verification.service.ts` → `verifyEntity()`

**When Invoked**:
- Before booking (pre-flight check)
- User manually verifies a component
- Monitoring service detects potential issue

**Input**:
```typescript
{
  entityType: "hotel",
  name: "Grand Hotel Barcelona",
  location: {
    city: "Barcelona",
    country: "Spain"
  },
  website: "https://grandhotel.com"
}
```

**Output**:
```typescript
{
  status: "VERIFIED",
  confidence: 0.9,
  signals: {
    websiteResolves: true,
    appearsOperational: true,
    closureSignalDetected: false
  },
  notes: "Website operational, recent reviews confirm it's open"
}
```

**✅ ALLOWED TO**:
- Check if entity exists (web search, knowledge base)
- Return confidence level (VERIFIED/UNVERIFIED/UNKNOWN)
- Provide operational status (open/closed)
- Return source of verification

**❌ FORBIDDEN TO**:
- Fabricate entities
- Guess addresses or contact info
- Make recommendations
- Override user input

**Special Rule**: "UNKNOWN over guess" - Return UNKNOWN when uncertain

**Audit Log**: All calls logged to console and database

---

## What AI is NEVER Used For

### ❌ Budget Allocation
- **Responsibility**: `src/services/budget.service.ts`
- **Method**: Deterministic 6-category split with priority weighting
- **No AI involvement**

### ❌ Scoring & Ranking
- **Responsibility**: `src/scoring/` services
- **Method**: Deterministic weighted formula (flight score + hotel score + budget efficiency + destination density)
- **No AI involvement**

### ❌ Pricing Decisions
- **Responsibility**: API integrations (`src/integrations/`)
- **Method**: Real-time API calls to Amadeus (flights), Booking.com (hotels)
- **No AI involvement**

### ❌ Booking Decisions
- **Responsibility**: `src/services/booking-orchestrator.service.ts` (Phase 2)
- **Method**: Deterministic booking flow with state machine
- **No AI involvement**

### ❌ Activity Selection
- **Responsibility**: `src/services/activity.service.ts`
- **Method**: Greedy algorithm with diversity bonus
- **AI only discovers activities; selection is deterministic**

---

## Audit Logging

All AI agent calls are logged with:

```typescript
{
  timestamp: "2026-01-24T10:30:00Z",
  agentType: "ACTIVITY_DISCOVERY" | "ITINERARY_COMPOSITION" | "PARSING" | "VERIFICATION",
  input: { ... },
  output: { ... },
  modelUsed: "claude-3-haiku-20240307",
  processingTimeMs: 1234,
  success: true,
  error?: "Error message if failed"
}
```

**Location**: Console logs + Database (future)
**Purpose**: Compliance, debugging, cost tracking

---

## Migration Guide

### Old Code (Before Phase 1)
```typescript
import { generateTripContent } from './claude.service';

const { explanation, itinerary } = await generateTripContent(candidate, score, rank);
```

### New Code (After Phase 1)
```typescript
import { itineraryCompositionAgent } from './ai-agent.service';

const itinerary = await itineraryCompositionAgent.composeItinerary({
  destination: 'Barcelona',
  dates: { start: '2026-03-15', end: '2026-03-22' },
  flight: { ... },
  hotel: { ... },
  activities: [ ... ]
});
```

**Backward Compatibility**: Old `claude.service.ts` still works but is marked as legacy

---

## Future Enhancements (Phase 4+)

1. **Activity Discovery Enhancement**:
   - Integrate web search API (SerpAPI, Google Places)
   - Add activity database fallback
   - Improve prompt engineering with few-shot examples

2. **Multi-Language Support**:
   - Itinerary generation in user's preferred language
   - Parsing agent supports non-English booking confirmations

3. **Real-Time Verification**:
   - Verify entities against live Google Maps API
   - Check operational hours and closure status

4. **Advanced Audit Dashboard**:
   - Web UI to view all AI calls
   - Cost tracking per agent
   - Performance metrics

---

## Testing AI Boundaries

### Compliance Test Suite

Run the following tests to verify AI boundaries:

```bash
# Test that AI is NOT called during budget allocation
npm run test:budget-allocation

# Test that AI is NOT called during scoring
npm run test:scoring

# Test that AI is ONLY called for activity discovery
npm run test:activity-discovery

# Test that AI is ONLY called for itinerary composition
npm run test:itinerary-composition
```

### Manual Verification

1. Enable audit logging: `ENABLE_AI_AUDIT=true`
2. Run trip generation flow
3. Check audit logs: Should see exactly 2 AI calls:
   - 1× Activity Discovery Agent
   - 1× Itinerary Composition Agent (per option, so 3 total for top 3 options)
4. No AI calls for: Budget allocation, Scoring, Activity selection

---

## Support

Questions about AI agent boundaries? Contact the development team or open an issue.

**Critical Rule**: If you're unsure whether to use AI for a task, **default to deterministic logic**.
