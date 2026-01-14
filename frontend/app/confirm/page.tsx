'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import BudgetConfirmation from '@/components/BudgetConfirmation';

function ConfirmContent() {
  const searchParams = useSearchParams();

  const originCity = searchParams.get('originCity') || '';
  const destination = searchParams.get('destination') || '';
  const startDate = searchParams.get('startDate') || '';
  const days = parseInt(searchParams.get('days') || '5');
  const budget = parseInt(searchParams.get('budget') || '2000');
  const style = (searchParams.get('style') as 'BUDGET' | 'BALANCED') || 'BALANCED';

  // Redirect if no origin city
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
      <BudgetConfirmation
        originCity={originCity}
        destination={destination}
        startDate={startDate}
        numberOfDays={days}
        budgetTotal={budget}
        travelStyle={style}
      />
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-12">
          <p className="text-gray-600">Loading...</p>
        </div>
      }
    >
      <ConfirmContent />
    </Suspense>
  );
}
