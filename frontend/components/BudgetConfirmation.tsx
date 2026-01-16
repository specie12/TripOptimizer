'use client';

import { useRouter } from 'next/navigation';
import { formatCurrency, formatDays, formatTravelStyle, dollarsToCents } from '@/lib/formatters';
import BudgetBreakdown from './BudgetBreakdown';

interface BudgetConfirmationProps {
  originCity: string;
  destination?: string;
  startDate?: string;
  numberOfDays: number;
  budgetTotal: number; // In dollars
  travelStyle: 'BUDGET' | 'BALANCED';
}

export default function BudgetConfirmation({
  originCity,
  destination,
  startDate,
  numberOfDays,
  budgetTotal,
  travelStyle,
}: BudgetConfirmationProps) {
  const router = useRouter();

  // Format the date for display
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleFindTrips = async () => {
    // Navigate to results with the same params
    const params = new URLSearchParams({
      originCity,
      days: numberOfDays.toString(),
      budget: budgetTotal.toString(),
      style: travelStyle,
    });

    // Add optional fields if provided
    if (destination) {
      params.set('destination', destination);
    }
    if (startDate) {
      params.set('startDate', startDate);
    }

    router.push(`/results?${params.toString()}`);
  };

  return (
    <div className="max-w-md mx-auto text-center">
      {/* Summary Box */}
      <div className="bg-gray-50 rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your trip</h2>

        <div className="space-y-3 text-left">
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-gray-600">From</span>
            <span className="font-semibold">{originCity}</span>
          </div>

          {destination && (
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-600">To</span>
              <span className="font-semibold">{destination}</span>
            </div>
          )}

          {startDate && (
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-600">Departure</span>
              <span className="font-semibold">{formatDate(startDate)}</span>
            </div>
          )}

          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-gray-600">Duration</span>
            <span className="font-semibold">{formatDays(numberOfDays)}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-gray-600">Budget</span>
            <span className="font-semibold text-green-600">
              {formatCurrency(dollarsToCents(budgetTotal))}
            </span>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="text-gray-600">Style</span>
            <span className="font-semibold">{formatTravelStyle(travelStyle)}</span>
          </div>
        </div>
      </div>

      {/* Budget Breakdown (Phase 1) */}
      <div className="mb-8">
        <BudgetBreakdown
          totalBudget={dollarsToCents(budgetTotal)}
          travelStyle={travelStyle}
        />
      </div>

      {/* Explanatory Copy */}
      <div className="mb-8 text-left">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Here&apos;s how we&apos;ll plan your trip:
        </h3>
        <ul className="space-y-3">
          <li className="flex items-start">
            <span className="text-green-500 mr-3 mt-0.5">&#8226;</span>
            <span className="text-gray-700">Budget allocated across 6 categories</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-3 mt-0.5">&#8226;</span>
            <span className="text-gray-700">Find the best value within each budget</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-3 mt-0.5">&#8226;</span>
            <span className="text-gray-700">
              Contingency fund for unexpected expenses
            </span>
          </li>
        </ul>
      </div>

      {/* CTA Button - EXACT wording from spec */}
      <button
        onClick={handleFindTrips}
        className="w-full py-4 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-lg"
      >
        Find trips that fit my budget
      </button>

      {/* Back Link */}
      <a
        href={`/?originCity=${encodeURIComponent(originCity)}${destination ? `&destination=${encodeURIComponent(destination)}` : ''}${startDate ? `&startDate=${startDate}` : ''}&days=${numberOfDays}&budget=${budgetTotal}&style=${travelStyle}`}
        className="mt-4 text-gray-500 hover:text-gray-700 text-sm inline-block"
      >
        &#8592; Change trip details
      </a>
    </div>
  );
}
