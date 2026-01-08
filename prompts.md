# TripOptimizer - Prompts Log

This file stores all prompts provided for the TripOptimizer project.

---

## Prompt 1: Database Foundation (STEP 1)

**Date:** 2026-01-06

**Context:** Senior backend engineer working on MVP for budget-first travel planning web app.

**Tech Stack:**
- Node.js
- PostgreSQL
- Prisma ORM
- No authentication system yet (anonymous users)

**Goal:** Create a clean, minimal, production-ready Prisma schema and supporting setup.

### Domain Requirements (Non-Negotiable)

1. The system supports anonymous users first.
2. A TripRequest represents one immutable planning intent.
3. A TripRequest can generate 2–3 TripOptions.
4. Each TripOption has:
   - Exactly one FlightOption
   - Exactly one HotelOption
5. Budget logic is deterministic and external to AI.
6. Claude-generated content is stored but never trusted for calculations.
7. The schema must be future-ready for personalization but inactive for now.

### Data Models to Implement

#### User
Fields:
- id (uuid, primary key)
- createdAt (timestamp, default now)
- lastSeenAt (timestamp, auto-updated)
- inferredBudgetBand (nullable string)
- confidenceScore (float, default 0)

Relations:
- has many TripRequests

#### TripRequest
Fields:
- id (uuid, primary key)
- userId (nullable FK → User)
- originCity (string)
- destination (nullable string)
- startDate (nullable timestamp)
- endDate (nullable timestamp)
- numberOfDays (int)
- budgetTotal (int, stored in cents)
- travelStyle (enum)
- createdAt (timestamp)

Relations:
- belongs to User
- has many TripOptions

#### TravelStyle enum
Values:
- BUDGET
- BALANCED

#### TripOption
Fields:
- id (uuid, primary key)
- tripRequestId (FK → TripRequest)
- destination (string)
- totalCost (int)
- remainingBudget (int)
- score (float)
- explanation (text)
- itineraryJson (JSON)
- createdAt (timestamp)

Relations:
- belongs to TripRequest
- has one FlightOption
- has one HotelOption

#### FlightOption
Fields:
- id (uuid, primary key)
- tripOptionId (unique FK → TripOption)
- provider (string)
- price (int)
- departureTime (timestamp)
- returnTime (timestamp)
- deepLink (string)
- createdAt (timestamp)

#### HotelOption
Fields:
- id (uuid, primary key)
- tripOptionId (unique FK → TripOption)
- name (string)
- priceTotal (int)
- rating (nullable float)
- deepLink (string)
- createdAt (timestamp)

#### InteractionEvent
Fields:
- id (uuid, primary key)
- userId (nullable FK → User)
- tripOptionId (nullable FK → TripOption)
- eventType (enum)
- metadata (JSON, nullable)
- createdAt (timestamp)

#### InteractionType enum
Values:
- VIEW_TRIP_OPTION
- EXPAND_EXPLANATION
- CLICK_BOOK_FLIGHT
- CLICK_BOOK_HOTEL
- CHANGE_HOTEL

#### BudgetConfig
Fields:
- id (uuid, primary key)
- travelStyle (enum)
- flightPct (float)
- hotelPct (float)
- bufferPct (float)
- createdAt (timestamp)

### Implementation Tasks

1. Produce a complete `schema.prisma` file
2. Ensure:
   - Correct relations
   - Unique constraints where required
   - Safe defaults
3. Provide:
   - Prisma migration command
   - Seed script to insert BudgetConfig for:
     - BUDGET (35% flight, 40% hotel, 10% buffer)
     - BALANCED (40% flight, 45% hotel, 10% buffer)
4. Add comments in the schema explaining:
   - Why each model exists
   - What is MVP-only vs future-facing
5. DO NOT:
   - Add authentication
   - Add extra tables
   - Add business logic
   - Invent fields not listed

### Expected Output

1. `schema.prisma` (complete)
2. `seed.ts` (Prisma seed script)
3. Exact CLI commands to:
   - Initialize Prisma
   - Run migration
   - Seed the database

---

## Prompt 2: Trip Scoring Engine (STEP 2)

**Date:** 2026-01-07

**Context:** Senior backend engineer implementing STEP 2 of MVP. STEP 1 (database schema) is complete.

**Goal:** Implement the deterministic Trip Scoring Engine that ranks generated trip options.

### Non-Negotiable Principles

1. Scoring must be fully deterministic
2. Claude or any LLM must NOT compute or influence scores
3. All scores must be explainable and logged
4. Scoring weights must be configurable (not hardcoded)
5. Trips over budget must NEVER be scored

### Input Data Assumptions

Each TripOption candidate contains:
- budgetTotal (int, cents)
- remainingBudget (int, cents)
- maxAllowedFlightBudget (int, cents)

Flight:
- price (int)

Hotel:
- priceTotal (int)
- nights (int)
- rating (nullable float)

