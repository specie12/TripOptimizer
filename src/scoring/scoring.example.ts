/**
 * Trip Scoring Engine - Example Usage
 *
 * This file demonstrates how to use the scoring engine with
 * mock TripOption candidates and includes assertions to verify
 * correct behavior.
 *
 * Run with: npx ts-node src/scoring/scoring.example.ts
 */

import { scoreTripOptions, getTopScoredOptions, validateBudget } from './index';
import { TripOptionCandidate, ScoringResult } from './scoring.types';
import { SCORING_CONFIG } from './scoring.config';

// =============================================================================
// MOCK DATA: 3 TripOption Candidates
// =============================================================================

/**
 * Candidate 1: Budget-friendly Paris trip
 * - Cheap flight, decent hotel, good destination
 * - Expected: High score due to good value
 */
const candidate1: TripOptionCandidate = {
  id: 'trip-001',
  budgetTotal: 200000, // $2,000 total budget
  remainingBudget: 50000, // $500 remaining for activities
  maxAllowedFlightBudget: 70000, // $700 max for flights (35% of budget)
  flight: {
    price: 45000, // $450 flight (well under budget)
  },
  hotel: {
    priceTotal: 105000, // $1,050 for hotel
    nights: 5,
    rating: 4.2,
  },
  destination: {
    name: 'Paris',
  },
};

/**
 * Candidate 2: Mid-range Tokyo trip
 * - Moderate prices, good rating, excellent destination
 * - Expected: Medium-high score
 */
const candidate2: TripOptionCandidate = {
  id: 'trip-002',
  budgetTotal: 200000,
  remainingBudget: 30000, // $300 remaining
  maxAllowedFlightBudget: 70000,
  flight: {
    price: 60000, // $600 flight (closer to max)
  },
  hotel: {
    priceTotal: 110000, // $1,100 for hotel
    nights: 5,
    rating: 4.5,
  },
  destination: {
    name: 'Tokyo',
  },
};

/**
 * Candidate 3: Unknown destination, no rating
 * - Cheap but risky (no hotel rating)
 * - Expected: Lower score due to missing rating penalty
 */
const candidate3: TripOptionCandidate = {
  id: 'trip-003',
  budgetTotal: 200000,
  remainingBudget: 60000, // $600 remaining (good efficiency)
  maxAllowedFlightBudget: 70000,
  flight: {
    price: 40000, // $400 flight (cheapest)
  },
  hotel: {
    priceTotal: 100000, // $1,000 for hotel
    nights: 5,
    rating: null, // No rating - will be penalized
  },
  destination: {
    name: 'Unknown City', // Will get default 0.5 density
  },
};

/**
 * Candidate 4: Over-budget trip (should be rejected)
 */
const overBudgetCandidate: TripOptionCandidate = {
  id: 'trip-004-over-budget',
  budgetTotal: 100000, // $1,000 budget
  remainingBudget: -50000, // Already over!
  maxAllowedFlightBudget: 35000,
  flight: {
    price: 80000, // $800 flight
  },
  hotel: {
    priceTotal: 70000, // $700 hotel
    // Total: $1,500 > $1,000 budget
    nights: 3,
    rating: 4.0,
  },
  destination: {
    name: 'Miami',
  },
};

// =============================================================================
// EXAMPLE: Score all candidates
// =============================================================================

console.log('='.repeat(60));
console.log('TRIP SCORING ENGINE - EXAMPLE');
console.log('='.repeat(60));

// Display configuration
console.log('\n📊 SCORING CONFIGURATION:');
console.log(`   Flight weight:      ${SCORING_CONFIG.weights.flight * 100}%`);
console.log(`   Hotel weight:       ${SCORING_CONFIG.weights.hotel * 100}%`);
console.log(`   Budget efficiency:  ${SCORING_CONFIG.weights.budgetEfficiency * 100}%`);
console.log(`   Destination:        ${SCORING_CONFIG.weights.destinationDensity * 100}%`);
console.log(`   Missing rating penalty: ${(1 - SCORING_CONFIG.defaults.missingRatingPenalty) * 100}%`);

// Score all candidates (including over-budget one)
const allCandidates = [candidate1, candidate2, candidate3, overBudgetCandidate];
const batchResult = scoreTripOptions(allCandidates);

console.log('\n' + '='.repeat(60));
console.log('SCORING RESULTS');
console.log('='.repeat(60));

// Show rejected candidates
if (batchResult.rejectedOverBudget.length > 0) {
  console.log('\n❌ REJECTED (Over Budget):');
  for (const id of batchResult.rejectedOverBudget) {
    const candidate = allCandidates.find((c) => c.id === id)!;
    const validation = validateBudget(candidate);
    console.log(`   ${id}: Cost $${(validation.totalCost / 100).toFixed(2)} > Budget $${(validation.budgetTotal / 100).toFixed(2)} (deficit: $${(validation.deficit! / 100).toFixed(2)})`);
  }
}

