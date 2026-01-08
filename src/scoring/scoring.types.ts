/**
 * Type definitions for the Trip Scoring Engine
 *
 * These types define the contract between the scoring engine
 * and the rest of the application.
 */

/**
 * Flight data required for scoring
 */
export interface FlightData {
  /** Flight price in cents */
  price: number;
}

/**
 * Hotel data required for scoring
 */
export interface HotelData {
  /** Total hotel price for entire stay in cents */
  priceTotal: number;
  /** Number of nights */
  nights: number;
  /** Hotel rating (nullable - some hotels don't have ratings) */
  rating: number | null;
}

/**
 * Destination data required for scoring
 */
export interface DestinationData {
  /** Destination city/location name */
  name: string;
}

/**
 * A trip option candidate to be scored
 *
 * This represents a fully assembled trip option with all
 * the data needed for deterministic scoring.
 */
export interface TripOptionCandidate {
  /** Unique identifier for this candidate */
  id: string;

  /** Total trip budget in cents */
  budgetTotal: number;

  /** Remaining budget after flight + hotel in cents */
  remainingBudget: number;

  /** Maximum allowed flight budget in cents (based on BudgetConfig) */
  maxAllowedFlightBudget: number;

  /** Flight details */
  flight: FlightData;

  /** Hotel details */
  hotel: HotelData;

  /** Destination details */
  destination: DestinationData;
}

/**
 * Individual component scores (all between 0 and 1)
 */
export interface ScoreComponents {
  /** Flight value score: lower price relative to budget = higher score */
  flightScore: number;

  /** Hotel value score: better rating per dollar = higher score */
  hotelScore: number;

  /** Budget efficiency: more remaining budget = higher score */
  budgetEfficiency: number;

  /** Destination density: tourist-friendly destinations score higher */
  destinationDensity: number;
}

/**
 * Complete scoring result for a trip option
 */
export interface ScoringResult {
  /** Reference to the scored candidate */
  candidateId: string;

  /** Final weighted score between 0 and 1 */
  finalScore: number;

  /** Breakdown of individual component scores */
  components: ScoreComponents;

  /** Timestamp when scoring was performed */
  scoredAt: Date;
}

/**
 * Context for batch scoring operations
 *
 * Used when scoring multiple options together to enable
 * normalization of relative metrics (like hotel value).
 */
export interface ScoringContext {
  /** Minimum hotel value across all candidates (for normalization) */
  minHotelValue: number;

  /** Maximum hotel value across all candidates (for normalization) */
  maxHotelValue: number;
}

/**
 * Result of batch scoring multiple candidates
 */
export interface BatchScoringResult {
  /** Scored results, sorted by finalScore descending */
  results: ScoringResult[];

  /** IDs of candidates rejected for being over budget */
  rejectedOverBudget: string[];

  /** Context used for normalization */
  context: ScoringContext;
}

/**
 * Error thrown when a candidate exceeds budget
 */
export class OverBudgetError extends Error {
  constructor(
    public readonly candidateId: string,
    public readonly totalCost: number,
    public readonly budgetTotal: number
  ) {
    super(
      `Candidate ${candidateId} exceeds budget: ` +
      `cost ${totalCost} > budget ${budgetTotal}`
    );
    this.name = 'OverBudgetError';
  }
}