Destination:
- name (string)

### Scoring Factors

1. **Flight Value Score**
   - Formula: `flightScore = 1 - (flightPrice / maxAllowedFlightBudget)`
   - Clamp between 0 and 1

2. **Hotel Value Score**
   - Formula: `hotelValue = hotelRating / pricePerNight`
   - Normalize across all options being scored
   - If rating is missing, apply 0.85 penalty factor

3. **Budget Efficiency Score**
   - Formula: `budgetEfficiency = remainingBudget / budgetTotal`
   - Clamp between 0 and 1

4. **Destination Density Score**
   - Static lookup table with values between 0 and 1
   - Default to 0.5 if destination not found

### Final Score Formula (Locked)

```
finalScore =
  (flightScore * 0.35) +
  (hotelScore * 0.35) +
  (budgetEfficiency * 0.20) +
  (destinationDensity * 0.10)
```

### Implementation Tasks

1. Create scoring module exporting:
   - `scoreTripOption(option, context)`
   - Returns: `{ finalScore, components: { flightScore, hotelScore, budgetEfficiency, destinationDensity } }`

2. Create configuration object/JSON for:
   - Scoring weights
   - Destination density lookup

3. Ensure:
   - All component scores clamped 0-1
   - finalScore clamped 0-1
   - Trips exceeding budget rejected before scoring

4. Provide:
   - Clear inline comments
   - Example usage with 2-3 mocked TripOptions
   - Simple test showing correct ranking

### Constraints

- NO personalization logic
- NO auto-adjust weights
- NO external API calls
- NO AI/LLM involvement
- NO database schema modifications

### Expected Output

1. Scoring module code
2. Scoring configuration (JSON or TS object)
3. Example usage
4. Integration notes

---

## Prompt 3: Trip Generation Pipeline (STEP 3)

**Date:** 2026-01-07

**Context:** Senior backend engineer implementing STEP 3 of MVP. STEP 1 (schema) and STEP 2 (scoring) are complete.

**Goal:** Implement the Trip Generation Pipeline with POST /trip/generate endpoint.

### Tech Stack

- Node.js + TypeScript
- Express or equivalent
- Prisma for DB access
- Claude (or LLM) used ONLY for text generation

### Implementation Requirements

1. POST /trip/generate endpoint
2. Input validation
3. TripRequest persistence
4. Deterministic budget allocation using BudgetConfig
5. Candidate generation (static destination list acceptable)
6. Hard over-budget filtering
7. Trip scoring using existing scorer
8. Ranking and selection of top 2–3 options
9. Claude call for explanation + itinerary (isolated)
10. Persistence of all results
11. Clean JSON response

### Constraints

- Do NOT let Claude score or rank
- Do NOT modify budget logic
- Do NOT add auth
- Do NOT add personalization
- Do NOT over-engineer

### Expected Output

1. Route handler code
2. Supporting services/modules
3. Example request/response
4. Notes on error handling

---

## Prompt 4: Frontend UX Implementation (STEP 4)

**Date:** 2026-01-07

**Context:** Senior frontend engineer implementing STEP 4 of MVP. STEP 3 (Trip Generation API) is complete.

**Goal:** Implement frontend UX that makes users trust generated trips and understand why each option fits their budget.

### Core UX Principles (Non-Negotiable)

1. Budget clarity > visual complexity
2. Plain English explanations
3. No AI terminology exposed to users
4. No scores, percentages, or internal math shown
5. Reduce anxiety before asking users to click booking links

### Tech Stack

- React or Next.js
- Server-driven data (API response from /trip/generate)
- No client-side scoring or logic
- Minimal state management

### Screens to Implement

#### Screen 1: Budget Confirmation
- Display budget (formatted currency), trip length, travel style
- Static explanatory copy (exact wording specified)
- CTA: "Find trips that fit my budget"

#### Screen 2: Trip Results Overview (Most Important)
- Render 2-3 Trip Option cards
- Top Section: Destination, total cost, remaining budget ("You still have $X left")
- Middle Section: "Why this works for your budget" (bullet list from explanation)
- Bottom Section: "View trip details", "Book flight", "Book hotel" buttons
- Reassurance: "Nothing is booked yet."

#### Screen 3: Trip Details (Expandable)
- Budget breakdown (flight, hotel, remaining)
- Explanatory copy about unplanned budget
- Day-by-day itinerary preview (read-only)

### Interaction Tracking

Track only:
- Viewing a trip option
- Expanding "Why this works"
- Clicking booking links

### Constraints

- Do NOT show numeric scores
- Do NOT mention AI or algorithms
- Do NOT allow user filtering yet
- Do NOT redesign backend data structures
- Do NOT over-style or animate excessively

### Expected Output

1. Component structure (files/components)
2. Key React components with JSX
3. Example props based on API response
4. Notes on how trust is reinforced in the UI

---
