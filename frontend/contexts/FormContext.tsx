'use client';

/**
 * FormContext - Multi-Step Form State Management (Phase 8)
 *
 * Manages form state across the multi-step wizard:
 * - Step 1: Budget Basics (budget, origin, destination, dates, days)
 * - Step 2: Travel Style (budget style, trip pace)
 * - Step 3: Accommodation (accommodation type)
 * - Step 4: Interests (multi-select interests)
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TripFormData } from '../lib/types';

// Extended form data to include all new Phase 7 fields
export interface ExtendedFormData extends Omit<TripFormData, 'budgetTotal'> {
  budgetTotal: number; // In dollars (not cents)
  numberOfTravelers?: number;
  departureDate?: string;
}

interface FormContextType {
  // Form state
  formData: ExtendedFormData;
  currentStep: number;

  // Actions
  updateFormData: (data: Partial<ExtendedFormData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  resetForm: () => void;

  // Validation
  isStepValid: (step: number) => boolean;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

// Default form values
const defaultFormData: ExtendedFormData = {
  originCity: '',
  destination: '',
  startDate: '',
  numberOfDays: 7,
  budgetTotal: 2000, // Default $2000
  travelStyle: 'MID_RANGE',
  tripPace: 'BALANCED',
  accommodationType: undefined,
  interests: [],
  numberOfTravelers: 2,
  departureDate: '',
};

export function FormProvider({ children }: { children: ReactNode }) {
  const [formData, setFormData] = useState<ExtendedFormData>(defaultFormData);
  const [currentStep, setCurrentStep] = useState(1);

  const updateFormData = (data: Partial<ExtendedFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < 4 && isStepValid(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= 4) {
      setCurrentStep(step);
    }
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setCurrentStep(1);
  };

  // Validation per step
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        // Budget Basics: budget >= $100, origin city required, days 1-30
        return (
          formData.budgetTotal >= 100 &&
          formData.originCity.trim().length > 0 &&
          formData.numberOfDays >= 1 &&
          formData.numberOfDays <= 30
        );
      case 2:
        // Travel Style: budget style and trip pace required
        return (
          formData.travelStyle !== undefined &&
          formData.tripPace !== undefined
        );
      case 3:
        // Accommodation: optional, always valid
        return true;
      case 4:
        // Interests: optional, always valid
        return true;
      default:
        return false;
    }
  };

  return (
    <FormContext.Provider
      value={{
        formData,
        currentStep,
        updateFormData,
        nextStep,
        prevStep,
        goToStep,
        resetForm,
        isStepValid,
      }}
    >
      {children}
    </FormContext.Provider>
  );
}

// Custom hook for using the form context
export function useFormContext() {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within FormProvider');
  }
  return context;
}
