'use client';

import { ItineraryDay } from '@/lib/types';

interface ItineraryPreviewProps {
  itinerary: ItineraryDay[];
}

export default function ItineraryPreview({ itinerary }: ItineraryPreviewProps) {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-900">Itinerary preview</h4>

      <div className="space-y-4">
        {itinerary.map((day) => (
          <div key={day.day} className="border-l-2 border-blue-200 pl-4">
            <h5 className="font-medium text-gray-900">
              Day {day.day}: {day.title}
            </h5>
            <ul className="mt-2 space-y-1">
              {day.activities.map((activity, index) => (
                <li key={index} className="flex items-start text-sm">
                  <span className="text-blue-400 mr-2">•</span>
                  <span className="text-gray-600">{activity}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
