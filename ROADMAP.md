# TripOptimizer - AI Travel Agent & Personal CFO Roadmap

## Vision

An AI-powered travel agent that acts as both a **travel advisor** and a **personal trip CFO**. The system treats budget as a first-class constraint, continuously planning, booking, and adjusting trips to deliver the best possible experience within financial limits.

**Core Philosophy:** Budget-first, not budget-last. Instead of planning a dream trip and budgeting later, the system optimizes every decision around the user's financial constraints from the start.

---

## Executive Summary: Current State

**TripOptimizer MVP is a budget-conscious flight + hotel matching engine** with:
- Deterministic budget allocation across 3 categories (flight, hotel, buffer)
- Multi-factor scoring system for ranking trip options
- AI-powered explanations and itineraries (Claude)
- Passive personalization based on user behavior
- Booking data parsing and entity verification agents
- 3-page frontend flow (input → confirm → results)

**What's Working Well:**
- Budget is enforced as a hard constraint
- Scoring is fully deterministic (no AI influence)
- Personalization is confidence-gated and reversible
- Architecture cleanly separates AI text generation from business logic

**What's Missing for Full Vision:**
- Only 3 budget categories (needs 6)
- No lock-down mechanism for confirmed bookings
- No real-time spend tracking
- No continuous optimization
- Mock data only (no real API integrations)
- No activities, food, or ground transport

---

## Gap Analysis

### Implementation Status by Component

| Component | Status | Notes |
|-----------|--------|-------|
| Budget Allocation | ✅ Complete | 3 categories: flight, hotel, buffer |
| Trip Scoring | ✅ Complete | 4 factors: flight, hotel, efficiency, destination |
| Candidate Generation | ✅ Complete | Mock flights + hotels with budget filtering |
| AI Text Generation | ✅ Complete | Claude for explanations and itineraries |
| Personalization | ✅ Complete | Behavior inference, confidence-gated tie-breaking |
| Interaction Tracking | ✅ Complete | User actions logged, confidence updates |
| Booking Parsing | ✅ Complete | AI extraction from emails/PDFs |
| Entity Verification | ✅ Complete | AI verification of hotels/airlines |
| Frontend Flow | ✅ Complete | 3-page journey with monetization hooks |
| Extended Budget Categories | ⚠️ Partial | Missing: activities, food, transport, contingency |
| User Constraints | ⚠️ Partial | Basic only; needs priorities, preferences |
| Lock-Down Mechanism | ❌ Missing | No way to freeze confirmed bookings |
| Spend Tracking | ❌ Missing | No real-time budget burn-down |
| Continuous Optimization | ❌ Missing | No price monitoring or re-planning |
| Real API Integration | ❌ Missing | Mock data only |
| Activities Planning | ❌ Missing | No tours, attractions, experiences |

### Intended Flow vs. Current State

| Stage | Intended | Current | Gap |
|-------|----------|---------|-----|
| **1. Input Collection** | Budget, destination, dates, constraints, priorities | Budget, destination, dates, duration, style | Missing priorities, constraints |
| **2. Budget Allocation** | 6 categories (flight, hotel, activities, food, transport, contingency) | 3 categories (flight, hotel, buffer) | Missing 3 categories |
| **3. Plan Generation** | Top 3 plans maximizing full trip value | Top 3 plans for flights + hotels | Only 2 of 6 categories scored |
| **4. Plan Selection** | Select plan, lock down confirmed items | View plans, click external links | No lock-down, no internal state |
| **5. Booking Management** | AI manages end-to-end booking | Deep links to external sites | No actual booking |
| **6. Continuous Optimization** | Monitor prices, re-optimize | None | Not implemented |
| **7. Spend Tracking** | Real-time spend vs. budget | None | Not implemented |
| **8. Proactive Adjustments** | Alerts for savings, overrun prevention | None | Not implemented |

---

## Implementation Roadmap

### Phase 1: Extended Budget Categories & Constraints
**Goal:** Upgrade from 3 to 6 budget categories; add user priorities

