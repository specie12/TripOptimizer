'use client';

/**
 * BudgetBreakdown Component (Phase 1)
 *
 * Displays 6-category budget allocation with visual breakdown
 * Supports both legacy 3-category view and new 6-category view
 */

import { formatCurrency } from '@/lib/formatters';

// Legacy props for backward compatibility
interface LegacyBudgetBreakdownProps {
  flightCost?: number;
  hotelCost?: number;
  remainingBudget?: number;
  totalBudget?: never;
  travelStyle?: never;
}

// New Phase 1 props
interface ExtendedBudgetBreakdownProps {
  totalBudget: number; // Total budget in cents
  travelStyle?: 'BUDGET' | 'BALANCED';
  flightCost?: never;
  hotelCost?: never;
  remainingBudget?: never;
}

type BudgetBreakdownProps = LegacyBudgetBreakdownProps | ExtendedBudgetBreakdownProps;

interface CategoryInfo {
  name: string;
  color: string;
  icon: string;
  percentage: number;
}

export default function BudgetBreakdown(props: BudgetBreakdownProps) {
  // Legacy 3-category view
  if ('flightCost' in props && props.flightCost !== undefined) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-4">Budget breakdown</h4>

        <div className="space-y-3">
          {/* Flight */}
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-gray-400 mr-2">├──</span>
              <span className="text-gray-700">Flight</span>
            </div>
            <span className="font-medium">{formatCurrency(props.flightCost)}</span>
          </div>

          {/* Hotel */}
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-gray-400 mr-2">├──</span>
              <span className="text-gray-700">Hotel</span>
            </div>
            <span className="font-medium">{formatCurrency(props.hotelCost || 0)}</span>
          </div>

          {/* Remaining */}
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-gray-400 mr-2">└──</span>
              <span className="text-green-700 font-medium">Remaining</span>
            </div>
            <span className="font-medium text-green-700">
              {formatCurrency(props.remainingBudget || 0)}
            </span>
          </div>
        </div>

        {/* Explanation */}
        <p className="mt-4 text-sm text-gray-500 italic">
          We keep some of your budget unplanned so you&apos;re not stretched.
        </p>
      </div>
    );
  }

  // New Phase 1: 6-category view
  const { totalBudget, travelStyle = 'BALANCED' } = props as ExtendedBudgetBreakdownProps;

  // Budget allocation percentages based on travel style
  const categories: CategoryInfo[] = travelStyle === 'BUDGET'
    ? [
        { name: 'Flights', color: 'bg-blue-500', icon: '✈️', percentage: 30 },
        { name: 'Accommodation', color: 'bg-purple-500', icon: '🏨', percentage: 38 },
        { name: 'Activities', color: 'bg-green-500', icon: '🎭', percentage: 10 },
        { name: 'Food & Dining', color: 'bg-orange-500', icon: '🍽️', percentage: 8 },
        { name: 'Transportation', color: 'bg-yellow-500', icon: '🚗', percentage: 4 },
        { name: 'Contingency', color: 'bg-gray-500', icon: '💰', percentage: 10 },
      ]
    : [
        { name: 'Flights', color: 'bg-blue-500', icon: '✈️', percentage: 28 },
        { name: 'Accommodation', color: 'bg-purple-500', icon: '🏨', percentage: 35 },
        { name: 'Activities', color: 'bg-green-500', icon: '🎭', percentage: 15 },
        { name: 'Food & Dining', color: 'bg-orange-500', icon: '🍽️', percentage: 12 },
        { name: 'Transportation', color: 'bg-yellow-500', icon: '🚗', percentage: 5 },
        { name: 'Contingency', color: 'bg-gray-500', icon: '💰', percentage: 5 },
      ];

  // Calculate amounts in cents
  const allocations = categories.map((category) => ({
    ...category,
    amount: Math.floor((totalBudget * category.percentage) / 100),
  }));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Breakdown</h3>

      {/* Visual bar chart */}
      <div className="mb-6">
        <div className="flex h-8 rounded-lg overflow-hidden">
          {allocations.map((category, index) => (
            <div
              key={index}
              className={`${category.color} flex items-center justify-center text-white text-xs font-medium`}
              style={{ width: `${category.percentage}%` }}
              title={`${category.name}: ${category.percentage}%`}
            >
              {category.percentage >= 10 && (
                <span className="hidden sm:inline">{category.percentage}%</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Category details */}
      <div className="space-y-3">
        {allocations.map((category, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{category.icon}</span>
              <div>
                <p className="text-sm font-medium text-gray-900">{category.name}</p>
                <p className="text-xs text-gray-500">{category.percentage}% of budget</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">
                {formatCurrency(category.amount)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">Total Budget</p>
        <p className="text-lg font-bold text-gray-900">{formatCurrency(totalBudget)}</p>
      </div>

      {/* Travel style note */}
      <div className="mt-4 bg-gray-50 rounded-lg p-3">
        <p className="text-xs text-gray-600">
          <span className="font-medium">{travelStyle === 'BUDGET' ? 'Budget' : 'Balanced'} Style:</span>{' '}
          {travelStyle === 'BUDGET'
            ? 'Larger buffer for unexpected expenses, focused on essentials.'
            : 'More allocated to experiences and dining, smaller emergency fund.'}
        </p>
      </div>
    </div>
  );
}
