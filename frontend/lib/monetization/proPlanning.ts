/**
 * Pro Planning State Management
 *
 * MVP STUB: This is a placeholder for future payment integration.
 * Currently stores state in localStorage for demonstration only.
 *
 * ETHICAL GUARDRAILS:
 * - Pro status does NOT affect trip scoring
 * - Pro status does NOT hide free features
 * - Pro status is purely additive convenience
 */

import { ProPlanningState, ProPurchaseIntent } from './types';

const STORAGE_KEY = 'tripoptimizer_pro';

/**
 * Check if user has Pro Planning
 * MVP: Uses localStorage stub
 */
export function getProStatus(): ProPlanningState {
  if (typeof window === 'undefined') {
    return { isPro: false };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore localStorage errors
  }

  return { isPro: false };
}

/**
 * Activate Pro Planning (STUB)
 * In production, this would be called after payment confirmation
 */
export function activateProPlanning(): void {
  if (typeof window === 'undefined') return;

  const state: ProPlanningState = {
    isPro: true,
    purchaseDate: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/**
 * Record purchase intent for analytics
 * MVP: Logs to console, would send to backend in production
 */
export function recordPurchaseIntent(intent: ProPurchaseIntent): void {
  console.log('[Pro Planning] Purchase intent:', intent);
  // Future: Send to analytics/backend
}

/**
 * Clear Pro status (for testing)
 */
export function clearProStatus(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
