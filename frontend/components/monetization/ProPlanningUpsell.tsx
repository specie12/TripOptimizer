'use client';

import { useState, useEffect } from 'react';
import { PRO_PLANNING_PRICE } from '@/lib/monetization/constants';
import {
  getProStatus,
  activateProPlanning,
  recordPurchaseIntent,
} from '@/lib/monetization/proPlanning';
import {
  trackProUpsellView,
  trackProUpsellClick,
  trackProUpsellDismiss,
} from '@/lib/monetization/tracking';
import ProFeaturesList from './ProFeaturesList';

interface ProPlanningUpsellProps {
  source?: 'results_page' | 'settings';
}

/**
 * Pro Planning Upsell Component
 *
 * ETHICAL IMPLEMENTATION:
 * - Appears AFTER results are shown (never blocks core functionality)
 * - No urgency language or countdown timers
 * - Clear "No thanks" dismissal option
 * - Does NOT re-appear after dismissal in same session
 */
export default function ProPlanningUpsell({
  source = 'results_page',
}: ProPlanningUpsellProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check Pro status
    const status = getProStatus();
    setIsPro(status.isPro);

    // Check if dismissed this session
    const sessionDismissed = sessionStorage.getItem('pro_upsell_dismissed');
    setDismissed(sessionDismissed === 'true');

    // Show if not Pro and not dismissed
    if (!status.isPro && sessionDismissed !== 'true') {
      setIsVisible(true);
      trackProUpsellView(source);
    }
  }, [source]);

  const handleGetPro = () => {
    trackProUpsellClick(source);
    recordPurchaseIntent({
      timestamp: new Date().toISOString(),
      source,
    });

    // STUB: In production, this would open payment flow
    // For MVP, just activate Pro status directly
    activateProPlanning();
    setIsPro(true);
    setIsVisible(false);

    // Show confirmation (could be toast in production)
    alert('Pro Planning activated! (MVP demo - no actual payment)');
  };

  const handleDismiss = () => {
    trackProUpsellDismiss(source);
    setIsVisible(false);
    setDismissed(true);
    sessionStorage.setItem('pro_upsell_dismissed', 'true');
  };

  // Don't render if Pro, dismissed, or not visible
  if (isPro || dismissed || !isVisible) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
      {/* Header - NO urgency language */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Upgrade to Pro Planning
        </h3>
        <p className="text-sm text-gray-600">
          One-time purchase. Unlock additional planning features.
        </p>
      </div>

      {/* Features List */}
      <div className="mb-6">
        <ProFeaturesList />
      </div>

      {/* Price and CTA */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={handleGetPro}
          className="w-full sm:w-auto py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Get Pro Planning for {PRO_PLANNING_PRICE}
        </button>

        {/* Clear dismissal option - NOT hidden or de-emphasized */}
        <button
          onClick={handleDismiss}
          className="w-full sm:w-auto py-3 px-6 text-gray-600 font-medium hover:text-gray-800 transition-colors"
        >
          No thanks
        </button>
      </div>

      {/* Reassurance - NOT false scarcity */}
      <p className="mt-4 text-xs text-gray-500">
        Your free trip results are complete. Pro Planning is optional.
      </p>
    </div>
  );
}
