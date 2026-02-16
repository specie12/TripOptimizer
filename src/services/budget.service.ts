/**
 * Budget Service
 *
 * Handles budget configuration retrieval and deterministic budget allocation.
 * All budget calculations are pure math - no AI involvement.
 *
 * Phase 1: Extended to support 6-category budget allocation with priorities
 */

import { PrismaClient, TravelStyle, BudgetConfig, BudgetCategory } from '@prisma/client';
import { BudgetAllocation } from '../types/api.types';
import type {
  ExtendedBudgetAllocation,
  ExtendedBudgetConfig,
  BudgetPriorities,
  BudgetAllocationResult,
} from '../types/budget.types';

const prisma = new PrismaClient();

const DEFAULT_BUDGET_CONFIGS: Record<string, Omit<BudgetConfig, 'id' | 'createdAt'>> = {
  BUDGET: {
    travelStyle: TravelStyle.BUDGET,
    flightPct: 0.35,
    hotelPct: 0.35,
    activityPct: 0.10,
    foodPct: 0.08,
    transportPct: 0.07,
    contingencyPct: 0.05,
  },
  MID_RANGE: {
    travelStyle: TravelStyle.MID_RANGE,
    flightPct: 0.30,
    hotelPct: 0.35,
    activityPct: 0.15,
    foodPct: 0.12,
    transportPct: 0.05,
    contingencyPct: 0.03,
  },
  BALANCED: {
    travelStyle: TravelStyle.BALANCED,
    flightPct: 0.35,
    hotelPct: 0.40,
    activityPct: 0.12,
    foodPct: 0.08,
    transportPct: 0.03,
    contingencyPct: 0.02,
  },
  LUXURY: {
    travelStyle: TravelStyle.LUXURY,
    flightPct: 0.25,
    hotelPct: 0.45,
    activityPct: 0.15,
    foodPct: 0.10,
    transportPct: 0.03,
    contingencyPct: 0.02,
  },
};

/**
 * Get budget configuration for a travel style
 *
 * @param travelStyle - BUDGET or BALANCED
 * @returns BudgetConfig from database, or hardcoded fallback if not seeded
 */
export async function getBudgetConfig(
  travelStyle: TravelStyle
): Promise<BudgetConfig> {
  const config = await prisma.budgetConfig.findUnique({
    where: { travelStyle },
  });

  if (!config) {
    const fallback = DEFAULT_BUDGET_CONFIGS[travelStyle];
    if (!fallback) {
      throw new Error(`BudgetConfig not found for travelStyle: ${travelStyle}`);
    }
    console.warn(`BudgetConfig not found in DB for ${travelStyle}, using fallback defaults`);
    return { id: 'fallback', createdAt: new Date(), ...fallback } as BudgetConfig;
  }

  return config;
}

/**
 * Allocate budget according to configuration percentages (Legacy 3-category allocation)
 *
 * This is a pure, deterministic calculation:
 * - flightBudget = budgetTotal * flightPct
 * - hotelBudget = budgetTotal * hotelPct
 * - buffer = budgetTotal * contingencyPct (was bufferPct)
 * - activities = remaining after flight + hotel + buffer
 *
 * NOTE: This function is kept for backward compatibility.
 * New code should use allocateExtendedBudget() for 6-category allocation.
 *
 * @param budgetTotal - Total budget in cents
 * @param config - Budget configuration with percentages
 * @returns Allocated budget amounts
 */
export function allocateBudget(
  budgetTotal: number,
  config: BudgetConfig
): BudgetAllocation {
  // Calculate each allocation (all in cents)
  const maxFlightBudget = Math.floor(budgetTotal * config.flightPct);
  const maxHotelBudget = Math.floor(budgetTotal * config.hotelPct);
  const bufferAmount = Math.floor(budgetTotal * config.contingencyPct); // Changed from bufferPct

  // Activities budget is whatever remains after flight, hotel, and buffer
  const activitiesBudget = budgetTotal - maxFlightBudget - maxHotelBudget - bufferAmount;

  return {
    maxFlightBudget,
    maxHotelBudget,
    bufferAmount,
    activitiesBudget,
  };
}

