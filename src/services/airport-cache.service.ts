/**
 * Airport Code Cache Service
 *
 * Phase 1: Global Destination Support
 * Provides database caching for resolved airport codes to minimize API calls
 * and improve performance. Stores results from Amadeus Location API lookups.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get cached airport code for a city
 * Returns null if not found or if it was resolved by unreliable fallback method
 */
export async function getCachedAirportCode(cityName: string): Promise<string | null> {
  try {
    const cached = await prisma.airportCode.findUnique({
      where: { cityName },
    });

    // Only return cache if it was resolved by reliable methods (not fallback)
    if (cached && cached.resolvedBy !== 'fallback') {
      console.log(`[AirportCache] ✓ Found cached ${cityName} → ${cached.iataCode} (via ${cached.resolvedBy})`);
      return cached.iataCode;
    }

    // If we have a fallback entry, ignore it and try API again
    if (cached && cached.resolvedBy === 'fallback') {
      console.log(`[AirportCache] Ignoring fallback cache for ${cityName}, will try API`);
    }

    return null;
  } catch (error) {
    console.error(`[AirportCache] Error fetching cached code for ${cityName}:`, error);
    return null;
  }
}

/**
 * Cache an airport code resolution result
 * Stores the result in the database for future lookups
 */
export async function cacheAirportCode(
  cityName: string,
  iataCode: string,
  resolvedBy: 'manual' | 'amadeus' | 'fallback',
  airportName?: string,
  country?: string
): Promise<void> {
  try {
    await prisma.airportCode.upsert({
      where: { cityName },
      create: {
        cityName,
        iataCode,
        resolvedBy,
        airportName,
        country,
      },
      update: {
        iataCode,
        resolvedBy,
        airportName,
        country,
        updatedAt: new Date(),
      },
    });
    console.log(`[AirportCache] ✓ Cached ${cityName} → ${iataCode} (${resolvedBy})`);
  } catch (error) {
    console.error(`[AirportCache] Error caching ${cityName} → ${iataCode}:`, error);
    // Don't throw - caching failure shouldn't break the flow
  }
}

/**
 * Get all cached airport codes
 * Useful for admin dashboard and debugging
 */
export async function getAllCachedAirportCodes(): Promise<Array<{
  cityName: string;
  iataCode: string;
  resolvedBy: string;
  airportName: string | null;
  country: string | null;
  updatedAt: Date;
}>> {
  try {
    const codes = await prisma.airportCode.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return codes.map(code => ({
      cityName: code.cityName,
      iataCode: code.iataCode,
      resolvedBy: code.resolvedBy,
      airportName: code.airportName,
      country: code.country,
      updatedAt: code.updatedAt,
    }));
  } catch (error) {
    console.error('[AirportCache] Error fetching all cached codes:', error);
    return [];
  }
}

/**
 * Clear airport code cache
 * Useful for testing or if data becomes stale
 */
export async function clearAirportCodeCache(): Promise<number> {
  try {
    const result = await prisma.airportCode.deleteMany({});
    console.log(`[AirportCache] Cleared ${result.count} cached airport codes`);
    return result.count;
  } catch (error) {
    console.error('[AirportCache] Error clearing cache:', error);
    return 0;
  }
}
