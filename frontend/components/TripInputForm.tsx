'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TripFormData } from '@/lib/types';

interface TripInputFormProps {
  initialValues?: Partial<TripFormData>;
}

export default function TripInputForm({ initialValues }: TripInputFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<TripFormData>({
    originCity: initialValues?.originCity || '',
    numberOfDays: initialValues?.numberOfDays || 5,
    budgetTotal: initialValues?.budgetTotal || 2000,
    travelStyle: initialValues?.travelStyle || 'BALANCED',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const newErrors: Record<string, string> = {};
    if (!formData.originCity.trim()) {
      newErrors.originCity = 'Please enter your origin city';
    }
    if (formData.numberOfDays < 1 || formData.numberOfDays > 30) {
      newErrors.numberOfDays = 'Trip length must be between 1 and 30 days';
    }
    if (formData.budgetTotal < 100) {
      newErrors.budgetTotal = 'Minimum budget is $100';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Navigate to confirmation with data in URL params
    const params = new URLSearchParams({
      originCity: formData.originCity,
      days: formData.numberOfDays.toString(),
      budget: formData.budgetTotal.toString(),
      style: formData.travelStyle,
    });

    router.push(`/confirm?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
      {/* Origin City */}
      <div>
        <label
          htmlFor="originCity"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Where are you traveling from?
        </label>
        <input
          type="text"
          id="originCity"
          value={formData.originCity}
          onChange={(e) =>
            setFormData({ ...formData, originCity: e.target.value })
          }
          placeholder="e.g., New York"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg bg-white text-gray-900"
        />
        {errors.originCity && (
          <p className="mt-1 text-sm text-red-600">{errors.originCity}</p>
        )}
      </div>

      {/* Number of Days */}
      <div>
        <label
          htmlFor="numberOfDays"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          How many days?
        </label>
        <input
          type="number"
          id="numberOfDays"
          min="1"
          max="30"
          value={formData.numberOfDays}
          onChange={(e) =>
            setFormData({
              ...formData,
              numberOfDays: parseInt(e.target.value) || 1,
            })
          }
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg bg-white text-gray-900"
        />
        {errors.numberOfDays && (
          <p className="mt-1 text-sm text-red-600">{errors.numberOfDays}</p>
        )}
      </div>

      {/* Budget */}
      <div>
        <label
          htmlFor="budgetTotal"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Total budget
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">
            $
          </span>
          <input
            type="number"
            id="budgetTotal"
            min="100"
            step="100"
            value={formData.budgetTotal}
            onChange={(e) =>
              setFormData({
                ...formData,
                budgetTotal: parseInt(e.target.value) || 100,
              })
            }
            className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg bg-white text-gray-900"
          />
        </div>
        {errors.budgetTotal && (
          <p className="mt-1 text-sm text-red-600">{errors.budgetTotal}</p>
        )}
      </div>

      {/* Travel Style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Travel style
        </label>
        <div className="space-y-3">
          <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors bg-white">
            <input
              type="radio"
              name="travelStyle"
              value="BUDGET"
              checked={formData.travelStyle === 'BUDGET'}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  travelStyle: e.target.value as 'BUDGET' | 'BALANCED',
                })
              }
              className="w-4 h-4 text-blue-600"
            />
            <div className="ml-3">
              <span className="font-medium text-gray-900">Budget-friendly</span>
              <p className="text-sm text-gray-500">
                Maximize savings, prioritize value
              </p>
            </div>
          </label>

          <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors bg-white">
            <input
              type="radio"
              name="travelStyle"
              value="BALANCED"
              checked={formData.travelStyle === 'BALANCED'}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  travelStyle: e.target.value as 'BUDGET' | 'BALANCED',
                })
              }
              className="w-4 h-4 text-blue-600"
            />
            <div className="ml-3">
              <span className="font-medium text-gray-900">Balanced</span>
              <p className="text-sm text-gray-500">
                Mix of comfort and value
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full py-4 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-lg"
      >
        Continue
      </button>
    </form>
  );
}
