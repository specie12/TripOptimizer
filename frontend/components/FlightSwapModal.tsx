'use client';

/**
 * FlightSwapModal - Phase 5: Component Swap Flow
 *
 * Allows users to swap flights with alternative options
 * Features:
 * - Search alternative flights
 * - Budget validation
 * - Real-time budget impact display
 */

import { useState } from 'react';
import { FlightResponse } from '@/lib/types';
import { swapFlight, FlightSwapData } from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';

interface FlightSwapModalProps {
  tripOptionId: string;
  currentFlight: FlightResponse;
  flightBudget: number;
  totalBudget: number;
  currentTotalCost: number;
  isOpen: boolean;
  onClose: () => void;
  onSwapSuccess: (updatedTripOption: any) => void;
}

export default function FlightSwapModal({
  tripOptionId,
  currentFlight,
  flightBudget,
  totalBudget,
  currentTotalCost,
  isOpen,
  onClose,
  onSwapSuccess,
}: FlightSwapModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Alternative flight form state
  const [newFlight, setNewFlight] = useState<FlightSwapData>({
    provider: '',
    price: 0,
    departureTime: '',
    returnTime: '',
    deepLink: '',
  });

  const handleSwap = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await swapFlight(tripOptionId, newFlight);

      if (result.success) {
        setSuccessMessage(
          `Flight swapped successfully! ${
            result.budgetImpact?.difference! > 0 ? 'Cost increased' : 'Saved'
          } ${formatCurrency(Math.abs(result.budgetImpact?.difference || 0))}`
        );

        // Notify parent component
        onSwapSuccess(result.updatedTripOption);

        // Auto-close after 2 seconds
        setTimeout(() => {
          onClose();
          setSuccessMessage(null);
        }, 2000);
      } else {
        setError(result.error || 'Failed to swap flight');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to swap flight');
    } finally {
      setLoading(false);
    }
  };

  const budgetImpact = newFlight.price - currentFlight.price;
  const newTotalCost = currentTotalCost + budgetImpact;
  const exceedsBudget = newTotalCost > totalBudget;
  const exceedsFlightBudget = newFlight.price > flightBudget;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-blue-100 p-6 border-b border-blue-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Swap Flight</h2>
              <p className="text-gray-600 text-sm">
                Replace your current flight with a new option
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Current Flight Info */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span>✈️</span>
            <span>Current Flight</span>
          </h3>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-gray-900">{currentFlight.provider}</p>
                <p className="text-sm text-gray-600">
                  {new Date(currentFlight.departureTime).toLocaleString()} →{' '}
                  {new Date(currentFlight.returnTime).toLocaleString()}
                </p>
              </div>
              <p className="font-bold text-gray-900">{formatCurrency(currentFlight.price)}</p>
            </div>
          </div>
        </div>

        {/* New Flight Form */}
        <div className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>🔄</span>
            <span>New Flight Details</span>
          </h3>

          <div className="space-y-4">
            {/* Provider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Airline / Provider *
              </label>
              <input
                type="text"
                value={newFlight.provider}
                onChange={(e) => setNewFlight({ ...newFlight, provider: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., United Airlines"
                required
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                <input
                  type="number"
                  value={newFlight.price / 100}
                  onChange={(e) => setNewFlight({ ...newFlight, price: Math.round(parseFloat(e.target.value) * 100) })}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              {exceedsFlightBudget && (
                <p className="text-red-600 text-sm mt-1">
                  ⚠️ Exceeds flight budget ({formatCurrency(flightBudget)})
                </p>
              )}
            </div>

            {/* Departure Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Departure Time *
              </label>
              <input
                type="datetime-local"
                value={newFlight.departureTime}
                onChange={(e) => setNewFlight({ ...newFlight, departureTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Return Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Return Time *
              </label>
              <input
                type="datetime-local"
                value={newFlight.returnTime}
                onChange={(e) => setNewFlight({ ...newFlight, returnTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Booking Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Booking Link *
              </label>
              <input
                type="url"
                value={newFlight.deepLink}
                onChange={(e) => setNewFlight({ ...newFlight, deepLink: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://..."
                required
              />
            </div>
          </div>

          {/* Budget Impact Display */}
          {newFlight.price > 0 && (
            <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span>💰</span>
                <span>Budget Impact</span>
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Previous Flight Cost:</span>
                  <span className="font-semibold">{formatCurrency(currentFlight.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">New Flight Cost:</span>
                  <span className="font-semibold">{formatCurrency(newFlight.price)}</span>
                </div>
                <div className="flex justify-between border-t border-blue-200 pt-2">
                  <span className="text-gray-600">Difference:</span>
                  <span className={`font-bold ${budgetImpact > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {budgetImpact > 0 ? '+' : ''}{formatCurrency(budgetImpact)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">New Total Trip Cost:</span>
                  <span className="font-bold">{formatCurrency(newTotalCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Budget:</span>
                  <span className="font-semibold">{formatCurrency(totalBudget)}</span>
                </div>
                <div className="flex justify-between border-t border-blue-200 pt-2">
                  <span className="text-gray-600">Remaining Budget:</span>
                  <span className={`font-bold ${exceedsBudget ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(totalBudget - newTotalCost)}
                  </span>
                </div>
              </div>
              {exceedsBudget && (
                <p className="text-red-600 text-sm mt-3 font-semibold">
                  ⚠️ This swap would exceed your total budget!
                </p>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm font-semibold">{successMessage}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSwap}
            disabled={
              loading ||
              !newFlight.provider ||
              !newFlight.price ||
              !newFlight.departureTime ||
              !newFlight.returnTime ||
              !newFlight.deepLink ||
              exceedsBudget
            }
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Swapping...' : 'Swap Flight'}
          </button>
        </div>
      </div>
    </div>
  );
}
