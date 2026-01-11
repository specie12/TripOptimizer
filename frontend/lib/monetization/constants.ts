/**
 * Monetization Constants
 *
 * ETHICAL GUARDRAILS:
 * - All disclosure text is exact and cannot be shortened
 * - No urgency language allowed
 * - No exaggerated benefits
 */

// Exact disclosure text - DO NOT MODIFY
export const AFFILIATE_DISCLOSURE_TEXT =
  'We may earn a commission if you book — at no extra cost to you.';

// Pro Planning features - factual descriptions only
export const PRO_FEATURES = [
  {
    id: 'more-options',
    title: 'More trip options',
    description: 'See additional destination suggestions',
  },
  {
    id: 'hotel-flexibility',
    title: 'Hotel flexibility',
    description: 'Compare more hotel options per destination',
  },
  {
    id: 'shareable-itinerary',
    title: 'Shareable itinerary',
    description: 'Export and share your trip plans',
  },
] as const;

// One-time price placeholder (stub)
export const PRO_PLANNING_PRICE = '$9.99';

// FORBIDDEN PATTERNS - for code review checklist
export const FORBIDDEN_LANGUAGE = [
  'limited time',
  'act now',
  "don't miss",
  'exclusive',
  'hurry',
  'only X left',
  'ending soon',
] as const;