/**
 * Validate that a cost is within budget
 *
 * @param cost - Cost in cents
 * @param maxBudget - Maximum allowed budget in cents
 * @returns true if within budget
 */
export function isWithinBudget(cost: number, maxBudget: number): boolean {
  return cost <= maxBudget;
}

/**
 * Calculate remaining budget after expenses
 *
 * @param budgetTotal - Total budget in cents
 * @param flightCost - Flight cost in cents
 * @param hotelCost - Hotel cost in cents
 * @returns Remaining budget for activities
 */
export function calculateRemainingBudget(
  budgetTotal: number,
  flightCost: number,
  hotelCost: number
): number {
  return budgetTotal - flightCost - hotelCost;
}

// ============================================
// PHASE 1: 6-CATEGORY BUDGET ALLOCATION
// ============================================

/**
 * Get extended budget configuration for a travel style (Phase 1)
 *
 * @param travelStyle - BUDGET or BALANCED
 * @returns Extended config with 6 categories
 */
export async function getExtendedBudgetConfig(
  travelStyle: TravelStyle
): Promise<ExtendedBudgetConfig> {
  const config = await prisma.budgetConfig.findUnique({
    where: { travelStyle },
  });

  if (!config) {
    const fallback = DEFAULT_BUDGET_CONFIGS[travelStyle];
    if (!fallback) {
      throw new Error(`BudgetConfig not found for travelStyle: ${travelStyle}`);
    }
    console.warn(`BudgetConfig not found in DB for ${travelStyle}, using fallback defaults`);
    return {
      travelStyle: fallback.travelStyle,
      flightPct: fallback.flightPct,
      hotelPct: fallback.hotelPct,
      activityPct: fallback.activityPct,
      foodPct: fallback.foodPct,
      transportPct: fallback.transportPct,
      contingencyPct: fallback.contingencyPct,
    };
  }

  return {
    travelStyle: config.travelStyle,
    flightPct: config.flightPct,
    hotelPct: config.hotelPct,
    activityPct: config.activityPct,
    foodPct: config.foodPct,
    transportPct: config.transportPct,
    contingencyPct: config.contingencyPct,
  };
}

/**
 * Allocate budget across 6 categories with priority weighting (Phase 1)
 *
 * Algorithm:
 * 1. Start with base percentages from config
 * 2. If priorities provided, slightly adjust allocations
 * 3. Ensure total allocated = budgetTotal (handle rounding)
 *
 * @param budgetTotal - Total budget in cents
 * @param config - Extended budget configuration
 * @param priorities - Optional priority rankings (1-6, lower = higher priority)
 * @returns Allocated amounts across 6 categories
 */
export function allocateExtendedBudget(
  budgetTotal: number,
  config: ExtendedBudgetConfig,
  priorities?: BudgetPriorities
): BudgetAllocationResult {
  // Base allocation using config percentages
  let allocations: ExtendedBudgetAllocation = {
    flight: Math.floor(budgetTotal * config.flightPct),
    hotel: Math.floor(budgetTotal * config.hotelPct),
    activity: Math.floor(budgetTotal * config.activityPct),
    food: Math.floor(budgetTotal * config.foodPct),
    transport: Math.floor(budgetTotal * config.transportPct),
    contingency: Math.floor(budgetTotal * config.contingencyPct),
  };

  // Apply priority adjustments if provided
  if (priorities && Object.keys(priorities).length > 0) {
    allocations = applyPriorityAdjustments(budgetTotal, allocations, priorities, config);
  }

  // Calculate totals
  const totalAllocated =
    allocations.flight +
    allocations.hotel +
    allocations.activity +
    allocations.food +
    allocations.transport +
    allocations.contingency;

  const remaining = budgetTotal - totalAllocated;

  // Distribute any remaining cents to contingency
  if (remaining > 0) {
    allocations.contingency += remaining;
  }

  return {
    allocations,
    totalAllocated: budgetTotal,
    remaining: 0,
  };
}