**Tasks:**
- [ ] Define 6 budget categories: Flight, Hotel, Activity, Food, Transport, Contingency
- [ ] Create `BudgetCategory` enum in Prisma schema
- [ ] Update `BudgetConfig` to support all 6 categories
- [ ] Modify budget allocation service for multi-category split
- [ ] Add priority ranking inputs to frontend form
- [ ] Store user constraints/priorities in TripRequest (JSON fields)
- [ ] Update confirmation page to show full budget breakdown

**Files to Create/Modify:**
```
src/types/budget.types.ts          # Extended budget types
src/services/budget.service.ts     # Multi-category allocation
prisma/schema.prisma               # BudgetCategory enum, TripRequest extensions
frontend/components/TripInputForm.tsx    # Priority inputs
frontend/components/BudgetBreakdown.tsx  # 6-category display
```

**Estimated Scope:** Medium

---

### Phase 2: Lock-Down Mechanism
**Goal:** Allow users to "lock" confirmed bookings; prevent re-optimization of locked items

**Tasks:**
- [ ] Add `LockStatus` enum: UNLOCKED, LOCKED, CONFIRMED
- [ ] Add `lockStatus` and `lockedAt` fields to TripOption
- [ ] Create lock-down service with business rules
- [ ] Ensure locked items excluded from re-optimization
- [ ] Add lock/unlock toggle to trip card UI
- [ ] Create migration for schema changes

**Files to Create:**
```
src/types/lockdown.types.ts        # Lock status types
src/services/lockdown.service.ts   # Lock/unlock business logic
prisma/schema.prisma               # LockStatus enum, TripOption fields
frontend/components/LockToggle.tsx # UI component
```

**Business Rules:**
- UNLOCKED → LOCKED: User clicks "Lock this choice"
- LOCKED → CONFIRMED: User completes external booking
- CONFIRMED items cannot be unlocked
- Re-optimization ignores LOCKED and CONFIRMED items

**Estimated Scope:** Medium

---

### Phase 3: Activities Integration
**Goal:** Add tours, attractions, and experiences as a scored category

**Tasks:**
- [ ] Define `ActivityOption` model in Prisma
- [ ] Create mock activity data by destination
- [ ] Implement activity candidate generator
- [ ] Add activity scoring factor (rating/price value)
- [ ] Update final score formula to include activities (adjust weights)
- [ ] Create activity display components for frontend
- [ ] Include activities in trip option response

**Files to Create:**
```
src/types/activity.types.ts        # Activity data structures
src/services/activity.service.ts   # Activity generation and scoring
src/config/activities.ts           # Mock activity data
prisma/schema.prisma               # ActivityOption model
frontend/components/ActivityCard.tsx     # Activity display
frontend/components/ActivityList.tsx     # Activity list in trip details
```

**Updated Score Formula:**
```
finalScore =
  (0.30 × flightScore) +      # was 0.35
  (0.30 × hotelScore) +       # was 0.35
  (0.20 × activityScore) +    # NEW
  (0.12 × budgetEfficiency) + # was 0.20
  (0.08 × destinationDensity) # was 0.10
```

**Estimated Scope:** Large

---

### Phase 4: API Integration Foundation
**Goal:** Abstract data sources; prepare for real API integrations

**Tasks:**
- [ ] Create integration interface for flights, hotels, activities
- [ ] Move mock data behind integration abstraction
- [ ] Add caching layer for API responses
- [ ] Implement fallback chain: Real API → Cache → Mock
- [ ] Create configuration for API keys and endpoints
- [ ] Add rate limiting and retry logic

**Files to Create:**
```
src/integrations/types.ts          # Integration interfaces
src/integrations/flight.integration.ts   # Flight API wrapper
src/integrations/hotel.integration.ts    # Hotel API wrapper
src/integrations/activity.integration.ts # Activity API wrapper
src/integrations/cache.service.ts        # Response caching
src/config/integrations.ts               # API configuration
```

**Integration Pattern:**
```typescript
interface FlightIntegration {
  search(params: FlightSearchParams): Promise<FlightResult[]>;
  getDetails(id: string): Promise<FlightDetails>;
  checkAvailability(id: string): Promise<boolean>;
}
```

