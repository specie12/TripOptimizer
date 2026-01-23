'use client';

/**
 * AccommodationStep - Step 3 of Multi-Step Form (Phase 8)
 *
 * Collects:
 * - Accommodation Type Preference (Hotels/Airbnb/Resorts/Hostels)
 */

import React from 'react';
import { useFormContext } from '../../contexts/FormContext';

export default function AccommodationStep() {
  const { formData, updateFormData, nextStep, prevStep } = useFormContext();

  const accommodationTypes = [
    {
      value: 'HOTELS' as const,
      label: 'Hotels',
      description: 'Traditional hotels with amenities',
      icon: '🏨',
    },
    {
      value: 'AIRBNB' as const,
      label: 'Airbnb',
      description: 'Vacation rentals and local stays',
      icon: '🏡',
    },
    {
      value: 'RESORTS' as const,
      label: 'Resorts',
      description: 'All-inclusive resort experiences',
      icon: '🏝️',
    },
    {
      value: 'HOSTELS' as const,
      label: 'Hostels',
      description: 'Budget-friendly shared spaces',
      icon: '🛏️',
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Accommodation Preference
        </h2>
        <p className="text-lg text-gray-600">
          Choose your preferred lodging type (optional)
        </p>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
        {/* Accommodation Type Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accommodationTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => updateFormData({ accommodationType: type.value })}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                formData.accommodationType === type.value
                  ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg'
                  : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
              }`}
            >
              <div className="text-5xl mb-4">{type.icon}</div>
              <h4 className="font-semibold text-xl mb-2 text-gray-800">{type.label}</h4>
              <p className="text-sm text-gray-600">{type.description}</p>
            </button>
          ))}
        </div>

        {/* Skip Option */}
        {!formData.accommodationType && (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">
              No preference? We&apos;ll recommend the best options for your budget style.
            </p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-4 pt-6">
          <button
            onClick={prevStep}
            className="flex-1 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={nextStep}
            className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
          >
            Next: Interests
          </button>
        </div>
      </div>
    </div>
  );
}
