'use client';

import { useState } from 'react';
import { TripOptionResponse } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';
import { trackExpandExplanation, trackViewDetails } from '@/lib/tracking';
import WhyThisWorks from './WhyThisWorks';
import TripDetails from './TripDetails';

interface TripCardProps {
  tripOption: TripOptionResponse;
  budgetTotal: number; // In cents
}

export default function TripCard({ tripOption, budgetTotal }: TripCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [explanationExpanded, setExplanationExpanded] = useState(false);

  const handleExpandExplanation = () => {
    if (!explanationExpanded) {
      trackExpandExplanation(tripOption.id, tripOption.destination);
    }
    setExplanationExpanded(!explanationExpanded);
  };

  const handleViewDetails = () => {
    if (!showDetails) {
      trackViewDetails(tripOption.id, tripOption.destination);
    }
    setShowDetails(!showDetails);
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
      {/* Top Section - Destination & Budget Summary */}
      <div className="p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {tripOption.destination}
        </h3>

        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-3xl font-bold text-gray-900">
            {formatCurrency(tripOption.totalCost)}
          </span>
          <span className="text-gray-500">total</span>
        </div>

        {/* Remaining Budget - Highlighted */}
        <div className="inline-flex items-center bg-green-50 text-green-700 px-4 py-2 rounded-lg">
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="font-semibold">
            You still have {formatCurrency(tripOption.remainingBudget)} left
          </span>
        </div>
      </div>

      {/* Middle Section - Why This Works */}
      <div className="px-6 pb-4">
        <button
          onClick={handleExpandExplanation}
          className="flex items-center justify-between w-full text-left py-3 border-t border-gray-100"
        >
          <span className="font-semibold text-gray-900">
            Why this works for your budget
          </span>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${
              explanationExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {explanationExpanded && (
          <WhyThisWorks explanation={tripOption.explanation} />
        )}
      </div>

      {/* Bottom Section - Actions */}
      <div className="px-6 pb-6">
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={handleViewDetails}
            className="flex-1 min-w-[140px] py-3 px-4 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
          >
            {showDetails ? 'Hide details' : 'View trip details'}
          </button>

          <a
            href={tripOption.flight.deepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-[140px] py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-center"
            onClick={() =>
              import('@/lib/tracking').then(({ trackBookFlightClick }) =>
                trackBookFlightClick(
                  tripOption.id,
                  tripOption.destination,
                  tripOption.flight.provider
                )
              )
            }
          >
            Book flight
          </a>

          <a
            href={tripOption.hotel.deepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-[140px] py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-center"
            onClick={() =>
              import('@/lib/tracking').then(({ trackBookHotelClick }) =>
                trackBookHotelClick(
                  tripOption.id,
                  tripOption.destination,
                  tripOption.hotel.name
                )
              )
            }
          >
            Book hotel
          </a>
        </div>

        {/* Reassurance Copy */}
        <p className="text-sm text-gray-500 text-center">
          Nothing is booked yet.
        </p>
      </div>

      {/* Expandable Trip Details */}
      {showDetails && (
        <div className="border-t border-gray-100">
          <TripDetails tripOption={tripOption} budgetTotal={budgetTotal} />
        </div>
      )}
    </div>
  );
}
