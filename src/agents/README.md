# Agents Directory - Architecture Evolution

**Last Updated**: 2026-01-24
**Status**: Phase 1 Refactoring Complete

---

## Architecture Change

The agent system has been refactored from **6 agents** to **4 AI agents** with strict boundaries.

### Old Architecture (Before Phase 1)
```
src/agents/
├── orchestrator.agent.ts  ❌ DEPRECATED
├── budget.agent.ts        ❌ DEPRECATED
├── optimization.agent.ts  ❌ DEPRECATED
├── booking.agent.ts       ❌ DEPRECATED (will be replaced by BookingOrchestrator in Phase 2)
├── monitoring.agent.ts    ⚠️ TO BE CONVERTED TO BACKGROUND JOB
├── exception.agent.ts     ❌ DEPRECATED (replaced by error handling service)
```

### New Architecture (After Phase 1)
```
src/agents/
├── ai-agents.ts           ✅ NEW - AI agent interfaces (4 agents)
├── base.agent.ts          ⚠️ KEEP - Base agent class for future extensibility
├── message-bus.ts         ⚠️ KEEP - Message bus for future agent communication
├── state-machine.ts       ⚠️ KEEP - Trip state machine
├── registry.ts            ⚠️ KEEP - Agent registry
└── types.ts               ⚠️ KEEP - Agent types

src/services/
├── ai-agent.service.ts    ✅ NEW - Implementation of 4 AI agents
├── budget.service.ts      ✅ DETERMINISTIC - No AI
├── candidate.service.ts   ✅ DETERMINISTIC - No AI
├── scoring/               ✅ DETERMINISTIC - No AI
├── activity.service.ts    ✅ DETERMINISTIC - No AI
├── lockdown.service.ts    ✅ DETERMINISTIC - No AI
├── optimization.service.ts ✅ DETERMINISTIC - No AI
├── parsing.service.ts     ✅ AI AGENT - Parsing Agent
├── verification.service.ts ✅ AI AGENT - Verification Agent
└── claude.service.ts      ⚠️ LEGACY WRAPPER - Use ai-agent.service.ts instead
```

---

## The 4 AI Agents

See [AI_AGENT_BOUNDARIES.md](../../AI_AGENT_BOUNDARIES.md) for complete documentation.

### 1. Activity Discovery Agent
- **Purpose**: Discover activities from unstructured sources
- **File**: `src/services/ai-agent.service.ts`
- **Export**: `activityDiscoveryAgent`

### 2. Itinerary Composition Agent
- **Purpose**: Generate narrative itineraries from confirmed bookings
- **File**: `src/services/ai-agent.service.ts`
- **Export**: `itineraryCompositionAgent`

### 3. Parsing Agent
- **Purpose**: Extract structured data from booking confirmations
- **File**: `src/services/parsing.service.ts`
- **Export**: `parseBookingContent()`

### 4. Verification Agent
- **Purpose**: Verify entity existence and operational status
- **File**: `src/services/verification.service.ts`
- **Export**: `verifyEntity()`

---

## Migration Guide

### ❌ Old: Using Orchestrator Agent
```typescript
import { OrchestratorAgent } from './agents/orchestrator.agent';

const orchestrator = new OrchestratorAgent();
const result = await orchestrator.createTripPlan({
  tripRequestId: '123',
  totalBudget: 200000,
  priorities: { ... }
});
```

### ✅ New: Direct Service Calls
```typescript
import { allocateExtendedBudget } from './services/budget.service';
import { generateCandidates } from './services/candidate.service';
import { scoreCandidate } from './scoring/';

// Step 1: Allocate budget (deterministic)
const budgetAllocation = allocateExtendedBudget(totalBudget, config, priorities);

// Step 2: Generate candidates (deterministic)
const candidates = await generateCandidates(params);

// Step 3: Score candidates (deterministic)
const scoredCandidates = candidates.map(c => ({
  ...c,
  score: scoreCandidate(c, weights)
}));
```

---

## Why This Change?

### Problems with Old Architecture

1. **Agent Orchestration Overhead**: 6 agents communicating via message bus added complexity
2. **AI Boundary Confusion**: Unclear which agents used AI and which were deterministic
3. **Debugging Difficulty**: Message passing made it hard to trace bugs
4. **Performance**: Multiple agent initializations and message passing caused latency

### Benefits of New Architecture

1. **Clear AI Boundaries**: Only 4 agents use AI, all others are pure services
2. **Simpler Debugging**: Direct function calls with clear stack traces
3. **Better Performance**: No message passing overhead
4. **Easier Testing**: Services can be unit tested in isolation
5. **Compliance**: Easy to audit AI usage and ensure deterministic logic

