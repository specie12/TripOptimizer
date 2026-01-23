'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/formatters';

// =============================================================================
// TYPES
// =============================================================================

interface CategoryBudget {
  category: string;
  allocated: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'EXCEEDED';
}

interface TripBudgetBreakdown {
  tripRequestId: string;
  totalBudget: number;
  totalAllocated: number;
  totalSpent: number;
  totalRemaining: number;
  percentageUsed: number;
  categories: CategoryBudget[];
}

interface BudgetAlert {
  category: string;
  alertType: string;
  message: string;
  percentageUsed: number;
}

interface BudgetTrackerProps {
  tripRequestId: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get color class based on budget status
 */
function getStatusColor(status: string): string {
  switch (status) {
    case 'HEALTHY':
      return 'bg-green-500';
    case 'WARNING':
      return 'bg-yellow-500';
    case 'CRITICAL':
      return 'bg-orange-500';
    case 'EXCEEDED':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

/**
 * Get category icon
 */
function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    FLIGHT: '✈️',
    HOTEL: '🏨',
    ACTIVITY: '🎯',
    FOOD: '🍽️',
    TRANSPORT: '🚗',
    CONTINGENCY: '💰',
  };
  return icons[category] || '📍';
}

/**
 * Format category name for display
 */
function formatCategoryName(category: string): string {
  return category.charAt(0) + category.slice(1).toLowerCase();
}

// =============================================================================
// BUDGET TRACKER COMPONENT
// =============================================================================

export default function BudgetTracker({ tripRequestId }: BudgetTrackerProps) {
  const [breakdown, setBreakdown] = useState<TripBudgetBreakdown | null>(null);
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch budget breakdown and alerts
  useEffect(() => {
    async function fetchBudget() {
      try {
        setLoading(true);
        setError(null);

        // Fetch budget breakdown
        const breakdownResponse = await fetch(
          `http://localhost:3000/budget/breakdown/${tripRequestId}`
        );

        if (!breakdownResponse.ok) {
          throw new Error('Failed to fetch budget breakdown');
        }

        const breakdownData = await breakdownResponse.json();
        setBreakdown(breakdownData);

        // Fetch alerts
        const alertsResponse = await fetch(
          `http://localhost:3000/budget/alerts/${tripRequestId}`
        );

        if (alertsResponse.ok) {
          const alertsData = await alertsResponse.json();
          setAlerts(alertsData.alerts || []);
        }
      } catch (err) {
        console.error('Error fetching budget data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load budget data');
      } finally {
        setLoading(false);
      }
    }

    fetchBudget();
  }, [tripRequestId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-md">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-700 font-medium">Error loading budget data</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!breakdown) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Budget Tracker</h2>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-blue-100 text-sm">Total Allocated</p>
            <p className="text-2xl font-bold">{formatCurrency(breakdown.totalAllocated)}</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm">Remaining</p>
            <p className="text-2xl font-bold">{formatCurrency(breakdown.totalRemaining)}</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-blue-900 rounded-full h-3">
            <div
              className="bg-white rounded-full h-3 transition-all duration-300"
              style={{ width: `${Math.min(breakdown.percentageUsed, 100)}%` }}
            ></div>
          </div>
          <p className="text-blue-100 text-sm mt-2">
            {breakdown.percentageUsed.toFixed(1)}% of total budget used
          </p>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="p-4 bg-yellow-50 border-b border-yellow-100">
          <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
            <span>⚠️</span>
            <span>Budget Alerts ({alerts.length})</span>
          </h3>
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  alert.alertType === 'EXCEEDED'
                    ? 'bg-red-100 text-red-800'
                    : alert.alertType === 'WARNING_90'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                <p className="text-sm font-medium">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      <div className="p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 mb-4">Budget by Category</h3>
        {breakdown.categories.map((category) => (
          <div key={category.category} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{getCategoryIcon(category.category)}</span>
                <span className="font-medium text-gray-900">
                  {formatCategoryName(category.category)}
                </span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  {formatCurrency(category.spent)} / {formatCurrency(category.allocated)}
                </p>
                <p className="text-sm text-gray-500">
                  {formatCurrency(category.remaining)} remaining
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`${getStatusColor(category.status)} rounded-full h-2 transition-all duration-300`}
                style={{ width: `${Math.min(category.percentageUsed, 100)}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">
                {category.percentageUsed.toFixed(1)}% used
              </span>
              <span
                className={`font-medium ${
                  category.status === 'HEALTHY'
                    ? 'text-green-600'
                    : category.status === 'WARNING'
                    ? 'text-yellow-600'
                    : category.status === 'CRITICAL'
                    ? 'text-orange-600'
                    : 'text-red-600'
                }`}
              >
                {category.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 p-4 text-center border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Budget tracked in real-time • Updates automatically
        </p>
      </div>
    </div>
  );
}
