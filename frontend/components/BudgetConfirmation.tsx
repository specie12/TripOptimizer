'use client';

import { useRouter } from 'next/navigation';
import { formatCurrency, formatDays, formatTravelStyle } from '@/lib/formatters';
import { dollarsToCents } from '@/lib/formatters';

interface BudgetConfirmationProps {
  originCity: string;
  numberOfDays: number;
  budgetTotal: number; // In dollars
  travelStyle: 'BUDGET' | 'BALANCED';
}

export default function BudgetConfirmation({
  originCity,
  numberOfDays,
  budgetTotal,
  travelStyle,
}: BudgetConfirmationProps) {
  const router = useRouter();

  const handleFindTrips = async () => {
    // Navigate to results with the same params
    const params = new URLSearchParams({
      originCity,
      days: numberOfDays.toString(),
      budget: budgetTotal.toString(),
      style: travelStyle,
    });

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

      {/* Explanatory Copy - EXACT wording from spec */}
      <div className="mb-8 text-left">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Here&apos;s how we&apos;ll plan your trip:
        </h3>
        <ul className="space-y-3">
          <li className="flex items-start">
            <span className="text-green-500 mr-3 mt-0.5">&#8226;</span>
            <span className="text-gray-700">Prioritize affordable flights</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-3 mt-0.5">&#8226;</span>
            <span className="text-gray-700">Choose well-rated value hotels</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-3 mt-0.5">&#8226;</span>
            <span className="text-gray-700">
              Leave some budget unplanned for flexibility
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
      <button
        onClick={() => router.back()}
        className="mt-4 text-gray-500 hover:text-gray-700 text-sm"
      >
        &#8592; Change trip details
      </button>
    </div>
  );
}
