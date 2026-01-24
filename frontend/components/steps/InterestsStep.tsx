'use client';

/**
 * InterestsStep - Step 4 of Multi-Step Form (Phase 8)
 *
 * Collects:
 * - User Interests (multi-select)
 * - Final submission to generate trip
 */

import React, { useState } from 'react';
import { useFormContext } from '../../contexts/FormContext';
import { useRouter } from 'next/navigation';

export default function InterestsStep() {
  const { formData, updateFormData, prevStep } = useFormContext();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const interestOptions = [
    {
      value: 'CULTURE_HISTORY',
      label: 'Culture & History',
      icon: '🏛️',
    },
    {
      value: 'FOOD_DINING',
      label: 'Food & Dining',
      icon: '🍽️',
    },
    {
      value: 'ADVENTURE',
      label: 'Adventure',
      icon: '🧗',
    },
    {
      value: 'BEACH_RELAXATION',
      label: 'Beach & Relaxation',
      icon: '🏖️',
    },
    {
      value: 'NIGHTLIFE',
      label: 'Nightlife',
      icon: '🎉',
    },
    {
      value: 'NATURE_WILDLIFE',
      label: 'Nature & Wildlife',
      icon: '🌿',
    },
    {
      value: 'SHOPPING',
      label: 'Shopping',
      icon: '🛍️',
    },
    {
      value: 'ART_MUSEUMS',
      label: 'Art & Museums',
      icon: '🎨',
    },
  ];

  const toggleInterest = (interest: string) => {
    const currentInterests = formData.interests || [];
    const isSelected = currentInterests.includes(interest);

    if (isSelected) {
      updateFormData({
        interests: currentInterests.filter((i) => i !== interest),
      });
    } else {
      updateFormData({
        interests: [...currentInterests, interest],
      });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Build query params for results page
    const params = new URLSearchParams({
      budget: formData.budgetTotal.toString(),
      originCity: formData.originCity,
      days: formData.numberOfDays.toString(),
      style: formData.travelStyle,
    });

    if (formData.destination) {
      params.set('destination', formData.destination);
    }
    if (formData.startDate) {
      params.set('startDate', formData.startDate);
    }
    if (formData.tripPace) {
      params.set('pace', formData.tripPace);
    }
    if (formData.accommodationType) {
      params.set('accommodation', formData.accommodationType);
    }
    if (formData.interests && formData.interests.length > 0) {
      params.set('interests', formData.interests.join(','));
    }
    if (formData.numberOfTravelers) {
      params.set('travelers', formData.numberOfTravelers.toString());
    }

    // Navigate to results page
    router.push(`/results?${params.toString()}`);
  };

  const isSelected = (interest: string) => {
    return formData.interests?.includes(interest) || false;
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          What interests you?
        </h2>
        <p className="text-lg text-gray-600">
          Select all that apply to personalize your trip
        </p>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
        {/* Interests Grid - Multi-select */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {interestOptions.map((interest) => (
            <button
              key={interest.value}
              onClick={() => toggleInterest(interest.value)}
              className={`p-6 rounded-xl border-2 transition-all text-center ${
                isSelected(interest.value)
                  ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg'
                  : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
              }`}
            >
              <div className="text-4xl mb-3">{interest.icon}</div>
              <p className="font-medium text-sm text-gray-800">{interest.label}</p>
            </button>
          ))}
        </div>

        {/* Selected Count */}
        <div className="text-center py-4">
          <p className="text-gray-600">
            {formData.interests && formData.interests.length > 0 ? (
              <>
                <span className="font-semibold text-purple-600">
                  {formData.interests.length}
                </span>{' '}
                interest{formData.interests.length !== 1 ? 's' : ''} selected
              </>
            ) : (
              'No interests selected (we&apos;ll recommend popular activities)'
            )}
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 pt-6">
          <button
            onClick={prevStep}
            disabled={isSubmitting}
            className="flex-1 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isSubmitting ? (
              <>
                <span className="inline-block animate-spin mr-2">⚙️</span>
                Optimizing...
              </>
            ) : (
              <>
                Optimize My {formData.destination || 'Trip'} ✨
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