/**
 * Apply priority-based adjustments to budget allocation
 *
 * Higher priority categories (lower number) get a small boost
 * Lower priority categories get a small reduction
 *
 * @param budgetTotal - Total budget
 * @param baseAllocations - Base allocations from config
 * @param priorities - User priority rankings
 * @param config - Budget configuration
 * @returns Adjusted allocations
 */
function applyPriorityAdjustments(
  budgetTotal: number,
  baseAllocations: ExtendedBudgetAllocation,
  priorities: BudgetPriorities,
  config: ExtendedBudgetConfig
): ExtendedBudgetAllocation {
  // Adjustment factor: ±5% of category budget
  const adjustmentFactor = 0.05;

  const categories: Array<keyof ExtendedBudgetAllocation> = [
    'flight',
    'hotel',
    'activity',
    'food',
    'transport',
    'contingency',
  ];

  // Calculate average priority (for comparison)
  const priorityValues = Object.values(priorities).filter((p) => p !== undefined) as number[];
  const avgPriority = priorityValues.length > 0
    ? priorityValues.reduce((sum, p) => sum + p, 0) / priorityValues.length
    : 3.5;

  const adjusted = { ...baseAllocations };

  // Track total adjustments to ensure budget balance
  let totalAdjustment = 0;

  categories.forEach((category) => {
    const priority = priorities[category];
    if (priority === undefined) return;

    const baseAmount = baseAllocations[category];
    const maxAdjustment = Math.floor(baseAmount * adjustmentFactor);

    // Higher priority (lower number) = positive adjustment
    // Lower priority (higher number) = negative adjustment
    const priorityDelta = avgPriority - priority;
    const adjustment = Math.floor(maxAdjustment * (priorityDelta / 3));

    adjusted[category] = baseAmount + adjustment;
    totalAdjustment += adjustment;
  });

  // If adjustments don't sum to zero, balance with contingency
  if (totalAdjustment !== 0) {
    adjusted.contingency -= totalAdjustment;
  }

  // Ensure no negative allocations
  categories.forEach((category) => {
    if (adjusted[category] < 0) {
      adjusted[category] = Math.floor(budgetTotal * 0.05); // Minimum 5%
    }
  });

  return adjusted;
}

/**
 * Create budget allocations in database for a trip request (Phase 1)
 *
 * @param tripRequestId - Trip request ID
 * @param allocations - Budget allocations per category
 */
export async function createBudgetAllocations(
  tripRequestId: string,
  allocations: ExtendedBudgetAllocation
): Promise<void> {
  const categories: Array<{ category: BudgetCategory; amount: number }> = [
    { category: BudgetCategory.FLIGHT, amount: allocations.flight },
    { category: BudgetCategory.HOTEL, amount: allocations.hotel },
    { category: BudgetCategory.ACTIVITY, amount: allocations.activity },
    { category: BudgetCategory.FOOD, amount: allocations.food },
    { category: BudgetCategory.TRANSPORT, amount: allocations.transport },
    { category: BudgetCategory.CONTINGENCY, amount: allocations.contingency },
  ];

  await prisma.budgetAllocation.createMany({
    data: categories.map(({ category, amount }) => ({
      tripRequestId,
      category,
      allocated: amount,
      spent: 0,
    })),
  });
}

/**
 * Get budget allocations for a trip request (Phase 1)
 *
 * @param tripRequestId - Trip request ID
 * @returns Budget allocations from database
 */
export async function getBudgetAllocations(
  tripRequestId: string
): Promise<ExtendedBudgetAllocation | null> {
  const allocations = await prisma.budgetAllocation.findMany({
    where: { tripRequestId },
  });

  if (allocations.length === 0) {
    return null;
  }

  const result: ExtendedBudgetAllocation = {
    flight: 0,
    hotel: 0,
    activity: 0,
    food: 0,
    transport: 0,
    contingency: 0,
  };

  allocations.forEach((allocation) => {
    const category = allocation.category.toLowerCase() as keyof ExtendedBudgetAllocation;
    result[category] = allocation.allocated;
  });

  return result;
}
