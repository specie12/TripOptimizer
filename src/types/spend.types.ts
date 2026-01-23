/**
 * Spend Tracking Types (Phase 5)
 *
 * Types for tracking actual spend against budget allocations
 */

import { BudgetCategory } from '@prisma/client';

// =============================================================================
// SPEND RECORD TYPES
// =============================================================================

/**
 * Spend record entry
 */
export interface SpendRecord {
  id: string;
  tripRequestId: string;
  category: BudgetCategory;
  amount: number; // In cents
  description: string;
  recordedAt: Date;
  createdAt: Date;
}

/**
 * Request to record a spend
 */
export interface RecordSpendRequest {
  tripRequestId: string;
  category: BudgetCategory;
  amount: number; // In cents
  description?: string;
}

/**
 * Spend record response
 */
export interface RecordSpendResponse {
  success: boolean;
  spendRecord?: SpendRecord;
  error?: string;
  warning?: string; // Budget warning if approaching limit
}

// =============================================================================
// BUDGET TRACKING TYPES
// =============================================================================

/**
 * Budget allocation for a category
 */
export interface CategoryBudget {
  category: BudgetCategory;
  allocated: number; // In cents
  spent: number; // In cents
  remaining: number; // In cents
  percentageUsed: number; // 0-100
  status: BudgetStatus;
}

/**
 * Budget status
 */
export enum BudgetStatus {
  HEALTHY = 'HEALTHY', // < 75% used
  WARNING = 'WARNING', // 75-90% used
  CRITICAL = 'CRITICAL', // 90-100% used
  EXCEEDED = 'EXCEEDED', // > 100% used
}

/**
 * Complete budget breakdown for a trip
 */
export interface TripBudgetBreakdown {
  tripRequestId: string;
  totalBudget: number; // In cents
  totalAllocated: number; // In cents
  totalSpent: number; // In cents
  totalRemaining: number; // In cents
  percentageUsed: number; // 0-100
  categories: CategoryBudget[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Budget alert
 */
export interface BudgetAlert {
  tripRequestId: string;
  category: BudgetCategory;
  alertType: AlertType;
  message: string;
  currentSpend: number;
  budgetLimit: number;
  percentageUsed: number;
  createdAt: Date;
}

/**
 * Alert types
 */
export enum AlertType {
  WARNING_75 = 'WARNING_75', // 75% threshold
  WARNING_90 = 'WARNING_90', // 90% threshold
  EXCEEDED = 'EXCEEDED', // Over budget
}

// =============================================================================
// SPEND SUMMARY TYPES
// =============================================================================

/**
 * Spend summary by category
 */
export interface CategorySpendSummary {
  category: BudgetCategory;
  totalSpent: number;
  numberOfRecords: number;
  averageSpend: number;
  lastSpendDate?: Date;
}

/**
 * Trip spend summary
 */
export interface TripSpendSummary {
  tripRequestId: string;
  totalSpent: number;
  categoryBreakdown: CategorySpendSummary[];
  spendRecords: SpendRecord[];
  createdAt: Date;
}

// =============================================================================
// BUDGET VALIDATION TYPES
// =============================================================================

/**
 * Budget validation result
 */
export interface BudgetValidation {
  isValid: boolean;
  canAfford: boolean;
  exceedsCategory: boolean;
  exceedsTotal: boolean;
  suggestedAmount?: number;
  warnings: string[];
  errors: string[];
}

/**
 * Request to validate a potential spend
 */
export interface ValidateSpendRequest {
  tripRequestId: string;
  category: BudgetCategory;
  amount: number; // In cents
}