// Show scored results
console.log('\n✅ SCORED CANDIDATES (Ranked by Score):');
console.log('-'.repeat(60));

batchResult.results.forEach((result, index) => {
  const candidate = allCandidates.find((c) => c.id === result.candidateId)!;
  const rank = index + 1;

  console.log(`\n#${rank} ${result.candidateId} - ${candidate.destination.name}`);
  console.log(`   Final Score: ${(result.finalScore * 100).toFixed(1)}%`);
  console.log('   Component Breakdown:');
  console.log(`     • Flight Score:        ${(result.components.flightScore * 100).toFixed(1)}% (weight: 35%)`);
  console.log(`     • Hotel Score:         ${(result.components.hotelScore * 100).toFixed(1)}% (weight: 35%)`);
  console.log(`     • Budget Efficiency:   ${(result.components.budgetEfficiency * 100).toFixed(1)}% (weight: 20%)`);
  console.log(`     • Destination Density: ${(result.components.destinationDensity * 100).toFixed(1)}% (weight: 10%)`);
});

// =============================================================================
// ASSERTIONS: Verify correct behavior
// =============================================================================

console.log('\n' + '='.repeat(60));
console.log('ASSERTIONS');
console.log('='.repeat(60));

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`✓ PASS: ${message}`);
    passed++;
  } else {
    console.log(`✗ FAIL: ${message}`);
    failed++;
  }
}

// 1. Over-budget candidate should be rejected
assert(
  batchResult.rejectedOverBudget.includes('trip-004-over-budget'),
  'Over-budget candidate is rejected'
);

// 2. All scored results should be within budget
assert(
  batchResult.results.every((r) => {
    const c = allCandidates.find((x) => x.id === r.candidateId)!;
    return c.flight.price + c.hotel.priceTotal <= c.budgetTotal;
  }),
  'All scored candidates are within budget'
);

// 3. All scores should be between 0 and 1
assert(
  batchResult.results.every((r) => r.finalScore >= 0 && r.finalScore <= 1),
  'All final scores are between 0 and 1'
);

// 4. All component scores should be between 0 and 1
assert(
  batchResult.results.every((r) =>
    r.components.flightScore >= 0 && r.components.flightScore <= 1 &&
    r.components.hotelScore >= 0 && r.components.hotelScore <= 1 &&
    r.components.budgetEfficiency >= 0 && r.components.budgetEfficiency <= 1 &&
    r.components.destinationDensity >= 0 && r.components.destinationDensity <= 1
  ),
  'All component scores are between 0 and 1'
);

// 5. Results should be sorted by score descending
assert(
  batchResult.results.every((r, i) =>
    i === 0 || r.finalScore <= batchResult.results[i - 1].finalScore
  ),
  'Results are sorted by score (highest first)'
);

// 6. Paris should have high destination density (0.95)
const parisResult = batchResult.results.find((r) => r.candidateId === 'trip-001');
assert(
  parisResult !== undefined && parisResult.components.destinationDensity === 0.95,
  'Paris has correct destination density (0.95)'
);

// 7. Unknown city should have default density (0.5)
const unknownResult = batchResult.results.find((r) => r.candidateId === 'trip-003');
assert(
  unknownResult !== undefined && unknownResult.components.destinationDensity === 0.5,
  'Unknown destination has default density (0.5)'
);

// 8. getTopScoredOptions returns correct number
const top2 = getTopScoredOptions(allCandidates, 2);
assert(
  top2.length === 2,
  'getTopScoredOptions(2) returns exactly 2 results'
);

console.log('\n' + '-'.repeat(60));
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
console.log('='.repeat(60));

// Exit with error code if any assertions failed
if (failed > 0) {
  process.exit(1);
}

// =============================================================================
// INTEGRATION NOTES
// =============================================================================

console.log('\n📝 INTEGRATION NOTES:');
console.log(`
The scoring engine integrates with the trip generation flow:

1. TripRequest comes in with budget and preferences
2. System generates candidate TripOptions (flight + hotel combos)
3. Call scoreTripOptions(candidates) to rank them
4. Store top 2-3 TripOptions in database with their scores
5. The 'score' field in TripOption model stores finalScore

Example integration:

  import { scoreTripOptions } from './scoring';

  async function generateAndScoreTrips(request: TripRequest) {
    // Generate candidates from flight/hotel APIs
    const candidates = await generateCandidates(request);

    // Score and rank
    const { results, rejectedOverBudget } = scoreTripOptions(candidates);

    // Store top 3 in database
    for (const result of results.slice(0, 3)) {
      await prisma.tripOption.create({
        data: {
          tripRequestId: request.id,
          destination: '...',
          totalCost: '...',
          remainingBudget: '...',
          score: result.finalScore,  // <-- Store the score
          explanation: '...',
          itineraryJson: {},
        }
      });
    }
  }
`);
