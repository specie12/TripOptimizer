'use client';

/**
 * HotelSwapModal - Phase 5: Component Swap Flow
 *
 * Allows users to swap hotels with alternative options
 * Features:
 * - Search alternative hotels
 * - Budget validation
 * - Real-time budget impact display
 */

import { useState } from 'react';
import { HotelResponse } from '@/lib/types';
import { swapHotel, HotelSwapData } from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';

interface HotelSwapModalProps {
  tripOptionId: string;
  currentHotel: HotelResponse;
  hotelBudget: number;
  totalBudget: number;
  currentTotalCost: number;
  isOpen: boolean;
  onClose: () => void;
  onSwapSuccess: (updatedTripOption: any) => void;
}

export default function HotelSwapModal({
  tripOptionId,
  currentHotel,
  hotelBudget,
  totalBudget,
  currentTotalCost,
  isOpen,
  onClose,
  onSwapSuccess,
}: HotelSwapModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Alternative hotel form state
  const [newHotel, setNewHotel] = useState<HotelSwapData>({
    name: '',
    priceTotal: 0,
    rating: null,
    deepLink: '',
  });

  const handleSwap = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await swapHotel(tripOptionId, newHotel);

      if (result.success) {
        setSuccessMessage(
          `Hotel swapped successfully! ${
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
        setError(result.error || 'Failed to swap hotel');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to swap hotel');
    } finally {
      setLoading(false);
    }
  };

  const budgetImpact = newHotel.priceTotal - currentHotel.priceTotal;
  const newTotalCost = currentTotalCost + budgetImpact;
  const exceedsBudget = newTotalCost > totalBudget;
  const exceedsHotelBudget = newHotel.priceTotal > hotelBudget;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-50 to-purple-100 p-6 border-b border-purple-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Swap Hotel</h2>
              <p className="text-gray-600 text-sm">
                Replace your current hotel with a new option
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

        {/* Current Hotel Info */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span>🏨</span>
            <span>Current Hotel</span>
          </h3>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-gray-900">{currentHotel.name}</p>
                {currentHotel.rating && (
                  <p className="text-sm text-gray-600">
                    ⭐ {currentHotel.rating.toFixed(1)} stars
                  </p>
                )}
              </div>
              <p className="font-bold text-gray-900">{formatCurrency(currentHotel.priceTotal)}</p>
            </div>
          </div>
        </div>

        {/* New Hotel Form */}
        <div className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>🔄</span>
            <span>New Hotel Details</span>
          </h3>

          <div className="space-y-4">
            {/* Hotel Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hotel Name *
              </label>
              <input
                type="text"
                value={newHotel.name}
                onChange={(e) => setNewHotel({ ...newHotel, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., Grand Hotel Barcelona"
                required
              />
            </div>

            {/* Total Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Price (for entire stay) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                <input
                  type="number"
                  value={newHotel.priceTotal / 100}
                  onChange={(e) => setNewHotel({ ...newHotel, priceTotal: Math.round(parseFloat(e.target.value) * 100) })}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              {exceedsHotelBudget && (
                <p className="text-red-600 text-sm mt-1">
                  ⚠️ Exceeds hotel budget ({formatCurrency(hotelBudget)})
                </p>
              )}
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Star Rating (optional)
              </label>
              <input
                type="number"
                value={newHotel.rating || ''}
                onChange={(e) => setNewHotel({ ...newHotel, rating: e.target.value ? parseFloat(e.target.value) : null })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., 4.5"
                step="0.1"
                min="0"
                max="5"
              />
            </div>

            {/* Booking Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Booking Link *
              </label>
              <input
                type="url"
                value={newHotel.deepLink}
                onChange={(e) => setNewHotel({ ...newHotel, deepLink: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="https://..."
                required
              />
            </div>
          </div>

          {/* Budget Impact Display */}
          {newHotel.priceTotal > 0 && (
            <div className="mt-6 bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span>💰</span>
                <span>Budget Impact</span>
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Previous Hotel Cost:</span>
                  <span className="font-semibold">{formatCurrency(currentHotel.priceTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">New Hotel Cost:</span>
                  <span className="font-semibold">{formatCurrency(newHotel.priceTotal)}</span>
                </div>
                <div className="flex justify-between border-t border-purple-200 pt-2">
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
                <div className="flex justify-between border-t border-purple-200 pt-2">
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
              !newHotel.name ||
              !newHotel.priceTotal ||
              !newHotel.deepLink ||
              exceedsBudget
            }
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Swapping...' : 'Swap Hotel'}
          </button>
        </div>
      </div>
    </div>
  );
}