**Estimated Scope:** Large

---

### Phase 5: Spend Tracking & Budget Management
**Goal:** Track real-time spending against allocated budget

**Tasks:**
- [ ] Create `SpendRecord` model for tracking expenses
- [ ] Create `BudgetAllocation` model for per-category tracking
- [ ] Implement spend recording service
- [ ] Calculate remaining budget per category in real-time
- [ ] Create budget burn-down visualization component
- [ ] Add alerts when category approaching/exceeding limit
- [ ] Support manual expense entry by user

**Files to Create:**
```
src/types/spend.types.ts           # Spend tracking types
src/services/spend.service.ts      # Spend recording and calculation
prisma/schema.prisma               # SpendRecord, BudgetAllocation models
frontend/components/BudgetTracker.tsx    # Spend visualization
frontend/components/SpendEntry.tsx       # Manual expense entry
frontend/components/BudgetAlerts.tsx     # Warning/alert display
```

**Alert Thresholds:**
- 75% spent: Yellow warning
- 90% spent: Orange warning
- 100% spent: Red alert
- Over budget: Block further recommendations in category

**Estimated Scope:** Large

---

### Phase 6: Continuous Optimization Engine
**Goal:** Monitor prices and proactively suggest improvements

**Tasks:**
- [ ] Create optimization trigger conditions
- [ ] Implement background price monitoring job
- [ ] Detect significant price changes (>10% savings)
- [ ] Generate alternative recommendations
- [ ] Respect lock-down constraints during re-optimization
- [ ] Create notification system for optimization opportunities
- [ ] Add user preferences for optimization aggressiveness

**Files to Create:**
```
src/types/optimization.types.ts    # Optimization types
src/services/optimization.service.ts     # Re-optimization logic
src/jobs/price-monitor.job.ts            # Background price checker
src/services/notification.service.ts     # User notifications
frontend/components/OptimizationAlert.tsx  # Savings opportunity UI
```

**Trigger Conditions:**
- Price drop >10% on unlocked item
- Better alternative found within budget
- Schedule conflict detected
- User-initiated re-optimization request

**Estimated Scope:** Very Large

---

## Database Schema Extensions

```prisma
// ============================================
// NEW ENUMS
// ============================================

enum LockStatus {
  UNLOCKED    // Can be re-optimized
  LOCKED      // User confirmed choice, skip in re-optimization
  CONFIRMED   // Booking completed, immutable
}

enum BudgetCategory {
  FLIGHT
  HOTEL
  ACTIVITY
  FOOD
  TRANSPORT
  CONTINGENCY
}

// ============================================
// EXTENDED MODELS
// ============================================

model TripRequest {
  // ... existing fields ...

  // NEW: User preferences and constraints
  priorities       Json?      // { "flight": 1, "hotel": 2, "activities": 3 }
  constraints      Json?      // { "mustHave": [], "mustAvoid": [], "preferences": {} }

  // NEW: Relations
  budgetAllocations BudgetAllocation[]
  spendRecords      SpendRecord[]
}

model TripOption {
  // ... existing fields ...

  // NEW: Lock status
  lockStatus       LockStatus @default(UNLOCKED)
  lockedAt         DateTime?

  // NEW: Relation
  activityOption   ActivityOption?
}

// ============================================
// NEW MODELS
// ============================================

model ActivityOption {
  id              String      @id @default(uuid())
  tripOptionId    String      @unique
  tripOption      TripOption  @relation(fields: [tripOptionId], references: [id])

  name            String
  category        String      // tour, attraction, experience, entertainment
  description     String?
  price           Int         // cents
  duration        Int         // minutes
  rating          Float?
  deepLink        String

  createdAt       DateTime    @default(now())
}

model BudgetAllocation {
  id              String         @id @default(uuid())
  tripRequestId   String
  tripRequest     TripRequest    @relation(fields: [tripRequestId], references: [id])

  category        BudgetCategory
  allocated       Int            // cents - original allocation
  spent           Int            @default(0)  // cents - actual spend

  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@unique([tripRequestId, category])
}

model SpendRecord {
  id              String         @id @default(uuid())
  tripRequestId   String
  tripRequest     TripRequest    @relation(fields: [tripRequestId], references: [id])

  category        BudgetCategory
  amount          Int            // cents
  description     String?
  source          String?        // manual, parsed, booking

  recordedAt      DateTime       @default(now())
}
```