---

## Deprecated Agents

### orchestrator.agent.ts ❌
**Reason**: Logic moved to `trip.service.ts` for direct service orchestration

**Migration**: Replace orchestrator calls with direct service calls:
```typescript
// Old
const result = await orchestrator.createTripPlan(params);

// New
const budgetAllocation = await allocateBudget(params);
const candidates = await generateCandidates(params);
const scored = scoreCandidates(candidates);
```

---

### budget.agent.ts ❌
**Reason**: Logic already exists in `budget.service.ts` (deterministic, no agent needed)

**Migration**: Use `budget.service.ts` directly:
```typescript
// Old
const budgetAgent = new BudgetAgent();
const allocation = await budgetAgent.allocateBudget(params);

// New
import { allocateExtendedBudget } from './services/budget.service';
const allocation = allocateExtendedBudget(totalBudget, config, priorities);
```

---

### optimization.agent.ts ❌
**Reason**: Logic already exists in `optimization.service.ts` (deterministic, no agent needed)

**Migration**: Use `optimization.service.ts` directly:
```typescript
// Old
const optimizationAgent = new OptimizationAgent();
const result = await optimizationAgent.rankCandidates(candidates);

// New
import { monitorPrices, triggerReOptimization } from './services/optimization.service';
await monitorPrices(tripOptionId);
```

---

### booking.agent.ts ❌
**Reason**: Stub implementation, will be replaced by `BookingOrchestrator` in Phase 2

**Status**: Will be replaced in Phase 2 with real booking orchestration

**Migration**: Wait for Phase 2, or use integration layer directly for now:
```typescript
// Phase 2 will introduce:
import { BookingOrchestratorService } from './services/booking-orchestrator.service';
const result = await bookingOrchestrator.bookTrip(tripOptionId, paymentInfo);
```

---

### exception.agent.ts ❌
**Reason**: Exception handling should be done via standard error handling patterns

**Migration**: Use try/catch and error handling middleware:
```typescript
// Old
const exceptionAgent = new ExceptionAgent();
await exceptionAgent.handleException(error);

// New
try {
  // Business logic
} catch (error) {
  console.error('Error:', error);
  // Standard error handling
}
```

---

### monitoring.agent.ts ⚠️
**Status**: Will be converted to a background job in Phase 6

**Current**: Still exists as an agent
**Future**: Will become `src/jobs/monitoring.job.ts`

---

## What Files to Keep

### Keep (Core Agent Infrastructure)

These files provide the foundation for future agent extensibility:

- **base.agent.ts**: Base class for agents (message handling, lifecycle)
- **message-bus.ts**: Pub/sub message bus for future agent communication
- **state-machine.ts**: Trip state machine (PLANNING → OPTIMIZING → BOOKING → etc.)
- **registry.ts**: Agent registry for dynamic agent lookup
- **types.ts**: Core agent types and interfaces

**Why Keep**: Future features may need agent architecture (e.g., real-time price monitoring)

### Keep (New AI Agent System)

- **ai-agents.ts**: Interfaces for 4 AI agents with strict boundaries
- **src/services/ai-agent.service.ts**: Implementation of 4 AI agents

---

## Testing

### Run Tests
```bash
# Test AI agent boundaries (ensure AI is NOT called for deterministic logic)
npm run test:ai-boundaries

# Test individual agents
npm run test:activity-discovery
npm run test:itinerary-composition
npm run test:parsing
npm run test:verification
```

### Manual Testing
```bash
# Enable audit logging
export ENABLE_AI_AUDIT=true

# Run trip generation
npm run dev

# Check logs for AI calls - should only see:
# - Activity Discovery Agent (1 call)
# - Itinerary Composition Agent (3 calls - one per trip option)
```

---

## Future Roadmap

### Phase 2: Booking Orchestrator
- Replace `booking.agent.ts` with `BookingOrchestratorService`
- Implement real booking via Amadeus API + Stripe

### Phase 3: Itinerary Export
- Add PDF generation service
- Add shareable link service

### Phase 4: Enhanced Activity Discovery
- Integrate Google Places API
- Add activity database fallback

### Phase 6: Monitoring as Background Job
- Convert `monitoring.agent.ts` to cron job
- Add price monitoring dashboard

---

## Questions?

See [AI_AGENT_BOUNDARIES.md](../../AI_AGENT_BOUNDARIES.md) for detailed documentation.

Contact the development team or open an issue for questions about the new architecture.
