'use client';

/**
 * WhatIsIncluded - Phase 11
 *
 * Displays what's included in the trip package:
 * - Round-trip flights
 * - Accommodation
 * - Activities & Tours
 * - Local Transportation
 *
 * Bottom CTA for booking
 */

import Link from 'next/link';
import { TripOptionResponse } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';

interface WhatIsIncludedProps {
  tripOption: TripOptionResponse;
  numberOfDays: number;
}

export default function WhatIsIncluded({
  tripOption,
  numberOfDays,
}: WhatIsIncludedProps) {
  const flightCost = tripOption.flight.price;
  const hotelCost = tripOption.hotel.priceTotal;
  const pricedActivities = tripOption.activities?.filter(a => a.price) || [];
  const activitiesCost = pricedActivities.reduce((sum, a) => sum + a.price!, 0);
  const activityCount = tripOption.activities?.length || 0;

  // Use backend-computed budget allocation for transport
  const estimatedTransport = tripOption.transportBudget ?? 0;
  const transportEstimate = tripOption.transportEstimate;
  const transportDestSlug = encodeURIComponent(tripOption.destination.toLowerCase());

  const inclusions = [
    {
      title: 'Round-trip Flights',
      icon: '✈️',
      color: 'bg-blue-100 text-blue-800',
      details: `Economy class • ${tripOption.flight.provider}`,
      price: flightCost,
      isTransport: false,
    },
    {
      title: 'Accommodation',
      icon: '🏨',
      color: 'bg-purple-100 text-purple-800',
      details: `${numberOfDays} nights • ${tripOption.hotel.name}`,
      price: hotelCost,
      isTransport: false,
    },
    {
      title: 'Activities & Tours',
      icon: '🎭',
      color: 'bg-green-100 text-green-800',
      details: pricedActivities.length === activityCount
        ? `${activityCount} experiences included`
        : `${activityCount} experiences (${pricedActivities.length} priced)`,
      price: activitiesCost,
      isTransport: false,
    },
    {
      title: 'Local Transportation',
      icon: '🚗',
      color: 'bg-yellow-100 text-yellow-800',
      details: transportEstimate
        ? (transportEstimate.isEstimate ? 'Estimated transit costs' : 'City transit passes & transfers')
        : 'Metro & bus passes',
      price: estimatedTransport,
      isTransport: true,
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span>📦</span>
        <span>What&apos;s Included</span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {inclusions.map((item, index) => {
          const content = (
            <>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{item.icon}</span>
                  <div>
                    <h4 className="font-semibold text-base">{item.title}</h4>
                    <p className="text-sm opacity-80">{item.details}</p>
                  </div>
                </div>
              </div>
              <p className={`text-right font-bold text-lg mt-2 ${item.isTransport && transportEstimate ? 'underline' : ''}`}>
                {item.isTransport && transportEstimate
                  ? `${formatCurrency(transportEstimate.costRangeLow)}–${formatCurrency(transportEstimate.costRangeHigh)}`
                  : formatCurrency(item.price)}
              </p>
            </>
          );

          if (item.isTransport) {
            return (
              <Link
                key={index}
                href={`/transport/${transportDestSlug}?budget=${estimatedTransport}`}
                className={`${item.color} rounded-xl p-5 hover:opacity-90 transition-opacity block`}
              >
                {content}
              </Link>
            );
          }

          return (
            <div key={index} className={`${item.color} rounded-xl p-5`}>
              {content}
            </div>
          );
        })}
      </div>

      {/* Ready to Book Section */}
      <div className="border-t border-gray-200 pt-6">
        <div className="text-center mb-4">
          <p className="text-gray-600 mb-2">Ready to book?</p>
          <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {formatCurrency(tripOption.totalCost)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Total for everything</p>
        </div>

        <button
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg mb-3"
          onClick={() => {
            // Scroll to booking buttons
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          Book This Trip ✨
        </button>

        <p className="text-center text-xs text-gray-500">
          One-click booking • All components included
        </p>
      </div>
    </div>
  );
}
