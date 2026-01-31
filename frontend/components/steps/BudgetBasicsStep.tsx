'use client';

/**
 * BudgetBasicsStep - Step 1 of Multi-Step Form (Phase 8)
 *
 * Collects:
 * - Total Budget
 * - Origin City
 * - Destination (optional)
 * - Number of Travelers
 * - Departure Date
 * - Trip Duration
 */

import React from 'react';
import { useFormContext } from '../../contexts/FormContext';
import CityAutocomplete from '../ui/CityAutocomplete';

export default function BudgetBasicsStep() {
  const { formData, updateFormData, nextStep, isStepValid } = useFormContext();

  const handleNext = () => {
    if (isStepValid(1)) {
      nextStep();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Hero Section with Purple Gradient */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Your budget. Your perfect trip.
        </h1>
        <p className="text-xl text-gray-600">
          Tell us your budget. We&apos;ll suggest perfect destinations or optimize your chosen trip.
        </p>
      </div>

      {/* Form Fields */}
      <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
        {/* Budget Input - Large and Prominent */}
        <div>
          <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
            Total Budget <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-bold text-gray-400">
              $
            </span>
            <input
              id="budget"
              type="number"
              min="100"
              step="100"
              value={formData.budgetTotal}
              onChange={(e) => updateFormData({ budgetTotal: Number(e.target.value) })}
              className="w-full pl-12 pr-4 py-4 text-3xl font-bold border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="2000"
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">Minimum $100</p>
        </div>

        {/* Two Column Grid for Smaller Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Origin City */}
          <div>
            <label htmlFor="origin" className="block text-sm font-medium text-gray-700 mb-2">
              Flying From <span className="text-red-500">*</span>
            </label>
            <CityAutocomplete
              id="origin"
              value={formData.originCity}
              onChange={(val) => updateFormData({ originCity: val })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="e.g., New York"
            />
          </div>

          {/* Destination */}
          <div>
            <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
              Destination <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <CityAutocomplete
              id="destination"
              value={formData.destination || ''}
              onChange={(val) => updateFormData({ destination: val })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="Leave blank for suggestions"
            />
          </div>

          {/* Number of Travelers */}
          <div>
            <label htmlFor="travelers" className="block text-sm font-medium text-gray-700 mb-2">
              Travelers
            </label>
            <input
              id="travelers"
              type="number"
              min="1"
              max="10"
              value={formData.numberOfTravelers || 2}
              onChange={(e) => updateFormData({ numberOfTravelers: Number(e.target.value) })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Departure Date */}
          <div>
            <label htmlFor="departureDate" className="block text-sm font-medium text-gray-700 mb-2">
              Departure Date <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <input
              id="departureDate"
              type="date"
              value={formData.departureDate || ''}
              onChange={(e) => updateFormData({ departureDate: e.target.value, startDate: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Trip Duration */}
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
              Trip Duration <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                id="duration"
                type="number"
                min="1"
                max="30"
                value={formData.numberOfDays}
                onChange={(e) => updateFormData({ numberOfDays: Number(e.target.value) })}
                className="w-24 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 transition-colors text-center"
              />
              <span className="text-gray-600 font-medium">days</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">1-30 days</p>
          </div>
        </div>

        {/* Next Button */}
        <div className="pt-6">
          <button
            onClick={handleNext}
            disabled={!isStepValid(1)}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            Next: Travel Style
          </button>
        </div>
      </div>
    </div>
  );
}
