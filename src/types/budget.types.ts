/**
 * Budget Types (Phase 1)
 *
 * Extended types for 6-category budget allocation with priorities.
 */

import { BudgetCategory } from '@prisma/client';

// ============================================
// BUDGET ALLOCATION TYPES
// ============================================

/**
 * Budget allocation across all 6 categories
 * All amounts in cents
 */
export interface ExtendedBudgetAllocation {
  flight: number;
  hotel: number;
  activity: number;
  food: number;
  transport: number;
  contingency: number;
}

/**
 * Priority ranking for budget categories
 * Lower number = higher priority (1 is highest)
 */
export interface BudgetPriorities {
  flight?: number;
  hotel?: number;
  activity?: number;
  food?: number;
  transport?: number;
  contingency?: number;
}

/**
 * User constraints for trip planning
 */
export interface TripConstraints {
  mustHave?: string[];      // Required features (e.g., ["direct flights", "hotel breakfast"])
  mustAvoid?: string[];     // Things to avoid (e.g., ["long layovers"])
  preferences?: {
    [key: string]: unknown; // Open-ended preferences
  };
}

// ============================================
// CONFIGURATION TYPES
// ============================================

/**
 * Extended budget configuration with all 6 categories
 */
export interface ExtendedBudgetConfig {
  travelStyle: string;
  flightPct: number;
  hotelPct: number;
  activityPct: number;
  foodPct: number;
  transportPct: number;
  contingencyPct: number;
}

/**
 * Result of budget allocation operation
 */
export interface BudgetAllocationResult {
  allocations: ExtendedBudgetAllocation;
  totalAllocated: number;
  remaining: number;
}

// ============================================
// TRACKING TYPES
// ============================================

/**
 * Track spending for a category
 */
export interface CategorySpending {
  category: BudgetCategory;
  allocated: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
}

/**
 * Complete budget status for a trip
 */
export interface TripBudgetStatus {
  totalBudget: number;
  totalAllocated: number;
  totalSpent: number;
  totalRemaining: number;
  categories: CategorySpending[];
  warnings: BudgetWarning[];
}

/**
 * Budget warning when approaching limits
 */
export interface BudgetWarning {
  category: BudgetCategory;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  percentageUsed: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Convert category name string to BudgetCategory enum
 */
export function toBudgetCategory(category: string): BudgetCategory {
  const upperCategory = category.toUpperCase() as keyof typeof BudgetCategory;
  return BudgetCategory[upperCategory];
}

/**
 * Get all budget categories as array
 */
export function getAllCategories(): BudgetCategory[] {
  return [
    BudgetCategory.FLIGHT,
    BudgetCategory.HOTEL,
    BudgetCategory.ACTIVITY,
    BudgetCategory.FOOD,
    BudgetCategory.TRANSPORT,
    BudgetCategory.CONTINGENCY,
  ];
}

/**
 * Calculate percentage used for a category
 */
export function calculatePercentageUsed(spent: number, allocated: number): number {
  if (allocated === 0) return 0;
  return (spent / allocated) * 100;
}

/**
 * Determine warning severity based on percentage used
 */
export function getWarningSeverity(percentageUsed: number): BudgetWarning['severity'] {
  if (percentageUsed >= 100) return 'critical';
  if (percentageUsed >= 90) return 'warning';
  if (percentageUsed >= 75) return 'info';
  return 'info';
}

/**
 * Format budget category for display
 */
export function formatCategoryName(category: BudgetCategory): string {
  const names: Record<BudgetCategory, string> = {
    [BudgetCategory.FLIGHT]: 'Flights',
    [BudgetCategory.HOTEL]: 'Accommodation',
    [BudgetCategory.ACTIVITY]: 'Activities',
    [BudgetCategory.FOOD]: 'Food & Dining',
    [BudgetCategory.TRANSPORT]: 'Transportation',
    [BudgetCategory.CONTINGENCY]: 'Contingency',
  };
  return names[category];
}
