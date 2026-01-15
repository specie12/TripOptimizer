# TripOptimizer - AI Travel Agent & Personal CFO Roadmap

## Vision

An AI-powered travel agent that acts as both a **travel advisor** and a **personal trip CFO**. The system treats budget as a first-class constraint, continuously planning, booking, and adjusting trips to deliver the best possible experience within financial limits.

**Core Philosophy:** Budget-first, not budget-last. Instead of planning a dream trip and budgeting later, the system optimizes every decision around the user's financial constraints from the start.

---

## Multi-Agent Architecture

TripOptimizer employs a **multi-agent architecture** where a central orchestrator coordinates specialized AI agents, each responsible for a specific domain of the trip lifecycle.

### Architecture Overview

```
                                    ┌─────────────────────┐
                                    │   User Interface    │
                                    └──────────┬──────────┘
                                               │
                                    ┌──────────▼──────────┐
                                    │                     │
                                    │  ORCHESTRATOR AGENT │
                                    │  (Central Control)  │
                                    │                     │
                                    └──────────┬──────────┘
                                               │
              ┌────────────────┬───────────────┼───────────────┬────────────────┐
              │                │               │               │                │
    ┌─────────▼─────────┐ ┌────▼────┐ ┌────────▼────────┐ ┌────▼────┐ ┌─────────▼─────────┐
    │                   │ │         │ │                 │ │         │ │                   │
    │   BUDGET AGENT    │ │OPTIMIZER│ │  BOOKING AGENT  │ │ MONITOR │ │  EXCEPTION AGENT  │
    │                   │ │  AGENT  │ │                 │ │  AGENT  │ │                   │
    └───────────────────┘ └─────────┘ └─────────────────┘ └─────────┘ └───────────────────┘
```

### Agent Responsibilities

#### 1. Orchestrator Agent (Central Coordinator)
**Role:** Manages the entire trip lifecycle and coordinates all specialized agents

**Responsibilities:**
- Receives user requests and determines which agents to invoke
- Maintains trip state across the planning-to-completion lifecycle
- Routes tasks to appropriate specialized agents
- Aggregates responses and resolves conflicts between agents
- Manages agent execution order and dependencies
- Provides unified response to user interface

**Key Decisions:**
- When to trigger re-optimization
- How to handle conflicting agent recommendations
- When to escalate to user for decisions
- Priority ordering when multiple agents need resources

#### 2. Budget Agent
**Role:** Owns all financial aspects of the trip

**Responsibilities:**
- Initial budget allocation across 6 categories
- Real-time spend tracking and remaining budget calculation
- Budget reallocation when priorities change
- Enforces hard budget constraints across all decisions
- Provides budget health reports to orchestrator
- Alerts when categories approach/exceed limits

**Inputs:** Total budget, user priorities, spend records
**Outputs:** Category allocations, remaining budgets, budget alerts

#### 3. Optimization Agent
**Role:** Continuously finds better options within constraints

**Responsibilities:**
- Monitors prices for unlocked items
- Identifies savings opportunities (>10% threshold)
- Generates alternative recommendations
- Respects lock-down constraints
- Balances optimization aggressiveness with user preferences
- Ranks alternatives by value improvement

**Inputs:** Current selections, price feeds, lock statuses, budget constraints
**Outputs:** Optimization opportunities, alternative recommendations

#### 4. Booking Agent
**Role:** Manages the actual booking process

**Responsibilities:**
- Validates availability before booking
- Executes bookings through integrated APIs
- Handles booking confirmations and receipts
- Manages booking modifications and cancellations
- Extracts structured data from booking confirmations
- Updates trip state with confirmed bookings

**Inputs:** Selected options, user payment info, booking requests
**Outputs:** Booking confirmations, booking failures, modification results

#### 5. Monitoring Agent
**Role:** Watches for changes that affect the trip