---

## Priority Matrix

| Priority | Phase | Features | Business Value |
|----------|-------|----------|----------------|
| **P0** | 1, 2 | Extended budget categories, Lock-down mechanism | Core CFO functionality |
| **P1** | 3 | Activities integration | Complete trip planning |
| **P2** | 5 | Spend tracking | Real-time budget management |
| **P3** | 4 | API integration foundation | Production readiness |
| **P4** | 6 | Continuous optimization | Proactive value delivery |

---

## Success Metrics

### Phase 1 Complete When:
- [ ] Users can allocate budget across 6 categories
- [ ] Priority rankings stored and displayed
- [ ] Budget breakdown shows all categories

### Phase 2 Complete When:
- [ ] Users can lock/unlock individual trip components
- [ ] Locked items excluded from any re-optimization
- [ ] Lock status persisted in database

### Phase 3 Complete When:
- [ ] Activities appear in trip options
- [ ] Activity scores factor into final ranking
- [ ] Users can view activity details and book

### Phase 4 Complete When:
- [ ] Mock data abstracted behind interfaces
- [ ] At least one real API integrated (e.g., flight search)
- [ ] Fallback chain working correctly

### Phase 5 Complete When:
- [ ] Users can track spend against budget
- [ ] Alerts fire at configured thresholds
- [ ] Budget burn-down visualization works

### Phase 6 Complete When:
- [ ] Background price monitoring running
- [ ] Users receive optimization suggestions
- [ ] Re-optimization respects lock constraints

---

## Appendix: File Structure After Full Implementation

```
src/
├── config/
│   ├── destinations.ts        # Existing
│   ├── activities.ts          # NEW: Mock activity data
│   └── integrations.ts        # NEW: API configuration
├── integrations/              # NEW: API wrappers
│   ├── types.ts
│   ├── flight.integration.ts
│   ├── hotel.integration.ts
│   ├── activity.integration.ts
│   └── cache.service.ts
├── jobs/                      # NEW: Background jobs
│   └── price-monitor.job.ts
├── middleware/
│   ├── validation.ts          # Existing
│   ├── parsing.validation.ts  # Existing
│   └── verification.validation.ts  # Existing
├── personalization/           # Existing
├── routes/
│   ├── trip.routes.ts         # Existing
│   ├── interaction.routes.ts  # Existing
│   ├── parsing.routes.ts      # Existing
│   ├── verification.routes.ts # Existing
│   └── spend.routes.ts        # NEW: Spend tracking endpoints
├── scoring/                   # Existing (modified)
├── services/
│   ├── budget.service.ts      # MODIFIED: 6 categories
│   ├── candidate.service.ts   # Existing
│   ├── claude.service.ts      # Existing
│   ├── interaction.service.ts # Existing
│   ├── parsing.service.ts     # Existing
│   ├── trip.service.ts        # Existing
│   ├── verification.service.ts # Existing
│   ├── activity.service.ts    # NEW
│   ├── lockdown.service.ts    # NEW
│   ├── spend.service.ts       # NEW
│   ├── optimization.service.ts # NEW
│   └── notification.service.ts # NEW
├── types/
│   ├── api.types.ts           # Existing
│   ├── parsing.types.ts       # Existing
│   ├── verification.types.ts  # Existing
│   ├── budget.types.ts        # NEW
│   ├── activity.types.ts      # NEW
│   ├── lockdown.types.ts      # NEW
│   ├── spend.types.ts         # NEW
│   └── optimization.types.ts  # NEW
└── server.ts                  # Existing
```

---

*Document generated: January 2026*
*Last updated: Based on codebase analysis*
