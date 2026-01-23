/**
 * GradientBadge - Match Percentage Badge (Phase 10)
 *
 * Small pill-shaped badge with gradient background for displaying match percentages.
 */

import React from 'react';

interface GradientBadgeProps {
  percentage: number;
  label?: string;
  className?: string;
}

export default function GradientBadge({
  percentage,
  label = 'Match',
  className = '',
}: GradientBadgeProps) {
  return (
    <div
      className={`inline-flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm rounded-full shadow-lg ${className}`}
    >
      <span>{percentage}%</span>
      {label && <span>{label}</span>}
    </div>
  );
}
