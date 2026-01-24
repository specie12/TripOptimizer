'use client';

/**
 * Landing Page - Multi-Step Form Wizard (Phase 8)
 *
 * Replaced single-page form with 4-step wizard:
 * 1. Budget Basics
 * 2. Travel Style
 * 3. Accommodation
 * 4. Interests
 */

import { Suspense } from 'react';
import { FormProvider, useFormContext } from '@/contexts/FormContext';
import BudgetBasicsStep from '@/components/steps/BudgetBasicsStep';
import TravelStyleStep from '@/components/steps/TravelStyleStep';
import AccommodationStep from '@/components/steps/AccommodationStep';
import InterestsStep from '@/components/steps/InterestsStep';

function MultiStepForm() {
  const { currentStep } = useFormContext();

  const steps = [
    { number: 1, label: 'Budget Basics' },
    { number: 2, label: 'Travel Style' },
    { number: 3, label: 'Accommodation' },
    { number: 4, label: 'Interests' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex justify-between items-center max-w-2xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                {/* Step Circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all ${
                      currentStep === step.number
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-110'
                        : currentStep > step.number
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {currentStep > step.number ? '✓' : step.number}
                  </div>
                  <span
                    className={`text-xs mt-2 font-medium ${
                      currentStep === step.number
                        ? 'text-purple-600'
                        : currentStep > step.number
                        ? 'text-green-600'
                        : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-all ${
                      currentStep > step.number
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="mt-8">
          {currentStep === 1 && <BudgetBasicsStep />}
          {currentStep === 2 && <TravelStyleStep />}
          {currentStep === 3 && <AccommodationStep />}
          {currentStep === 4 && <InterestsStep />}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white">
          <div className="max-w-6xl mx-auto px-4 py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mb-4"></div>
            <p className="text-gray-600">Loading form...</p>
          </div>
        </div>
      }
    >
      <FormProvider>
        <MultiStepForm />
      </FormProvider>
    </Suspense>
  );
}
