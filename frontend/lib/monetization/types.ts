/**
 * Monetization Type Definitions
 */

export interface ProFeature {
  id: string;
  title: string;
  description: string;
}

export interface ProPlanningState {
  isPro: boolean;
  purchaseDate?: string;
}

// Stub type for future payment integration
export interface ProPurchaseIntent {
  userId?: string;
  timestamp: string;
  source: 'results_page' | 'settings';
}
