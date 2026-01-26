'use client';

/**
 * BudgetImpactDisplay - Phase 5: Component Swap Flow
 *
 * Displays budget breakdown and spending for a trip option
 * Features:
 * - Real-time budget tracking
 * - Category breakdown
 * - Visual progress bars
 */

import { useEffect, useState } from 'react';
import { getBudgetBreakdown, BudgetBreakdownResponse } from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';

interface BudgetImpactDisplayProps {
  tripOptionId: string;
}

export default function BudgetImpactDisplay({ tripOptionId }: BudgetImpactDisplayProps) {
  const [budgetData, setBudgetData] = useState<BudgetBreakdownResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBudget();
  }, [tripOptionId]);

  const loadBudget = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getBudgetBreakdown(tripOptionId);
      setBudgetData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load budget');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-gray-200">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-300 rounded w-1/3"></div>
          <div className="h-6 bg-gray-300 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error || !budgetData) {
    return (
      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
        <p className="text-red-800 text-sm">{error || 'Failed to load budget'}</p>
      </div>
    );
  }

  const { budget } = budgetData;
  const percentageUsed = budget.percentageUsed;

  // Category icons and colors
  const categoryInfo: Record<string, { icon: string; color: string; name: string }> = {
    FLIGHT: { icon: '✈️', color: 'bg-blue-500', name: 'Flight' },
    HOTEL: { icon: '🏨', color: 'bg-purple-500', name: 'Hotel' },
    ACTIVITY: { icon: '🎭', color: 'bg-green-500', name: 'Activities' },
    FOOD: { icon: '🍽️', color: 'bg-orange-500', name: 'Food' },
    TRANSPORT: { icon: '🚗', color: 'bg-yellow-500', name: 'Transport' },
    CONTINGENCY: { icon: '💰', color: 'bg-pink-500', name: 'Contingency' },
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <span>💵</span>
          <span>Budget Overview</span>
        </h3>
        <button
          onClick={loadBudget}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-sm font-medium text-gray-700">Total Spent</span>
          <div className="text-right">
            <span className="text-2xl font-bold text-gray-900">
              {formatCurrency(budget.spent.total)}
            </span>
            <span className="text-sm text-gray-600 ml-1">
              of {formatCurrency(budget.total)}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              percentageUsed > 90
                ? 'bg-red-500'
                : percentageUsed > 75
                ? 'bg-yellow-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(percentageUsed, 100)}%` }}
          ></div>
        </div>

        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-gray-600">{percentageUsed.toFixed(1)}% used</span>
          <span
            className={`text-sm font-semibold ${
              budget.remaining < 0 ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {formatCurrency(budget.remaining)} remaining
          </span>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900 text-sm mb-2">Spending by Category</h4>

        {/* Flight */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">{categoryInfo.FLIGHT.icon}</span>
              <span className="font-medium text-gray-900 text-sm">{categoryInfo.FLIGHT.name}</span>
            </div>
            <span className="font-bold text-gray-900 text-sm">{formatCurrency(budget.spent.flight)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Budget: {formatCurrency(budget.allocated.FLIGHT)}</span>
            <span>
              {((budget.spent.flight / budget.allocated.FLIGHT) * 100).toFixed(0)}% used
            </span>
          </div>
        </div>

        {/* Hotel */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">{categoryInfo.HOTEL.icon}</span>
              <span className="font-medium text-gray-900 text-sm">{categoryInfo.HOTEL.name}</span>
            </div>
            <span className="font-bold text-gray-900 text-sm">{formatCurrency(budget.spent.hotel)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Budget: {formatCurrency(budget.allocated.HOTEL)}</span>
            <span>
              {((budget.spent.hotel / budget.allocated.HOTEL) * 100).toFixed(0)}% used
            </span>
          </div>
        </div>

        {/* Activities */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">{categoryInfo.ACTIVITY.icon}</span>
              <span className="font-medium text-gray-900 text-sm">{categoryInfo.ACTIVITY.name}</span>
            </div>
            <span className="font-bold text-gray-900 text-sm">{formatCurrency(budget.spent.activities)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Budget: {formatCurrency(budget.allocated.ACTIVITY)}</span>
            <span>
              {((budget.spent.activities / budget.allocated.ACTIVITY) * 100).toFixed(0)}% used
            </span>
          </div>
        </div>
      </div>

      {/* Budget Alert */}
      {percentageUsed > 90 && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>Budget Alert: You've used {percentageUsed.toFixed(0)}% of your budget!</span>
          </p>
        </div>
      )}
    </div>
  );
}
