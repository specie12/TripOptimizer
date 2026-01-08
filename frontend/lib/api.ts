/**
 * API Client for TripOptimizer Backend
 */

import {
  GenerateTripRequest,
  GenerateTripResponse,
  ApiErrorResponse,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Generate trip options based on user preferences
 */
export async function generateTrip(
  request: GenerateTripRequest
): Promise<GenerateTripResponse> {
  const response = await fetch(`${API_BASE}/trip/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error: ApiErrorResponse = await response.json();
    throw new Error(error.message || 'Failed to generate trip options');
  }

  return response.json();
}

/**
 * Health check endpoint
 */
export async function checkHealth(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE}/trip/health`);
  return response.json();
}
