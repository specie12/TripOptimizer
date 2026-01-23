/**
 * Optimization Service (Phase 6)
 *
 * Handles continuous optimization, price monitoring, and alternative recommendations
 */

import { PrismaClient, LockStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import {
  OptimizationTrigger,
  OpportunityType,
  OptimizationOpportunity,
  ReOptimizeRequest,
  ReOptimizeResponse,
  PriceMonitoringResult,
  PriceChange,
  OptimizationConstraints,
  DEFAULT_OPTIMIZATION_CONSTRAINTS,
  AffectedEntity,
  AlternativeRecommendation,
} from '../types/optimization.types';
import { flightIntegration } from '../integrations/flight.integration';
import { hotelIntegration } from '../integrations/hotel.integration';
import { activityIntegration } from '../integrations/activity.integration';

const prisma = new PrismaClient();

// =============================================================================
// PRICE MONITORING
// =============================================================================

/**
 * Monitor prices for a trip and detect changes
 */
export async function monitorTripPrices(tripRequestId: string): Promise<PriceMonitoringResult> {
  try {
    const tripRequest = await prisma.tripRequest.findUnique({
      where: { id: tripRequestId },
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

    if (!tripRequest) {
      throw new Error('Trip request not found');
    }

    const priceChanges: PriceChange[] = [];

    // Monitor each trip option
    for (const option of tripRequest.tripOptions) {
      // Monitor flight price if not locked
      if (option.flightOption && option.flightOption.lockStatus === LockStatus.UNLOCKED) {
        const flightChanges = await checkFlightPrice(
          option.flightOption.id,
          option.flightOption.provider,
          option.flightOption.price,
          tripRequest
        );
        priceChanges.push(...flightChanges);
      }

      // Monitor hotel price if not locked
      if (option.hotelOption && option.hotelOption.lockStatus === LockStatus.UNLOCKED) {
        const hotelChanges = await checkHotelPrice(
          option.hotelOption.id,
          option.hotelOption.name,
          option.hotelOption.priceTotal,
          tripRequest
        );
        priceChanges.push(...hotelChanges);
      }

      // Monitor activity prices if not locked
      for (const activity of option.activityOptions) {
        if (activity.lockStatus === LockStatus.UNLOCKED) {
          const activityChanges = await checkActivityPrice(
            activity.id,
            activity.name,
            activity.price,
            tripRequest.destination || option.destination
          );
          priceChanges.push(...activityChanges);
        }
      }
    }

    const totalSavingsOpportunity = priceChanges
      .filter((change) => change.priceDifference < 0)
      .reduce((sum, change) => sum + Math.abs(change.priceDifference), 0);

    const hasSignificantChanges = priceChanges.some(
      (change) =>
        Math.abs(change.percentageChange) >= DEFAULT_OPTIMIZATION_CONSTRAINTS.minPercentageChange
    );

    return {
      tripRequestId,
      monitoredAt: new Date(),
      priceChanges,
      totalSavingsOpportunity,
      hasSignificantChanges,
    };
  } catch (error) {
    console.error('Error monitoring trip prices:', error);
    throw error;
  }
}

/**
 * Check flight price for changes
 */
async function checkFlightPrice(
  flightId: string,
  currentProvider: string,
  currentPrice: number,
  tripRequest: any
): Promise<PriceChange[]> {
  try {
    // In a real implementation, this would call the flight API
    // For now, simulate price changes with mock data
    const mockPriceVariation = Math.random() * 0.2 - 0.1; // -10% to +10%
    const newPrice = Math.floor(currentPrice * (1 + mockPriceVariation));

    if (Math.abs(newPrice - currentPrice) >= DEFAULT_OPTIMIZATION_CONSTRAINTS.minSavingsThreshold) {
      return [
        {
          entityType: 'flight',
          entityId: flightId,
          oldPrice: currentPrice,
          newPrice,
          priceDifference: newPrice - currentPrice,
          percentageChange: ((newPrice - currentPrice) / currentPrice) * 100,
          detectedAt: new Date(),
        },
      ];
    }

    return [];
  } catch (error) {
    console.error('Error checking flight price:', error);
    return [];
  }
}

/**
 * Check hotel price for changes
 */
async function checkHotelPrice(
  hotelId: string,
  hotelName: string,
  currentPrice: number,
  tripRequest: any
): Promise<PriceChange[]> {
  try {
    // Mock price variation
    const mockPriceVariation = Math.random() * 0.15 - 0.05; // -5% to +10%
    const newPrice = Math.floor(currentPrice * (1 + mockPriceVariation));

    if (Math.abs(newPrice - currentPrice) >= DEFAULT_OPTIMIZATION_CONSTRAINTS.minSavingsThreshold) {
      return [
        {
          entityType: 'hotel',
          entityId: hotelId,
          oldPrice: currentPrice,
          newPrice,
          priceDifference: newPrice - currentPrice,
          percentageChange: ((newPrice - currentPrice) / currentPrice) * 100,
          detectedAt: new Date(),
        },
      ];
    }

    return [];
  } catch (error) {
    console.error('Error checking hotel price:', error);
    return [];
  }
}

/**
 * Check activity price for changes
 */
async function checkActivityPrice(
  activityId: string,
  activityName: string,
  currentPrice: number,
  destination: string
): Promise<PriceChange[]> {
  try {
    // Mock price variation
    const mockPriceVariation = Math.random() * 0.1 - 0.05; // -5% to +5%
    const newPrice = Math.floor(currentPrice * (1 + mockPriceVariation));

    if (Math.abs(newPrice - currentPrice) >= DEFAULT_OPTIMIZATION_CONSTRAINTS.minSavingsThreshold / 2) {
      return [
        {
          entityType: 'activity',
          entityId: activityId,
          oldPrice: currentPrice,
          newPrice,
          priceDifference: newPrice - currentPrice,
          percentageChange: ((newPrice - currentPrice) / currentPrice) * 100,
          detectedAt: new Date(),
        },
      ];
    }

    return [];
  } catch (error) {
    console.error('Error checking activity price:', error);
    return [];
  }
}

// =============================================================================
// RE-OPTIMIZATION
// =============================================================================

/**
 * Re-optimize a trip based on current prices and availability
 */
export async function reOptimizeTrip(request: ReOptimizeRequest): Promise<ReOptimizeResponse> {
  try {
    const tripRequest = await prisma.tripRequest.findUnique({
      where: { id: request.tripRequestId },
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

    if (!tripRequest) {
      return {
        success: false,
        tripRequestId: request.tripRequestId,
        optimizationsFound: 0,
        opportunities: [],
        totalPotentialSavings: 0,
        message: 'Trip request not found',
        error: 'Trip request not found',
      };
    }

    // Monitor prices first
    const priceMonitoring = await monitorTripPrices(request.tripRequestId);

    // Generate optimization opportunities
    const opportunities = await generateOptimizationOpportunities(
      tripRequest,
      priceMonitoring,
      request,
      DEFAULT_OPTIMIZATION_CONSTRAINTS
    );

    const totalPotentialSavings = opportunities.reduce(
      (sum, opp) => sum + opp.potentialSavings,
      0
    );

    return {
      success: true,
      tripRequestId: request.tripRequestId,
      optimizationsFound: opportunities.length,
      opportunities,
      totalPotentialSavings,
      message:
        opportunities.length > 0
          ? `Found ${opportunities.length} optimization opportunities with $${(totalPotentialSavings / 100).toFixed(2)} potential savings`
          : 'No optimization opportunities found at this time',
    };
  } catch (error) {
    console.error('Error re-optimizing trip:', error);
    return {
      success: false,
      tripRequestId: request.tripRequestId,
      optimizationsFound: 0,
      opportunities: [],
      totalPotentialSavings: 0,
      message: 'Failed to re-optimize trip',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate optimization opportunities from price changes
 */
async function generateOptimizationOpportunities(
  tripRequest: any,
  priceMonitoring: PriceMonitoringResult,
  request: ReOptimizeRequest,
  constraints: OptimizationConstraints
): Promise<OptimizationOpportunity[]> {
  const opportunities: OptimizationOpportunity[] = [];

  // Filter price changes that meet thresholds
  const significantChanges = priceMonitoring.priceChanges.filter(
    (change) =>
      Math.abs(change.priceDifference) >= constraints.minSavingsThreshold &&
      Math.abs(change.percentageChange) >= constraints.minPercentageChange * 100
  );

  // Group changes by trip option
  for (const option of tripRequest.tripOptions) {
    const optionChanges = significantChanges.filter((change) => {
      if (change.entityType === 'flight' && option.flightOption) {
        return change.entityId === option.flightOption.id;
      }
      if (change.entityType === 'hotel' && option.hotelOption) {
        return change.entityId === option.hotelOption.id;
      }
      if (change.entityType === 'activity') {
        return option.activityOptions.some((a: any) => a.id === change.entityId);
      }
      return false;
    });

    if (optionChanges.length > 0) {
      const opportunity = await createOptimizationOpportunity(
        tripRequest.id,
        option,
        optionChanges,
        request.trigger,
        constraints
      );

      if (opportunity) {
        opportunities.push(opportunity);
      }
    }
  }

  return opportunities;
}

/**
 * Create an optimization opportunity from price changes
 */
async function createOptimizationOpportunity(
  tripRequestId: string,
  tripOption: any,
  priceChanges: PriceChange[],
  trigger: OptimizationTrigger,
  constraints: OptimizationConstraints
): Promise<OptimizationOpportunity | null> {
  try {
    const totalSavings = priceChanges
      .filter((c) => c.priceDifference < 0)
      .reduce((sum, c) => sum + Math.abs(c.priceDifference), 0);

    if (totalSavings < constraints.minSavingsThreshold) {
      return null;
    }

    // Check affected entities
    const affectedEntities: AffectedEntity[] = [];
    const alternatives: AlternativeRecommendation[] = [];

    for (const change of priceChanges) {
      let canOptimize = true;
      let reason: string | undefined;
      let currentLockStatus: LockStatus = LockStatus.UNLOCKED;

      if (change.entityType === 'flight' && tripOption.flightOption) {
        currentLockStatus = tripOption.flightOption.lockStatus;
        if (constraints.respectLocks && currentLockStatus !== LockStatus.UNLOCKED) {
          canOptimize = false;
          reason = `Flight is ${currentLockStatus.toString().toLowerCase()}`;
        }
      } else if (change.entityType === 'hotel' && tripOption.hotelOption) {
        currentLockStatus = tripOption.hotelOption.lockStatus;
        if (constraints.respectLocks && currentLockStatus !== LockStatus.UNLOCKED) {
          canOptimize = false;
          reason = `Hotel is ${currentLockStatus.toString().toLowerCase()}`;
        }
      }

      affectedEntities.push({
        entityType: change.entityType,
        entityId: change.entityId,
        currentLockStatus,
        canOptimize,
        reason,
      });

      // Generate alternative if can optimize
      if (canOptimize && change.priceDifference < 0) {
        const alternative = createAlternativeRecommendation(change, tripOption);
        if (alternative) {
          alternatives.push(alternative);
        }
      }
    }

    // Only create opportunity if at least one entity can be optimized
    if (!affectedEntities.some((e) => e.canOptimize)) {
      return null;
    }

    const opportunityType =
      totalSavings > 0 ? OpportunityType.COST_SAVINGS : OpportunityType.BETTER_VALUE;

    return {
      id: uuidv4(),
      tripRequestId,
      opportunityType,
      trigger,
      title: `Save $${(totalSavings / 100).toFixed(2)} on ${tripOption.destination}`,
      description: `Price drops detected for ${priceChanges.length} item(s). Switch now to save money.`,
      potentialSavings: totalSavings,
      affectedEntities,
      alternatives,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 hours
      createdAt: new Date(),
    };
  } catch (error) {
    console.error('Error creating optimization opportunity:', error);
    return null;
  }
}

/**
 * Create alternative recommendation from price change
 */
function createAlternativeRecommendation(
  change: PriceChange,
  tripOption: any
): AlternativeRecommendation | null {
  try {
    let name = '';
    let provider = '';
    let deepLink = '';

    if (change.entityType === 'flight' && tripOption.flightOption) {
      name = `${tripOption.flightOption.provider} Flight`;
      provider = tripOption.flightOption.provider;
      deepLink = tripOption.flightOption.deepLink;
    } else if (change.entityType === 'hotel' && tripOption.hotelOption) {
      name = tripOption.hotelOption.name;
      provider = 'Booking.com';
      deepLink = tripOption.hotelOption.deepLink;
    }

    const savings = Math.abs(change.priceDifference);
    const improvementReason = `Price dropped by ${Math.abs(change.percentageChange).toFixed(1)}% - save $${(savings / 100).toFixed(2)}`;

    return {
      id: uuidv4(),
      entityType: change.entityType,
      name,
      provider,
      price: change.newPrice,
      priceDifference: change.priceDifference,
      improvementReason,
      deepLink,
    };
  } catch (error) {
    console.error('Error creating alternative recommendation:', error);
    return null;
  }
}

// =============================================================================
// OPTIMIZATION HELPERS
// =============================================================================

/**
 * Check if trip can be optimized
 */
export async function canOptimizeTrip(tripRequestId: string): Promise<boolean> {
  try {
    const tripRequest = await prisma.tripRequest.findUnique({
      where: { id: tripRequestId },
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

    if (!tripRequest) {
      return false;
    }

    // Check if any options have unlocked entities
    for (const option of tripRequest.tripOptions) {
      if (option.flightOption?.lockStatus === LockStatus.UNLOCKED) return true;
      if (option.hotelOption?.lockStatus === LockStatus.UNLOCKED) return true;
      if (option.activityOptions.some((a) => a.lockStatus === LockStatus.UNLOCKED)) return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking if trip can be optimized:', error);
    return false;
  }
}
