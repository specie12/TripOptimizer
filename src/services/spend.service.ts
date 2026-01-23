/**
 * Spend Tracking Service (Phase 5)
 *
 * Manages spend records, budget tracking, and alerts for trip requests
 */

import { PrismaClient, BudgetCategory } from '@prisma/client';
import {
  RecordSpendRequest,
  RecordSpendResponse,
  TripBudgetBreakdown,
  CategoryBudget,
  BudgetStatus,
  BudgetAlert,
  AlertType,
  TripSpendSummary,
  CategorySpendSummary,
  BudgetValidation,
  ValidateSpendRequest,
} from '../types/spend.types';

const prisma = new PrismaClient();

// =============================================================================
// CONSTANTS
// =============================================================================

const BUDGET_WARNING_THRESHOLD_75 = 0.75; // 75% used
const BUDGET_WARNING_THRESHOLD_90 = 0.90; // 90% used

// =============================================================================
// SPEND RECORDING
// =============================================================================

/**
 * Record a spend for a trip request
 */
export async function recordSpend(request: RecordSpendRequest): Promise<RecordSpendResponse> {
  try {
    // Validate trip request exists
    const tripRequest = await prisma.tripRequest.findUnique({
      where: { id: request.tripRequestId },
      include: { budgetAllocations: true },
    });

    if (!tripRequest) {
      return {
        success: false,
        error: 'Trip request not found',
      };
    }

    // Get budget allocation for this category
    const budgetAllocation = tripRequest.budgetAllocations.find(
      (alloc) => alloc.category === request.category
    );

    if (!budgetAllocation) {
      return {
        success: false,
        error: `No budget allocation found for category ${request.category}`,
      };
    }

    // Create spend record
    const spendRecord = await prisma.spendRecord.create({
      data: {
        tripRequestId: request.tripRequestId,
        category: request.category,
        amount: request.amount,
        description: request.description || 'No description',
      },
    });

    // Update budget allocation spent amount
    await prisma.budgetAllocation.update({
      where: { id: budgetAllocation.id },
      data: {
        spent: budgetAllocation.spent + request.amount,
      },
    });

    // Check for budget warnings
    const updatedBudgetAllocation = await prisma.budgetAllocation.findUnique({
      where: { id: budgetAllocation.id },
    });

    if (!updatedBudgetAllocation) {
      return {
        success: true,
        spendRecord: {
          id: spendRecord.id,
          tripRequestId: spendRecord.tripRequestId,
          category: spendRecord.category,
          amount: spendRecord.amount,
          description: spendRecord.description,
          recordedAt: spendRecord.recordedAt,
          createdAt: spendRecord.createdAt,
        },
      };
    }

    const percentageUsed =
      updatedBudgetAllocation.allocated > 0
        ? updatedBudgetAllocation.spent / updatedBudgetAllocation.allocated
        : 0;

    let warning: string | undefined;

    if (percentageUsed > 1.0) {
      warning = `WARNING: ${request.category} budget exceeded! Spent $${(updatedBudgetAllocation.spent / 100).toFixed(2)} of $${(updatedBudgetAllocation.allocated / 100).toFixed(2)} allocated.`;
    } else if (percentageUsed >= BUDGET_WARNING_THRESHOLD_90) {
      warning = `ALERT: ${request.category} budget at ${(percentageUsed * 100).toFixed(0)}% (${AlertType.WARNING_90})`;
    } else if (percentageUsed >= BUDGET_WARNING_THRESHOLD_75) {
      warning = `WARNING: ${request.category} budget at ${(percentageUsed * 100).toFixed(0)}% (${AlertType.WARNING_75})`;
    }

    return {
      success: true,
      spendRecord: {
        id: spendRecord.id,
        tripRequestId: spendRecord.tripRequestId,
        category: spendRecord.category,
        amount: spendRecord.amount,
        description: spendRecord.description,
        recordedAt: spendRecord.recordedAt,
        createdAt: spendRecord.createdAt,
      },
      warning,
    };
  } catch (error) {
    console.error('Error recording spend:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// BUDGET TRACKING
// =============================================================================

/**
 * Get complete budget breakdown for a trip
 */
export async function getTripBudgetBreakdown(tripRequestId: string): Promise<TripBudgetBreakdown | null> {
  try {
    const tripRequest = await prisma.tripRequest.findUnique({
      where: { id: tripRequestId },
      include: { budgetAllocations: true },
    });

    if (!tripRequest) {
      return null;
    }

    const categories: CategoryBudget[] = tripRequest.budgetAllocations.map((allocation) => {
      const remaining = allocation.allocated - allocation.spent;
      const percentageUsed =
        allocation.allocated > 0 ? (allocation.spent / allocation.allocated) * 100 : 0;

      let status: BudgetStatus;
      if (percentageUsed > 100) {
        status = BudgetStatus.EXCEEDED;
      } else if (percentageUsed >= 90) {
        status = BudgetStatus.CRITICAL;
      } else if (percentageUsed >= 75) {
        status = BudgetStatus.WARNING;
      } else {
        status = BudgetStatus.HEALTHY;
      }

      return {
        category: allocation.category,
        allocated: allocation.allocated,
        spent: allocation.spent,
        remaining,
        percentageUsed,
        status,
      };
    });

    const totalAllocated = tripRequest.budgetAllocations.reduce(
      (sum, alloc) => sum + alloc.allocated,
      0
    );
    const totalSpent = tripRequest.budgetAllocations.reduce((sum, alloc) => sum + alloc.spent, 0);
    const totalRemaining = totalAllocated - totalSpent;
    const percentageUsed = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

    return {
      tripRequestId,
      totalBudget: tripRequest.budgetTotal,
      totalAllocated,
      totalSpent,
      totalRemaining,
      percentageUsed,
      categories,
      createdAt: tripRequest.createdAt,
      updatedAt: tripRequest.budgetAllocations[0]?.updatedAt || tripRequest.createdAt,
    };
  } catch (error) {
    console.error('Error getting budget breakdown:', error);
    return null;
  }
}

/**
 * Get budget alerts for a trip
 */
export async function getBudgetAlerts(tripRequestId: string): Promise<BudgetAlert[]> {
  try {
    const breakdown = await getTripBudgetBreakdown(tripRequestId);

    if (!breakdown) {
      return [];
    }

    const alerts: BudgetAlert[] = [];

    for (const category of breakdown.categories) {
      const percentageDecimal = category.percentageUsed / 100;

      if (percentageDecimal > 1.0) {
        alerts.push({
          tripRequestId,
          category: category.category,
          alertType: AlertType.EXCEEDED,
          message: `${category.category} budget exceeded by $${((category.spent - category.allocated) / 100).toFixed(2)}`,
          currentSpend: category.spent,
          budgetLimit: category.allocated,
          percentageUsed: category.percentageUsed,
          createdAt: new Date(),
        });
      } else if (percentageDecimal >= BUDGET_WARNING_THRESHOLD_90) {
        alerts.push({
          tripRequestId,
          category: category.category,
          alertType: AlertType.WARNING_90,
          message: `${category.category} budget at ${category.percentageUsed.toFixed(0)}% (Critical)`,
          currentSpend: category.spent,
          budgetLimit: category.allocated,
          percentageUsed: category.percentageUsed,
          createdAt: new Date(),
        });
      } else if (percentageDecimal >= BUDGET_WARNING_THRESHOLD_75) {
        alerts.push({
          tripRequestId,
          category: category.category,
          alertType: AlertType.WARNING_75,
          message: `${category.category} budget at ${category.percentageUsed.toFixed(0)}% (Warning)`,
          currentSpend: category.spent,
          budgetLimit: category.allocated,
          percentageUsed: category.percentageUsed,
          createdAt: new Date(),
        });
      }
    }

    return alerts;
  } catch (error) {
    console.error('Error getting budget alerts:', error);
    return [];
  }
}

// =============================================================================
// SPEND SUMMARY
// =============================================================================

/**
 * Get spend summary for a trip
 */
export async function getTripSpendSummary(tripRequestId: string): Promise<TripSpendSummary | null> {
  try {
    const spendRecords = await prisma.spendRecord.findMany({
      where: { tripRequestId },
      orderBy: { recordedAt: 'desc' },
    });

    if (spendRecords.length === 0) {
      return {
        tripRequestId,
        totalSpent: 0,
        categoryBreakdown: [],
        spendRecords: [],
        createdAt: new Date(),
      };
    }

    // Group by category
    const categoryMap = new Map<BudgetCategory, CategorySpendSummary>();

    for (const record of spendRecords) {
      const existing = categoryMap.get(record.category);

      if (existing) {
        existing.totalSpent += record.amount;
        existing.numberOfRecords += 1;
        if (!existing.lastSpendDate || record.recordedAt > existing.lastSpendDate) {
          existing.lastSpendDate = record.recordedAt;
        }
      } else {
        categoryMap.set(record.category, {
          category: record.category,
          totalSpent: record.amount,
          numberOfRecords: 1,
          averageSpend: record.amount,
          lastSpendDate: record.recordedAt,
        });
      }
    }

    // Calculate averages
    const categoryBreakdown: CategorySpendSummary[] = Array.from(categoryMap.values()).map(
      (summary) => ({
        ...summary,
        averageSpend: summary.totalSpent / summary.numberOfRecords,
      })
    );

    const totalSpent = spendRecords.reduce((sum, record) => sum + record.amount, 0);

    return {
      tripRequestId,
      totalSpent,
      categoryBreakdown,
      spendRecords: spendRecords.map((record) => ({
        id: record.id,
        tripRequestId: record.tripRequestId,
        category: record.category,
        amount: record.amount,
        description: record.description,
        recordedAt: record.recordedAt,
        createdAt: record.createdAt,
      })),
      createdAt: spendRecords[0].createdAt,
    };
  } catch (error) {
    console.error('Error getting spend summary:', error);
    return null;
  }
}

// =============================================================================
// BUDGET VALIDATION
// =============================================================================

/**
 * Validate a potential spend before recording it
 */
export async function validateSpend(request: ValidateSpendRequest): Promise<BudgetValidation> {
  try {
    const breakdown = await getTripBudgetBreakdown(request.tripRequestId);

    if (!breakdown) {
      return {
        isValid: false,
        canAfford: false,
        exceedsCategory: false,
        exceedsTotal: false,
        warnings: [],
        errors: ['Trip request not found'],
      };
    }

    const category = breakdown.categories.find((c) => c.category === request.category);

    if (!category) {
      return {
        isValid: false,
        canAfford: false,
        exceedsCategory: false,
        exceedsTotal: false,
        warnings: [],
        errors: [`No budget allocation for category ${request.category}`],
      };
    }

    const warnings: string[] = [];
    const errors: string[] = [];
    let canAfford = true;
    let exceedsCategory = false;
    let exceedsTotal = false;

    // Check category budget
    const newCategorySpent = category.spent + request.amount;
    if (newCategorySpent > category.allocated) {
      exceedsCategory = true;
      canAfford = false;
      errors.push(
        `Exceeds ${request.category} budget by $${((newCategorySpent - category.allocated) / 100).toFixed(2)}`
      );
    } else {
      const newPercentage = (newCategorySpent / category.allocated) * 100;
      if (newPercentage >= 90) {
        warnings.push(`Will reach ${newPercentage.toFixed(0)}% of ${request.category} budget`);
      }
    }

    // Check total budget
    const newTotalSpent = breakdown.totalSpent + request.amount;
    if (newTotalSpent > breakdown.totalBudget) {
      exceedsTotal = true;
      canAfford = false;
      errors.push(
        `Exceeds total budget by $${((newTotalSpent - breakdown.totalBudget) / 100).toFixed(2)}`
      );
    }

    return {
      isValid: canAfford && errors.length === 0,
      canAfford,
      exceedsCategory,
      exceedsTotal,
      suggestedAmount: exceedsCategory ? category.remaining : undefined,
      warnings,
      errors,
    };
  } catch (error) {
    console.error('Error validating spend:', error);
    return {
      isValid: false,
      canAfford: false,
      exceedsCategory: false,
      exceedsTotal: false,
      warnings: [],
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Initialize budget allocations for a trip request
 */
export async function initializeBudgetAllocations(
  tripRequestId: string,
  allocations: Record<BudgetCategory, number>
): Promise<void> {
  try {
    // Create budget allocation records
    const budgetAllocations = Object.entries(allocations).map(([category, amount]) => ({
      tripRequestId,
      category: category as BudgetCategory,
      allocated: amount,
      spent: 0,
    }));

    await prisma.budgetAllocation.createMany({
      data: budgetAllocations,
      skipDuplicates: true,
    });

    console.log(`Initialized ${budgetAllocations.length} budget allocations for trip ${tripRequestId}`);
  } catch (error) {
    console.error('Error initializing budget allocations:', error);
    throw error;
  }
}
