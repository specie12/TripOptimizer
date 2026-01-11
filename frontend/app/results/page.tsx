'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { generateTrip } from '@/lib/api';
import { TripOptionResponse } from '@/lib/types';
import { formatCurrency, dollarsToCents } from '@/lib/formatters';
import { trackTripView } from '@/lib/tracking';
import TripCard from '@/components/TripCard';
import ProPlanningUpsell from '@/components/monetization/ProPlanningUpsell';

function ResultsContent() {
  const searchParams = useSearchParams();

  const originCity = searchParams.get('originCity') || '';
  const days = parseInt(searchParams.get('days') || '5');
  const budgetDollars = parseInt(searchParams.get('budget') || '2000');
  const style = (searchParams.get('style') as 'BUDGET' | 'BALANCED') || 'BALANCED';

  const budgetCents = dollarsToCents(budgetDollars);

  const [tripOptions, setTripOptions] = useState<TripOptionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrips() {
      if (!originCity) {
        setError('Missing origin city');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await generateTrip({
          originCity,
          numberOfDays: days,
          budgetTotal: budgetCents,
          travelStyle: style,
        });

        setTripOptions(response.options);

        // Track views for each trip option
        response.options.forEach((option) => {
          trackTripView(option.id, option.destination);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load trips');
      } finally {
        setLoading(false);
      }
    }

    fetchTrips();
  }, [originCity, days, budgetCents, style]);

  if (!originCity) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Missing trip details.</p>
        <a href="/" className="text-blue-600 hover:underline mt-2 inline-block">
          Start over
        </a>
      </div>
    );
  }

  return (
    <div className="py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Trips from {originCity}
        </h1>
        <p className="text-gray-600">
          {days} days &middot; {formatCurrency(budgetCents)} budget
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Finding trips that fit your budget...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-blue-600 hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Trip Options */}
      {!loading && !error && tripOptions.length > 0 && (
        <>
          <div className="space-y-6">
            {tripOptions.map((option) => (
              <TripCard
                key={option.id}
                tripOption={option}
                budgetTotal={budgetCents}
              />
            ))}
          </div>

          {/* Pro Planning Upsell - AFTER results are shown */}
          <div className="mt-8">
            <ProPlanningUpsell source="results_page" />
          </div>
        </>
      )}

      {/* No Results */}
      {!loading && !error && tripOptions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">
            No trips found within your budget. Try increasing your budget or
            adjusting your dates.
          </p>
          <a href="/" className="text-blue-600 hover:underline">
            Adjust your search
          </a>
        </div>
      )}

      {/* Back Link */}
      <div className="mt-8 text-center">
        <a
          href={`/confirm?originCity=${encodeURIComponent(originCity)}&days=${days}&budget=${budgetDollars}&style=${style}`}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          &#8592; Back to confirmation
        </a>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
