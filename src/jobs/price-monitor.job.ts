/**
 * Price Monitoring Background Job (Phase 6)
 *
 * Periodically monitors prices for active trips and triggers re-optimization
 */

import { PrismaClient, LockStatus } from '@prisma/client';
import { monitorTripPrices, reOptimizeTrip } from '../services/optimization.service';
import { OptimizationTrigger } from '../types/optimization.types';

const prisma = new PrismaClient();

// =============================================================================
// CONFIGURATION
// =============================================================================

const MONITOR_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const MAX_TRIP_AGE_DAYS = 30; // Only monitor trips from last 30 days

// =============================================================================
// PRICE MONITORING JOB
// =============================================================================

/**
 * Monitor prices for all active trips
 */
export async function monitorAllTripPrices(): Promise<void> {
  try {
    console.log('🔍 Starting price monitoring job...');

    // Get recent trips with unlocked items
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MAX_TRIP_AGE_DAYS);

    const trips = await prisma.tripRequest.findMany({
      where: {
        createdAt: {
          gte: cutoffDate,
        },
      },
      include: {
        tripOptions: {
          include: {
            flightOption: true,
            hotelOption: true,
            activityOptions: true,
          },
        },
      },
    });

    console.log(`Found ${trips.length} trips to monitor`);

    let monitored = 0;
    let optimizationsFound = 0;

    for (const trip of trips) {
      try {
        // Skip if all items are locked/confirmed
        const hasUnlockedItems = trip.tripOptions.some(
          (option) =>
            option.flightOption?.lockStatus === LockStatus.UNLOCKED ||
            option.hotelOption?.lockStatus === LockStatus.UNLOCKED ||
            option.activityOptions.some((a) => a.lockStatus === LockStatus.UNLOCKED)
        );

        if (!hasUnlockedItems) {
          continue;
        }

        // Monitor prices
        const priceMonitoring = await monitorTripPrices(trip.id);

        if (priceMonitoring.hasSignificantChanges && priceMonitoring.totalSavingsOpportunity > 1000) {
          console.log(
            `💰 Found $${(priceMonitoring.totalSavingsOpportunity / 100).toFixed(2)} savings opportunity for trip ${trip.id}`
          );

          // Trigger re-optimization
          const reOptimizeResult = await reOptimizeTrip({
            tripRequestId: trip.id,
            trigger: OptimizationTrigger.PERIODIC,
            respectLocks: true,
          });

          if (reOptimizeResult.success && reOptimizeResult.optimizationsFound > 0) {
            optimizationsFound += reOptimizeResult.optimizationsFound;

            // TODO: Send notification to user
            console.log(
              `✅ Created ${reOptimizeResult.optimizationsFound} optimization opportunities for trip ${trip.id}`
            );
          }
        }

        monitored++;
      } catch (error) {
        console.error(`Error monitoring trip ${trip.id}:`, error);
      }
    }

    console.log(
      `✅ Price monitoring complete: ${monitored} trips monitored, ${optimizationsFound} optimizations found`
    );
  } catch (error) {
    console.error('Error in price monitoring job:', error);
  }
}

/**
 * Start periodic price monitoring
 */
export function startPriceMonitoring(): NodeJS.Timeout {
  console.log(
    `🚀 Starting periodic price monitoring (every ${MONITOR_INTERVAL_MS / 1000 / 60} minutes)`
  );

  // Run immediately on start
  monitorAllTripPrices();

  // Then run periodically
  return setInterval(monitorAllTripPrices, MONITOR_INTERVAL_MS);
}

/**
 * Stop periodic price monitoring
 */
export function stopPriceMonitoring(intervalId: NodeJS.Timeout): void {
  clearInterval(intervalId);
  console.log('🛑 Stopped periodic price monitoring');
}
