'use client';

/**
 * ItineraryPreview - Redesigned for Phase 11
 *
 * Features:
 * - Purple gradient day circles
 * - Morning/Afternoon/Evening time slot structure
 * - Colored bullets per time of day
 * - Clean typography and spacing
 */

import { ItineraryDay } from '@/lib/types';

interface ItineraryPreviewProps {
  itinerary: ItineraryDay[];
}

interface TimeSlot {
  label: string;
  bulletColor: string;
  activities: string[];
}

export default function ItineraryPreview({ itinerary }: ItineraryPreviewProps) {
  // Helper function to distribute activities into time slots
  const getTimeSlots = (activities: string[]): TimeSlot[] => {
    const activityCount = activities.length;
    const perSlot = Math.ceil(activityCount / 3);

    return [
      {
        label: 'Morning',
        bulletColor: 'text-purple-500',
        activities: activities.slice(0, perSlot),
      },
      {
        label: 'Afternoon',
        bulletColor: 'text-pink-500',
        activities: activities.slice(perSlot, perSlot * 2),
      },
      {
        label: 'Evening',
        bulletColor: 'text-blue-500',
        activities: activities.slice(perSlot * 2),
      },
    ].filter(slot => slot.activities.length > 0);
  };

  return (
    <div className="bg-white rounded-xl p-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
        <span>📅</span>
        <span>Your Day-by-Day Itinerary</span>
      </h3>

      <div className="space-y-8">
        {itinerary.map((day, dayIndex) => {
          const timeSlots = getTimeSlots(day.activities);

          return (
            <div key={day.day} className="relative">
              {/* Vertical Line Connector */}
              {dayIndex < itinerary.length - 1 && (
                <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gradient-to-b from-purple-300 to-pink-300 -translate-x-1/2" />
              )}

              {/* Day Card */}
              <div className="flex gap-6">
                {/* Day Number Circle */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg flex items-center justify-center shadow-lg">
                    {day.day}
                  </div>
                </div>

                {/* Day Content */}
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-900 mb-1">
                    Day {day.day}
                  </h4>
                  <p className="text-gray-600 font-medium mb-4">{day.title}</p>

                  {/* Time Slots */}
                  <div className="space-y-4">
                    {timeSlots.map((slot, slotIndex) => (
                      <div key={slotIndex} className="pl-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-2 h-2 rounded-full ${slot.bulletColor.replace('text-', 'bg-')}`} />
                          <h5 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
                            {slot.label}
                          </h5>
                        </div>
                        <ul className="space-y-2 ml-4">
                          {slot.activities.map((activity, actIndex) => (
                            <li
                              key={actIndex}
                              className="flex items-start gap-2 text-gray-700"
                            >
                              <span className={`${slot.bulletColor} mt-1 flex-shrink-0`}>
                                •
                              </span>
                              <span className="text-sm leading-relaxed">{activity}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
