'use client';

/**
 * ActivityCard Component (Phase 3)
 *
 * Displays an individual activity with details
 */

import { ActivityResponse } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';

interface ActivityCardProps {
  activity: ActivityResponse;
  compact?: boolean; // Compact mode for displaying in lists
}

export default function ActivityCard({ activity, compact = false }: ActivityCardProps) {
  // Format duration as hours and minutes
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${mins}min`;
  };

  // Get category icon
  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      TOUR: '🚶',
      ATTRACTION: '🏛️',
      EXPERIENCE: '✨',
      ADVENTURE: '⛰️',
      ENTERTAINMENT: '🎭',
      TRANSPORT: '🚌',
    };
    return icons[category] || '📍';
  };

  // Get category color
  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      TOUR: 'bg-blue-100 text-blue-700',
      ATTRACTION: 'bg-purple-100 text-purple-700',
      EXPERIENCE: 'bg-green-100 text-green-700',
      ADVENTURE: 'bg-orange-100 text-orange-700',
      ENTERTAINMENT: 'bg-pink-100 text-pink-700',
      TRANSPORT: 'bg-yellow-100 text-yellow-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  if (compact) {
    return (
      <div className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{getCategoryIcon(activity.category)}</span>
              <h4 className="font-semibold text-gray-900 text-sm truncate">{activity.name}</h4>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(activity.category)}`}>
                {activity.category}
              </span>
              <span>⏱️ {formatDuration(activity.duration)}</span>
              {activity.rating && (
                <span>⭐ {activity.rating.toFixed(1)}</span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {activity.price ? (
              <span className="font-semibold text-green-600 text-sm">
                {formatCurrency(activity.price)}
              </span>
            ) : (
              <a
                href={activity.deepLink}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue-600 text-sm hover:underline"
              >
                See price
              </a>
            )}
            <a
              href={activity.deepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
            >
              Book →
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-white">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-3xl">{getCategoryIcon(activity.category)}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-lg mb-1">{activity.name}</h3>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(activity.category)}`}>
              {activity.category}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold mb-1">
            {activity.price ? (
              <span className="text-green-600">{formatCurrency(activity.price)}</span>
            ) : (
              <a
                href={activity.deepLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-base"
              >
                View pricing →
              </a>
            )}
          </div>
          {activity.rating && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <span className="text-yellow-500">★</span>
              <span className="font-medium">{activity.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-700 text-sm mb-4 leading-relaxed">
        {activity.description}
      </p>

      {/* Details */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <span>⏱️</span>
            <span>{formatDuration(activity.duration)}</span>
          </span>
        </div>

        <a
          href={activity.deepLink}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Book Activity
        </a>
      </div>
    </div>
  );
}
