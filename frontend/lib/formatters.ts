/**
 * Formatting Utilities
 *
 * Convert backend data (cents, ISO dates) to user-friendly formats.
 */

/**
 * Convert cents to formatted currency string
 * 150000 -> "$1,500"
 */
export function formatCurrency(cents: number): string {
  const dollars = cents / 100;
  return `$${dollars.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

/**
 * Convert cents to dollars (number)
 * 150000 -> 1500
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Convert dollars to cents (number)
 * 1500 -> 150000
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Format date for display
 * "2026-02-20T08:00:00.000Z" -> "Thu, Feb 20"
 */
export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format time for display
 * "2026-02-20T08:00:00.000Z" -> "8:00 AM"
 */
export function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format travel style for display
 * "BUDGET" -> "Budget-friendly"
 * "BALANCED" -> "Balanced"
 */
export function formatTravelStyle(style: 'BUDGET' | 'BALANCED'): string {
  return style === 'BUDGET' ? 'Budget-friendly' : 'Balanced';
}

/**
 * Format number of days
 * 5 -> "5 days"
 * 1 -> "1 day"
 */
export function formatDays(days: number): string {
  return days === 1 ? '1 day' : `${days} days`;
}

/**
 * Parse explanation into bullet points
 * Takes a paragraph and splits into sentences for bullet display
 */
export function parseExplanationToBullets(explanation: string): string[] {
  // Split by sentence-ending punctuation followed by space
  const sentences = explanation
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return sentences;
}

/**
 * Format hotel rating for display
 * 4.2 -> "4.2 stars"
 * null -> "No rating"
 */
export function formatRating(rating: number | null): string {
  if (rating === null) {
    return 'No rating';
  }
  return `${rating.toFixed(1)} stars`;
}
