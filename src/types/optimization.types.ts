/**
 * Optimization Types (Phase 6)
 *
 * Types for continuous optimization, price monitoring, and alternative recommendations
 */

import { LockStatus } from '@prisma/client';

// =============================================================================
// OPTIMIZATION TRIGGER TYPES
// =============================================================================

/**
 * Reasons why optimization was triggered
 */
export enum OptimizationTrigger {
  PRICE_DROP = 'PRICE_DROP',               // Price decreased significantly
  BETTER_OPTION = 'BETTER_OPTION',         // New better option available
  SCHEDULE_CHANGE = 'SCHEDULE_CHANGE',     // Flight/hotel schedule changed
  MANUAL = 'MANUAL',                       // User requested re-optimization
  PERIODIC = 'PERIODIC',                   // Scheduled periodic check
}

/**
 * Optimization opportunity types
 */
export enum OpportunityType {
  COST_SAVINGS = 'COST_SAVINGS',           // Can save money
  BETTER_VALUE = 'BETTER_VALUE',           // Better value for same price
  UPGRADE = 'UPGRADE',                     // Upgrade opportunity within budget
  SCHEDULE_IMPROVEMENT = 'SCHEDULE_IMPROVEMENT', // Better flight/hotel times
}

// =============================================================================
// PRICE MONITORING TYPES
// =============================================================================

/**
 * Price change record
 */
export interface PriceChange {
  entityType: 'flight' | 'hotel' | 'activity';
  entityId: string;
  oldPrice: number; // In cents
  newPrice: number; // In cents
  priceDifference: number; // Negative = savings
  percentageChange: number; // Percentage
  detectedAt: Date;
}

/**
 * Price monitoring result
 */
export interface PriceMonitoringResult {
  tripRequestId: string;
  monitoredAt: Date;
  priceChanges: PriceChange[];
  totalSavingsOpportunity: number; // In cents
  hasSignificantChanges: boolean;
}

// =============================================================================
// OPTIMIZATION OPPORTUNITY TYPES
// =============================================================================

/**
 * Optimization opportunity
 */
export interface OptimizationOpportunity {
  id: string;
  tripRequestId: string;
  opportunityType: OpportunityType;
  trigger: OptimizationTrigger;
  title: string;
  description: string;
  potentialSavings: number; // In cents
  affectedEntities: AffectedEntity[];
  alternatives: AlternativeRecommendation[];
  expiresAt?: Date;
  createdAt: Date;
}

/**
 * Entity affected by optimization
 */
export interface AffectedEntity {
  entityType: 'flight' | 'hotel' | 'activity';
  entityId: string;
  currentLockStatus: LockStatus;
  canOptimize: boolean;
  reason?: string; // If canOptimize is false
}

/**
 * Alternative recommendation
 */
export interface AlternativeRecommendation {
  id: string;
  entityType: 'flight' | 'hotel' | 'activity';
  name: string;
  provider: string;
  price: number; // In cents
  priceDifference: number; // Compared to current
  rating?: number;
  improvementReason: string;
  deepLink: string;
}

// =============================================================================
// RE-OPTIMIZATION REQUEST/RESPONSE TYPES
// =============================================================================

/**
 * Request to re-optimize a trip
 */
export interface ReOptimizeRequest {
  tripRequestId: string;
  trigger: OptimizationTrigger;
  respectLocks: boolean; // Whether to respect locked items (default: true)
  categories?: string[]; // Optional: only re-optimize specific categories
}

/**
 * Re-optimization result
 */
export interface ReOptimizeResponse {
  success: boolean;
  tripRequestId: string;
  optimizationsFound: number;
  opportunities: OptimizationOpportunity[];
  totalPotentialSavings: number;
  message: string;
  error?: string;
}

// =============================================================================
// OPTIMIZATION CONSTRAINTS
// =============================================================================

/**
 * Constraints for optimization
 */
export interface OptimizationConstraints {
  respectLocks: boolean;
  maxPriceIncrease: number; // Max price increase allowed for upgrades (cents)
  minSavingsThreshold: number; // Min savings to trigger alert (cents)
  minPercentageChange: number; // Min % change to be significant (e.g., 0.05 = 5%)
}

/**
 * Default optimization constraints
 */
export const DEFAULT_OPTIMIZATION_CONSTRAINTS: OptimizationConstraints = {
  respectLocks: true,
  maxPriceIncrease: 5000, // $50 max increase for upgrades
  minSavingsThreshold: 1000, // $10 minimum savings
  minPercentageChange: 0.05, // 5% minimum change
};

// =============================================================================
// OPTIMIZATION HISTORY TYPES
// =============================================================================

/**
 * Optimization history record
 */
export interface OptimizationHistory {
  id: string;
  tripRequestId: string;
  trigger: OptimizationTrigger;
  opportunitiesFound: number;
  totalSavings: number;
  accepted: boolean;
  executedAt: Date;
  createdAt: Date;
}

// =============================================================================
// NOTIFICATION TYPES
// =============================================================================

/**
 * Optimization notification
 */
export interface OptimizationNotification {
  id: string;
  tripRequestId: string;
  type: OpportunityType;
  title: string;
  message: string;
  potentialSavings: number;
  actionUrl?: string;
  expiresAt?: Date;
  read: boolean;
  createdAt: Date;
}

// =============================================================================
// PRICE COMPARISON TYPES
// =============================================================================

/**
 * Price comparison result
 */
export interface PriceComparison {
  current: {
    price: number;
    provider: string;
    lastUpdated: Date;
  };
  alternatives: Array<{
    price: number;
    provider: string;
    priceDifference: number;
    percentageDifference: number;
    rating?: number;
  }>;
  bestAlternative?: {
    price: number;
    provider: string;
    savings: number;
    percentageSavings: number;
  };
}