**Responsibilities:**
- Tracks price changes on watched items
- Monitors flight schedule changes
- Detects hotel availability changes
- Watches for relevant alerts (weather, events, closures)
- Triggers notifications for significant changes
- Feeds data to optimization agent

**Inputs:** Watched items, external feeds, alert sources
**Outputs:** Change notifications, price updates, schedule alerts

#### 6. Exception Agent
**Role:** Handles disruptions and problems

**Responsibilities:**
- Manages cancellations and rebooking
- Handles schedule conflicts
- Processes refunds and credits
- Resolves booking failures
- Coordinates recovery from disruptions
- Communicates issues to user with solutions

**Inputs:** Exception events, current bookings, available alternatives
**Outputs:** Resolution actions, rebooking options, refund status

### Agent Communication Protocol

```typescript
interface AgentMessage {
  messageId: string;
  fromAgent: AgentType;
  toAgent: AgentType;
  messageType: 'REQUEST' | 'RESPONSE' | 'EVENT' | 'ALERT';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  payload: unknown;
  correlationId?: string;  // Links related messages
  timestamp: Date;
}

type AgentType =
  | 'ORCHESTRATOR'
  | 'BUDGET'
  | 'OPTIMIZATION'
  | 'BOOKING'
  | 'MONITORING'
  | 'EXCEPTION';
```

### Agent State Machine

Each trip progresses through states, with different agents active at each stage:

```
PLANNING → OPTIMIZING → BOOKING → CONFIRMED → ACTIVE → COMPLETED
    │          │           │          │          │
    └── Budget Agent ──────┴──────────┘          │
    └── Optimization Agent ───────────┴──────────┘
                   └── Booking Agent ─┴──────────┘
                              └── Monitoring Agent ┘
                                        └── Exception Agent (on-demand)
```

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
| Agent Infrastructure | ❌ Missing | No orchestrator or specialized agents |
| Agent Communication | ❌ Missing | No inter-agent messaging system |
| Trip State Machine | ❌ Missing | No lifecycle state management |

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

### Phase 0: Agent Framework Infrastructure
**Goal:** Establish the foundational multi-agent architecture with orchestrator and agent base classes

**Tasks:**
- [ ] Define `AgentType` enum and `AgentMessage` interface
- [ ] Create base `Agent` abstract class with common lifecycle methods
- [ ] Implement `OrchestratorAgent` as central coordinator
- [ ] Create agent registry for dynamic agent discovery
- [ ] Implement inter-agent message bus (pub/sub pattern)
- [ ] Define `TripState` enum and state machine transitions
- [ ] Create `AgentContext` for shared state access
- [ ] Add agent execution logging and tracing
- [ ] Implement agent health checks and status reporting

**Files to Create:**
```
src/agents/
├── types.ts                    # AgentType, AgentMessage, AgentContext
├── base.agent.ts               # Abstract Agent base class
├── orchestrator.agent.ts       # Central orchestrator
├── registry.ts                 # Agent registration and discovery
├── message-bus.ts              # Inter-agent communication
├── state-machine.ts            # Trip lifecycle state management
├── budget.agent.ts             # Budget agent (stub)
├── optimization.agent.ts       # Optimization agent (stub)
├── booking.agent.ts            # Booking agent (stub)
├── monitoring.agent.ts         # Monitoring agent (stub)
└── exception.agent.ts          # Exception agent (stub)
```

**Agent Base Class:**
```typescript
abstract class Agent {
  abstract readonly type: AgentType;
  abstract readonly capabilities: string[];

  abstract initialize(context: AgentContext): Promise<void>;
  abstract handleMessage(message: AgentMessage): Promise<AgentMessage | null>;
  abstract healthCheck(): Promise<AgentHealth>;

  protected async sendMessage(to: AgentType, payload: unknown): Promise<void>;
  protected async requestFromAgent<T>(to: AgentType, payload: unknown): Promise<T>;
}
```

