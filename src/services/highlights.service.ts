/**
 * Highlights Service (Phase 7)
 *
 * Extracts top attractions/highlights from a trip itinerary.
 * Used to populate the highlights field in TripOptionResponse.
 */

import { ItineraryDay } from '../types/api.types';

/**
 * Extract top highlights from an itinerary
 *
 * Strategy:
 * 1. Parse all activities from the itinerary days
 * 2. Identify notable attractions (museums, landmarks, tours, etc.)
 * 3. Return top 3-5 most prominent attractions
 *
 * @param itinerary - Day-by-day itinerary
 * @returns Array of 3-5 highlight strings
 */
export function extractHighlights(itinerary: ItineraryDay[]): string[] {
  const highlights: string[] = [];
  const seenHighlights = new Set<string>();

  // Keywords that indicate a highlight-worthy attraction
  const highlightKeywords = [
    'museum', 'tower', 'cathedral', 'palace', 'temple', 'castle',
    'monument', 'landmark', 'tour', 'cruise', 'park', 'gallery',
    'market', 'square', 'bridge', 'church', 'fortress', 'gardens',
    'theater', 'opera', 'arena', 'stadium', 'observatory', 'aquarium',
    'zoo', 'beach', 'island', 'mountain', 'waterfall', 'lake'
  ];

  // Process each day's activities
  for (const day of itinerary) {
    for (const activity of day.activities) {
      // Skip if we already have 5 highlights
      if (highlights.length >= 5) {
        break;
      }

      const activityLower = activity.toLowerCase();

      // Check if activity contains highlight keywords
      const isHighlight = highlightKeywords.some(keyword =>
        activityLower.includes(keyword)
      );

      if (isHighlight) {
        // Extract the main attraction name
        // Try to get the first part before " - " or " at " or ":"
        const parts = activity.split(/\s+-\s+|\s+at\s+|:/);
        const attractionName = parts[0].trim();

        // Only add if we haven't seen this highlight before (avoid duplicates)
        const normalizedName = attractionName.toLowerCase();
        if (!seenHighlights.has(normalizedName) && attractionName.length > 3) {
          highlights.push(attractionName);
          seenHighlights.add(normalizedName);
        }
      }
    }

    // Break outer loop if we have enough highlights
    if (highlights.length >= 5) {
      break;
    }
  }

  // If we found fewer than 3 highlights, add some general activities
  if (highlights.length < 3) {
    for (const day of itinerary) {
      if (highlights.length >= 3) break;

      for (const activity of day.activities) {
        if (highlights.length >= 3) break;

        // Extract first meaningful part of activity
        const parts = activity.split(/\s+-\s+|\s+at\s+|:/);
        const activityName = parts[0].trim();
        const normalizedName = activityName.toLowerCase();

        // Skip generic activities
        if (!normalizedName.includes('free time') &&
            !normalizedName.includes('relax') &&
            !normalizedName.includes('rest') &&
            !seenHighlights.has(normalizedName) &&
            activityName.length > 5) {
          highlights.push(activityName);
          seenHighlights.add(normalizedName);
        }
      }
    }
  }

  // Limit to maximum 5 highlights
  return highlights.slice(0, 5);
}

/**
 * Generate highlights from activities array (alternative format)
 *
 * Some itineraries might store activities differently.
 * This is a fallback method.
 *
 * @param activities - Array of activity strings
 * @returns Array of 3-5 highlight strings
 */
export function extractHighlightsFromActivities(activities: string[]): string[] {
  return extractHighlights([
    {
      day: 1,
      title: 'Activities',
      activities: activities
    }
  ]);
}
