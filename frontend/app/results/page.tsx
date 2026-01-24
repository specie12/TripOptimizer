'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { generateTrip } from '@/lib/api';
import { TripOptionResponse } from '@/lib/types';
import { formatCurrency, dollarsToCents } from '@/lib/formatters';
import { trackTripView } from '@/lib/tracking';
import TripCard from '@/components/TripCard';
import ProPlanningUpsell from '@/components/monetization/ProPlanningUpsell';

/**
 * Build Edit URL with all search parameters
 */
function buildEditUrl(params: {
  originCity: string;
  destination?: string;
  startDate?: string;
  days: number;
  budgetDollars: number;
  style: string;
  pace?: string | null;
  accommodation?: string | null;
  interests?: string | null;
}): string {
  const searchParams = new URLSearchParams({
    originCity: params.originCity,
    days: params.days.toString(),
    budget: params.budgetDollars.toString(),
    style: params.style,
  });

  if (params.destination) searchParams.set('destination', params.destination);
  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.pace) searchParams.set('pace', params.pace);
  if (params.accommodation) searchParams.set('accommodation', params.accommodation);
  if (params.interests) searchParams.set('interests', params.interests);

  return `/?${searchParams.toString()}`;
}

function ResultsContent() {
  const searchParams = useSearchParams();

  const originCity = searchParams.get('originCity') || '';
  const destination = searchParams.get('destination') || '';
  const startDate = searchParams.get('startDate') || '';
  const days = parseInt(searchParams.get('days') || '5');
  const budgetDollars = parseInt(searchParams.get('budget') || '2000');
  const style = (searchParams.get('style') as 'BUDGET' | 'BALANCED') || 'BALANCED';
  const pace = searchParams.get('pace');
  const accommodation = searchParams.get('accommodation');
  const interests = searchParams.get('interests');

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
          destination: destination || undefined,
          startDate: startDate || undefined,
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
  }, [originCity, destination, startDate, days, budgetCents, style]);

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
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {destination
              ? `Trips from ${originCity} to ${destination}`
              : `Trips from ${originCity}`}
          </h1>
          <p className="text-gray-600">
            {days} days &middot; {formatCurrency(budgetCents)} budget
            {startDate && ` &middot; Departing ${new Date(startDate + 'T00:00:00').toLocaleDateString()}`}
          </p>
        </div>

        {/* Edit Search Button */}
        <a
          href={buildEditUrl({
            originCity,
            destination,
            startDate,
            days,
            budgetDollars,
            style,
            pace,
            accommodation,
            interests,
          })}
          className="flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg text-sm md:text-base whitespace-nowrap"
        >
          <span className="hidden md:inline">✏️</span>
          <span className="md:hidden">Edit</span>
          <span className="hidden md:inline">Edit Search</span>
        </a>
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
          href="/"
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          &#8592; Start a new search
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