**Orchestrator Pattern:**
```typescript
class OrchestratorAgent extends Agent {
  async planTrip(request: TripRequest): Promise<TripPlan> {
    // 1. Ask Budget Agent to allocate budget
    const allocation = await this.requestFromAgent<BudgetAllocation>(
      'BUDGET',
      { type: 'ALLOCATE', budget: request.budget, priorities: request.priorities }
    );

    // 2. Generate candidates within budget constraints
    const candidates = await this.generateCandidates(allocation);

    // 3. Ask Optimization Agent to rank candidates
    const ranked = await this.requestFromAgent<RankedOptions>(
      'OPTIMIZATION',
      { type: 'RANK', candidates, constraints: allocation }
    );

    return { options: ranked.top3, allocation };
  }
}
```

**Estimated Scope:** Large (Foundation for all future phases)

---

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
| **P0** | 0 | Agent framework infrastructure | Foundation for AI-powered system |
| **P1** | 1, 2 | Extended budget categories, Lock-down mechanism | Core CFO functionality |
| **P2** | 3 | Activities integration | Complete trip planning |
| **P3** | 5 | Spend tracking | Real-time budget management |
| **P4** | 4 | API integration foundation | Production readiness |
| **P5** | 6 | Continuous optimization | Proactive value delivery |

---

## Success Metrics

### Phase 0 Complete When:
- [ ] All 6 agent types defined with base class implementation
- [ ] Orchestrator can coordinate requests between agents
- [ ] Message bus enables async agent communication
- [ ] Trip state machine manages lifecycle transitions
- [ ] Agent health checks report status correctly
- [ ] Existing services refactored to work through agent layer

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
├── agents/                    # NEW: Multi-agent architecture
│   ├── types.ts               # AgentType, AgentMessage, AgentContext, AgentHealth
│   ├── base.agent.ts          # Abstract Agent base class
│   ├── orchestrator.agent.ts  # Central coordinator agent
│   ├── budget.agent.ts        # Budget allocation and tracking agent
│   ├── optimization.agent.ts  # Price monitoring and re-optimization agent
│   ├── booking.agent.ts       # Booking execution agent
│   ├── monitoring.agent.ts    # Change detection and alerting agent
│   ├── exception.agent.ts     # Disruption handling agent
│   ├── registry.ts            # Agent registration and discovery
│   ├── message-bus.ts         # Inter-agent pub/sub communication
│   └── state-machine.ts       # Trip lifecycle state transitions
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
│   ├── agent.routes.ts        # NEW: Agent status and control endpoints
│   └── spend.routes.ts        # NEW: Spend tracking endpoints
├── scoring/                   # Existing (modified)
├── services/
│   ├── budget.service.ts      # MODIFIED: 6 categories, called by Budget Agent
│   ├── candidate.service.ts   # Existing, called by Orchestrator
│   ├── claude.service.ts      # Existing, used by all AI agents
│   ├── interaction.service.ts # Existing
│   ├── parsing.service.ts     # Existing, used by Booking Agent
│   ├── trip.service.ts        # MODIFIED: Delegates to Orchestrator Agent
│   ├── verification.service.ts # Existing, used by Booking Agent
│   ├── activity.service.ts    # NEW
│   ├── lockdown.service.ts    # NEW
│   ├── spend.service.ts       # NEW
│   ├── optimization.service.ts # NEW, used by Optimization Agent
│   └── notification.service.ts # NEW, used by Monitoring Agent
├── types/
│   ├── api.types.ts           # Existing
│   ├── parsing.types.ts       # Existing
│   ├── verification.types.ts  # Existing
│   ├── budget.types.ts        # NEW
│   ├── activity.types.ts      # NEW
│   ├── lockdown.types.ts      # NEW
│   ├── spend.types.ts         # NEW
│   └── optimization.types.ts  # NEW
└── server.ts                  # MODIFIED: Initializes agent registry
```

---

*Document generated: January 2026*
*Last updated: Based on codebase analysis*
