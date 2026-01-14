'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import TripInputForm from '@/components/TripInputForm';

function HomeContent() {
  const searchParams = useSearchParams();

  // Read initial values from URL params (for "Change trip details" flow)
  const initialValues = {
    originCity: searchParams.get('originCity') || '',
    destination: searchParams.get('destination') || '',
    startDate: searchParams.get('startDate') || '',
    numberOfDays: parseInt(searchParams.get('days') || '') || 5,
    budgetTotal: parseInt(searchParams.get('budget') || '') || 2000,
    travelStyle: (searchParams.get('style') as 'BUDGET' | 'BALANCED') || 'BALANCED',
  };

  // Only pass initial values if originCity is present (indicates coming from confirm page)
  const hasInitialValues = searchParams.get('originCity');

  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Plan your next trip
        </h1>
        <p className="text-gray-600 max-w-md mx-auto">
          Tell us where you&apos;re coming from, your budget, and we&apos;ll
          find destinations that work for you.
        </p>
      </div>

      <TripInputForm initialValues={hasInitialValues ? initialValues : undefined} />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Plan your next trip
            </h1>
            <p className="text-gray-600 max-w-md mx-auto">Loading...</p>
          </div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
