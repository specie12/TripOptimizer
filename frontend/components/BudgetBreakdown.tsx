'use client';

import { formatCurrency } from '@/lib/formatters';

interface BudgetBreakdownProps {
  flightCost: number; // In cents
  hotelCost: number; // In cents
  remainingBudget: number; // In cents
}

export default function BudgetBreakdown({
  flightCost,
  hotelCost,
  remainingBudget,
}: BudgetBreakdownProps) {
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
          <span className="font-medium">{formatCurrency(flightCost)}</span>
        </div>

        {/* Hotel */}
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-gray-400 mr-2">├──</span>
            <span className="text-gray-700">Hotel</span>
          </div>
          <span className="font-medium">{formatCurrency(hotelCost)}</span>
        </div>

        {/* Remaining */}
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-gray-400 mr-2">└──</span>
            <span className="text-green-700 font-medium">Remaining</span>
          </div>
          <span className="font-medium text-green-700">
            {formatCurrency(remainingBudget)}
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
