/**
 * Budget Service
 *
 * Handles budget configuration retrieval and deterministic budget allocation.
 * All budget calculations are pure math - no AI involvement.
 */

import { PrismaClient, TravelStyle, BudgetConfig } from '@prisma/client';
import { BudgetAllocation } from '../types/api.types';

const prisma = new PrismaClient();

/**
 * Get budget configuration for a travel style
 *
 * @param travelStyle - BUDGET or BALANCED
 * @returns BudgetConfig from database
 * @throws Error if config not found
 */
export async function getBudgetConfig(
  travelStyle: TravelStyle
): Promise<BudgetConfig> {
  const config = await prisma.budgetConfig.findUnique({
    where: { travelStyle },
  });

  if (!config) {
    throw new Error(`BudgetConfig not found for travelStyle: ${travelStyle}`);
  }

  return config;
}

/**
 * Allocate budget according to configuration percentages
 *
 * This is a pure, deterministic calculation:
 * - flightBudget = budgetTotal * flightPct
 * - hotelBudget = budgetTotal * hotelPct
 * - buffer = budgetTotal * bufferPct
 * - activities = remaining after flight + hotel + buffer
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
  const bufferAmount = Math.floor(budgetTotal * config.bufferPct);

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
