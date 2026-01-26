'use client';

/**
 * TripCard - Redesigned for Phase 9
 *
 * Features:
 * - Match percentage badge
 * - Visual cost breakdown (5 categories with colors)
 * - Trip highlights section
 * - Trip type description
 * - Purple gradient theme
 */

import { useState } from 'react';
import { TripOptionResponse } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';
import { trackExpandExplanation, trackViewDetails } from '@/lib/tracking';
import WhyThisWorks from './WhyThisWorks';
import TripDetails from './TripDetails';
import AffiliateDisclosure from './monetization/AffiliateDisclosure';
import ActivityCard from './ActivityCard';
import BookingModal from './BookingModal';
import FlightSwapModal from './FlightSwapModal';
import HotelSwapModal from './HotelSwapModal';
import BudgetImpactDisplay from './BudgetImpactDisplay';

interface TripCardProps {
  tripOption: TripOptionResponse;
  budgetTotal: number; // In cents
}

export default function TripCard({ tripOption, budgetTotal }: TripCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [explanationExpanded, setExplanationExpanded] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [flightSwapModalOpen, setFlightSwapModalOpen] = useState(false);
  const [hotelSwapModalOpen, setHotelSwapModalOpen] = useState(false);
  const [showBudgetBreakdown, setShowBudgetBreakdown] = useState(false);
  const [currentTripOption, setCurrentTripOption] = useState(tripOption);

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

  const handleSwapSuccess = (updatedTripOption: any) => {
    setCurrentTripOption(updatedTripOption);
  };

  // Calculate costs for breakdown (use currentTripOption for live updates)
  const flightCost = currentTripOption.flight.price;
  const hotelCost = currentTripOption.hotel.priceTotal;
  const activitiesCost = currentTripOption.activities?.reduce((sum, a) => sum + a.price, 0) || 0;

  // Estimate food and transport from remaining budget
  const remainingAfterActivities = currentTripOption.remainingBudget - activitiesCost;
  const estimatedFood = Math.floor(remainingAfterActivities * 0.6);
  const estimatedTransport = Math.floor(remainingAfterActivities * 0.4);

  const costBreakdown = [
    { category: 'Flights', amount: flightCost, icon: '✈️', color: 'bg-blue-500' },
    { category: 'Hotels', amount: hotelCost, icon: '🏨', color: 'bg-purple-500' },
    { category: 'Activities', amount: activitiesCost, icon: '🎭', color: 'bg-green-500' },
    { category: 'Food', amount: estimatedFood, icon: '🍽️', color: 'bg-orange-500' },
    { category: 'Transport', amount: estimatedTransport, icon: '🚗', color: 'bg-yellow-500' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-shadow">
      {/* Header with Match Badge */}
      <div className="p-6 pb-4 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-3xl font-bold text-gray-900">
            {currentTripOption.destination}
          </h3>

          {/* Match Percentage Badge */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
            {currentTripOption.matchPercentage}% Match
          </div>
        </div>

        {/* Trip Type Description */}
        <p className="text-gray-700 font-medium mb-4">
          {currentTripOption.tripTypeDescription}
        </p>

        {/* Total Cost Display */}
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {formatCurrency(currentTripOption.totalCost)}
          </span>
          <span className="text-gray-600 text-lg">total</span>
        </div>
      </div>

      {/* Cost Breakdown Section */}
      <div className="p-6 border-t border-gray-100">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>💵</span>
          <span>Cost Breakdown</span>
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {costBreakdown.map((item) => (
            <div
              key={item.category}
              className="bg-gray-50 rounded-lg p-4 text-center border-l-4"
              style={{ borderLeftColor: item.color.replace('bg-', '#') }}
            >
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="text-xs text-gray-600 mb-1">{item.category}</div>
              <div className="font-bold text-gray-900 text-sm">
                {formatCurrency(item.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trip Highlights Section */}
      {currentTripOption.highlights && currentTripOption.highlights.length > 0 && (
        <div className="p-6 border-t border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <span>✨</span>
              <span>Trip Highlights</span>
            </h4>
            <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
              Personalized for you
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {currentTripOption.highlights.map((highlight, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-full text-sm font-medium"
              >
                {highlight}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Trip Type Badge */}
      <div className="px-6 pb-6">
        <div className="bg-gray-50 rounded-lg p-4 flex items-start gap-3">
          <div className="text-2xl">🎯</div>
          <div>
            <div className="font-semibold text-gray-900 text-sm mb-1">Trip Type</div>
            <div className="text-gray-700 text-sm">
              {currentTripOption.tripTypeDescription}
            </div>
          </div>
        </div>
      </div>

      {/* Why This Works - Expandable */}
      <div className="px-6 pb-4 border-t border-gray-100">
        <button
          onClick={handleExpandExplanation}
          className="flex items-center justify-between w-full text-left py-3"
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
          <WhyThisWorks explanation={currentTripOption.explanation} />
        )}
      </div>

      {/* Activities Section (Phase 3) */}
      {currentTripOption.activities && currentTripOption.activities.length > 0 && (
        <div className="px-6 pb-4 border-t border-gray-100">
          <div className="pt-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span>🎯</span>
              <span>Recommended Activities ({currentTripOption.activities.length})</span>
            </h4>
            <div className="space-y-2">
              {currentTripOption.activities.slice(0, 3).map((activity) => (
                <ActivityCard key={activity.id} activity={activity} compact={true} />
              ))}
              {currentTripOption.activities.length > 3 && (
                <p className="text-sm text-gray-500 text-center pt-2">
                  + {currentTripOption.activities.length - 3} more activities
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Full Itinerary Button */}
      <div className="px-6 pb-6">
        <button
          onClick={handleViewDetails}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
        >
          {showDetails ? 'Hide Full Itinerary' : 'View Full Itinerary'}
        </button>
      </div>

      {/* Bottom Section - Booking Actions */}
      <div className="px-6 pb-6 border-t border-gray-100 pt-6">
        {/* Primary CTA: Book Complete Trip */}
        <button
          onClick={() => setBookingModalOpen(true)}
          className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg mb-4 flex items-center justify-center gap-2"
        >
          <span className="text-lg">🎉</span>
          <span>Book Complete Trip - {formatCurrency(currentTripOption.totalCost)}</span>
        </button>

        {/* Secondary Options: Individual Booking */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 text-center mb-3">
            Or book components separately:
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={currentTripOption.flight.deepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[140px] py-2 px-4 bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200 transition-colors text-center text-sm"
              onClick={() =>
                import('@/lib/tracking').then(({ trackBookFlightClick }) =>
                  trackBookFlightClick(
                    currentTripOption.id,
                    currentTripOption.destination,
                    currentTripOption.flight.provider
                  )
                )
              }
            >
              ✈️ Flight Only
            </a>

            <a
              href={currentTripOption.hotel.deepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[140px] py-2 px-4 bg-purple-100 text-purple-700 font-semibold rounded-lg hover:bg-purple-200 transition-colors text-center text-sm"
              onClick={() =>
                import('@/lib/tracking').then(({ trackBookHotelClick }) =>
                  trackBookHotelClick(
                    currentTripOption.id,
                    currentTripOption.destination,
                    currentTripOption.hotel.name
                  )
                )
              }
            >
              🏨 Hotel Only
            </a>
          </div>
        </div>

        {/* Phase 5: Component Swap Options */}
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span>🔄</span>
            <span>Customize Your Trip</span>
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={() => setFlightSwapModalOpen(true)}
              className="flex-1 min-w-[140px] py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              ✈️ Swap Flight
            </button>
            <button
              onClick={() => setHotelSwapModalOpen(true)}
              className="flex-1 min-w-[140px] py-2 px-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              🏨 Swap Hotel
            </button>
          </div>
          <button
            onClick={() => setShowBudgetBreakdown(!showBudgetBreakdown)}
            className="w-full py-2 px-4 bg-white border border-blue-300 text-blue-700 font-medium rounded-lg hover:bg-blue-50 transition-colors text-sm"
          >
            {showBudgetBreakdown ? '📊 Hide Budget Details' : '📊 View Budget Breakdown'}
          </button>
        </div>

        {/* Budget Breakdown Display */}
        {showBudgetBreakdown && (
          <div className="mb-4">
            <BudgetImpactDisplay tripOptionId={currentTripOption.id} />
          </div>
        )}

        {/* Affiliate Disclosure */}
        <AffiliateDisclosure className="text-center mb-2" />

        {/* Reassurance Copy */}
        <p className="text-sm text-gray-500 text-center">
          Secure payment powered by Stripe. Nothing is charged until you confirm.
        </p>
      </div>

      {/* Booking Modal */}
      <BookingModal
        tripOption={currentTripOption}
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
      />

      {/* Phase 5: Flight Swap Modal */}
      <FlightSwapModal
        tripOptionId={currentTripOption.id}
        currentFlight={currentTripOption.flight}
        flightBudget={Math.floor(budgetTotal * 0.30)} // Estimate 30% for flights
        totalBudget={budgetTotal}
        currentTotalCost={currentTripOption.totalCost}
        isOpen={flightSwapModalOpen}
        onClose={() => setFlightSwapModalOpen(false)}
        onSwapSuccess={handleSwapSuccess}
      />

      {/* Phase 5: Hotel Swap Modal */}
      <HotelSwapModal
        tripOptionId={currentTripOption.id}
        currentHotel={currentTripOption.hotel}
        hotelBudget={Math.floor(budgetTotal * 0.25)} // Estimate 25% for hotels
        totalBudget={budgetTotal}
        currentTotalCost={currentTripOption.totalCost}
        isOpen={hotelSwapModalOpen}
        onClose={() => setHotelSwapModalOpen(false)}
        onSwapSuccess={handleSwapSuccess}
      />

      {/* Expandable Trip Details */}
      {showDetails && (
        <div className="border-t border-gray-100">
          <TripDetails tripOption={currentTripOption} budgetTotal={budgetTotal} />
        </div>
      )}
    </div>
  );
}
