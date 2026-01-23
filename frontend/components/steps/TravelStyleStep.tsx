'use client';

/**
 * TravelStyleStep - Step 2 of Multi-Step Form (Phase 8)
 *
 * Collects:
 * - Budget Style (Budget/Mid-Range/Luxury)
 * - Trip Pace (Relaxed/Balanced/Packed)
 */

import React from 'react';
import { useFormContext } from '../../contexts/FormContext';

export default function TravelStyleStep() {
  const { formData, updateFormData, nextStep, prevStep, isStepValid } = useFormContext();

  const handleNext = () => {
    if (isStepValid(2)) {
      nextStep();
    }
  };

  const budgetStyles = [
    {
      value: 'BUDGET' as const,
      label: 'Budget',
      description: 'Cost-conscious travel with essential comfort',
      icon: '💰',
    },
    {
      value: 'MID_RANGE' as const,
      label: 'Mid-Range',
      description: 'Comfortable experiences with good value',
      icon: '⭐',
    },
    {
      value: 'LUXURY' as const,
      label: 'Luxury',
      description: 'Premium experiences and high-end stays',
      icon: '✨',
    },
  ];

  const tripPaces = [
    {
      value: 'RELAXED' as const,
      label: 'Relaxed',
      description: '2-3 activities per day',
      icon: '🌴',
    },
    {
      value: 'BALANCED' as const,
      label: 'Balanced',
      description: '4-5 activities per day',
      icon: '⚖️',
    },
    {
      value: 'PACKED' as const,
      label: 'Packed',
      description: '6+ activities per day',
      icon: '🚀',
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Your travel style
        </h2>
        <p className="text-lg text-gray-600">
          Help us personalize your trip to match your preferences
        </p>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-2xl shadow-lg p-8 space-y-10">
        {/* Budget Style Section */}
        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Budget Style</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {budgetStyles.map((style) => (
              <button
                key={style.value}
                onClick={() => updateFormData({ travelStyle: style.value })}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  formData.travelStyle === style.value
                    ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg'
                    : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                }`}
              >
                <div className="text-4xl mb-3">{style.icon}</div>
                <h4 className="font-semibold text-lg mb-2 text-gray-800">{style.label}</h4>
                <p className="text-sm text-gray-600">{style.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Trip Pace Section */}
        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Trip Pace</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tripPaces.map((pace) => (
              <button
                key={pace.value}
                onClick={() => updateFormData({ tripPace: pace.value })}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  formData.tripPace === pace.value
                    ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg'
                    : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                }`}
              >
                <div className="text-4xl mb-3">{pace.icon}</div>
                <h4 className="font-semibold text-lg mb-2 text-gray-800">{pace.label}</h4>
                <p className="text-sm text-gray-600">{pace.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 pt-6">
          <button
            onClick={prevStep}
            className="flex-1 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={!isStepValid(2)}
            className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            Next: Accommodation
          </button>
        </div>
      </div>
    </div>
  );
}
