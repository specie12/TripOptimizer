'use client';

import { TripOptionResponse } from '@/lib/types';
import { formatCurrency, formatDate, formatTime, formatRating } from '@/lib/formatters';
import BudgetBreakdown from './BudgetBreakdown';
import ItineraryPreview from './ItineraryPreview';
import ActivityCard from './ActivityCard';

interface TripDetailsProps {
  tripOption: TripOptionResponse;
  budgetTotal: number; // In cents
}

export default function TripDetails({
  tripOption,
  budgetTotal,
}: TripDetailsProps) {
  const { flight, hotel, itinerary } = tripOption;

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      {/* Budget Breakdown */}
      <BudgetBreakdown
        flightCost={flight.price}
        hotelCost={hotel.priceTotal}
        remainingBudget={tripOption.remainingBudget}
      />

      {/* Flight Details */}
      <div className="bg-white rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">Flight details</h4>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Airline</span>
            <span className="font-medium">{flight.provider}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Outbound</span>
            <span className="font-medium">
              {formatDate(flight.departureTime)} at{' '}
              {formatTime(flight.departureTime)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Return</span>
            <span className="font-medium">
              {formatDate(flight.returnTime)} at {formatTime(flight.returnTime)}
            </span>
          </div>

          {flight.duration && (
            <div className="flex justify-between">
              <span className="text-gray-500">Duration</span>
              <span className="font-medium">{flight.duration}</span>
            </div>
          )}

          {flight.stops !== undefined && (
            <div className="flex justify-between">
              <span className="text-gray-500">Stops</span>
              <span className="font-medium">
                {flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
              </span>
            </div>
          )}

          <div className="flex justify-between pt-2 border-t border-gray-100">
            <span className="text-gray-500">Price</span>
            <span className="font-semibold text-blue-600">
              {formatCurrency(flight.price)}
            </span>
          </div>
        </div>
      </div>

      {/* Hotel Details */}
      <div className="bg-white rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">Hotel details</h4>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Hotel</span>
            <span className="font-medium">{hotel.name}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Rating</span>
            <span className="font-medium">{formatRating(hotel.rating)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Check-in</span>
            <span className="font-medium">{formatDate(flight.departureTime)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Check-out</span>
            <span className="font-medium">{formatDate(flight.returnTime)}</span>
          </div>

          {hotel.pricePerNight && (
            <div className="flex justify-between">
              <span className="text-gray-500">Per night</span>
              <span className="font-medium">
                {formatCurrency(hotel.pricePerNight)}
              </span>
            </div>
          )}

          <div className="flex justify-between pt-2 border-t border-gray-100">
            <span className="text-gray-500">Total</span>
            <span className="font-semibold text-blue-600">
              {formatCurrency(hotel.priceTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Activities Section (Phase 3) */}
      {tripOption.activities && tripOption.activities.length > 0 && (
        <div className="bg-white rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-4">
            Recommended Activities ({tripOption.activities.length})
          </h4>
          <div className="space-y-3">
            {tripOption.activities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} compact={false} />
            ))}
          </div>
          {tripOption.activities.some(a => a.price) && (
            <p className="text-xs text-gray-500 mt-4 italic">
              Total activities cost: {formatCurrency(
                tripOption.activities.filter(a => a.price).reduce((sum, a) => sum + a.price!, 0)
              )}
            </p>
          )}
        </div>
      )}

      {/* Itinerary Preview */}
      {itinerary && itinerary.length > 0 && (
        <div className="bg-white rounded-lg p-4">
          <ItineraryPreview itinerary={itinerary} />
        </div>
      )}
    </div>
  );
}
