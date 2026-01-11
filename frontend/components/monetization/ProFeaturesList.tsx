'use client';

import { PRO_FEATURES } from '@/lib/monetization/constants';

/**
 * Pro Features List
 *
 * Displays features included in Pro Planning.
 * Uses factual descriptions without exaggeration.
 */
export default function ProFeaturesList() {
  return (
    <ul className="space-y-3">
      {PRO_FEATURES.map((feature) => (
        <li key={feature.id} className="flex items-start">
          <svg
            className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <div>
            <span className="font-medium text-gray-900">{feature.title}</span>
            <p className="text-sm text-gray-500">{feature.description}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
