/**
 * Trip Edit Service
 *
 * Handles swapping and editing of trip components.
 * Implements budget validation and lock management.
 *
 * CRITICAL: All operations maintain budget constraints and update lock status.
 */

import { PrismaClient, LockStatus } from '@prisma/client';
import { lockEntity, unlockEntity } from './lockdown.service';

const prisma = new PrismaClient();

// ============================================
// TYPES
// ============================================

export interface SwapResult {
  success: boolean;
  error?: string;
  updatedTripOption?: any;
  budgetImpact?: {
    previousCost: number;
    newCost: number;
    difference: number;
    remainingBudget: number;
  };
}

export interface EditResult {
  success: boolean;
  error?: string;
  newTripOptions?: any[];
  preservedComponents?: string[];
}

export interface FlightSwapData {
  provider: string;
  price: number;
  departureTime: string | Date;
  returnTime: string | Date;
  deepLink: string;
}

export interface HotelSwapData {
  name: string;
  priceTotal: number;
  rating?: number | null;
  deepLink: string;
}

// ============================================
// SWAP FLIGHT
// ============================================

/**
 * Swap flight for a trip option
 */
export async function swapFlight(tripOptionId: string, newFlightData: FlightSwapData): Promise<SwapResult> {
  try {
    // Get current trip option
    const tripOption = await prisma.tripOption.findUnique({
      where: { id: tripOptionId },
      include: {
        flightOption: true,
        tripRequest: {
          include: {
            budgetAllocations: true,
          },
        },
      },
    });

    if (!tripOption) {
      return { success: false, error: 'Trip option not found' };
    }

    if (!tripOption.flightOption) {
      return { success: false, error: 'No flight option found for this trip' };
    }

    // Calculate budget impact
    const oldFlightCost = tripOption.flightOption.price;
    const newFlightCost = newFlightData.price;
    const difference = newFlightCost - oldFlightCost;

    // Get flight budget allocation
    const flightBudget = tripOption.tripRequest.budgetAllocations.find(
      (alloc) => alloc.category === 'FLIGHT'
    );

    if (!flightBudget) {
      return { success: false, error: 'Flight budget allocation not found' };
    }

    // Validate budget
    if (newFlightCost > flightBudget.allocated) {
      return {
        success: false,
        error: `New flight exceeds budget. Flight budget: $${(flightBudget.allocated / 100).toFixed(2)}, New flight cost: $${(newFlightCost / 100).toFixed(2)}`,
      };
    }

    // Check total budget
    const totalBudget = tripOption.tripRequest.budgetTotal;
    const newTotalCost = tripOption.totalCost + difference;

    if (newTotalCost > totalBudget) {
      return {
        success: false,
        error: `Swap would exceed total budget. Total budget: $${(totalBudget / 100).toFixed(2)}, New total: $${(newTotalCost / 100).toFixed(2)}`,
      };
    }

    // Unlock old flight
    await unlockEntity('flight', tripOption.flightOption.id);

    // Update flight option with new data
    await prisma.flightOption.update({
      where: { id: tripOption.flightOption.id },
      data: {
        provider: newFlightData.provider,
        price: newFlightData.price,
        departureTime: new Date(newFlightData.departureTime),
        returnTime: new Date(newFlightData.returnTime),
        deepLink: newFlightData.deepLink,
      },
    });

    // Update trip option total cost
    const updatedTripOption = await prisma.tripOption.update({
      where: { id: tripOptionId },
      data: {
        totalCost: newTotalCost,
      },
      include: {
        flightOption: true,
        hotelOption: true,
        activityOptions: true,
      },
    });

    // Lock new flight
    await lockEntity({
      entityType: 'flight',
      entityId: tripOption.flightOption.id,
      lockStatus: LockStatus.LOCKED,
    });

    console.log(`[TripEdit] Flight swapped successfully. Cost change: $${(difference / 100).toFixed(2)}`);

    return {
      success: true,
      updatedTripOption,
      budgetImpact: {
        previousCost: oldFlightCost,
        newCost: newFlightCost,
        difference,
        remainingBudget: totalBudget - newTotalCost,
      },
    };
  } catch (error) {
    console.error('[TripEdit] Flight swap error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to swap flight',
    };
  }
}

// ============================================
// SWAP HOTEL
// ============================================

/**
 * Swap hotel for a trip option
 */
export async function swapHotel(tripOptionId: string, newHotelData: HotelSwapData): Promise<SwapResult> {
  try {
    // Get current trip option
    const tripOption = await prisma.tripOption.findUnique({
      where: { id: tripOptionId },
      include: {
        hotelOption: true,
        tripRequest: {
          include: {
            budgetAllocations: true,
          },
        },
      },
    });

    if (!tripOption) {
      return { success: false, error: 'Trip option not found' };
    }

    if (!tripOption.hotelOption) {
      return { success: false, error: 'No hotel option found for this trip' };
    }

    // Calculate budget impact
    const oldHotelCost = tripOption.hotelOption.priceTotal;
    const newHotelCost = newHotelData.priceTotal;
    const difference = newHotelCost - oldHotelCost;

    // Get hotel budget allocation
    const hotelBudget = tripOption.tripRequest.budgetAllocations.find(
      (alloc) => alloc.category === 'HOTEL'
    );

    if (!hotelBudget) {
      return { success: false, error: 'Hotel budget allocation not found' };
    }

    // Validate budget
    if (newHotelCost > hotelBudget.allocated) {
      return {
        success: false,
        error: `New hotel exceeds budget. Hotel budget: $${(hotelBudget.allocated / 100).toFixed(2)}, New hotel cost: $${(newHotelCost / 100).toFixed(2)}`,
      };
    }

    // Check total budget
    const totalBudget = tripOption.tripRequest.budgetTotal;
    const newTotalCost = tripOption.totalCost + difference;

    if (newTotalCost > totalBudget) {
      return {
        success: false,
        error: `Swap would exceed total budget. Total budget: $${(totalBudget / 100).toFixed(2)}, New total: $${(newTotalCost / 100).toFixed(2)}`,
      };
    }

    // Unlock old hotel
    await unlockEntity('hotel', tripOption.hotelOption.id);

    // Update hotel option with new data
    await prisma.hotelOption.update({
      where: { id: tripOption.hotelOption.id },
      data: {
        name: newHotelData.name,
        priceTotal: newHotelData.priceTotal,
        rating: newHotelData.rating,
        deepLink: newHotelData.deepLink,
      },
    });

    // Update trip option total cost
    const updatedTripOption = await prisma.tripOption.update({
      where: { id: tripOptionId },
      data: {
        totalCost: newTotalCost,
      },
      include: {
        flightOption: true,
        hotelOption: true,
        activityOptions: true,
      },
    });

    // Lock new hotel
    await lockEntity({
      entityType: 'hotel',
      entityId: tripOption.hotelOption.id,
      lockStatus: LockStatus.LOCKED,
    });

    console.log(`[TripEdit] Hotel swapped successfully. Cost change: $${(difference / 100).toFixed(2)}`);

    return {
      success: true,
      updatedTripOption,
      budgetImpact: {
        previousCost: oldHotelCost,
        newCost: newHotelCost,
        difference,
        remainingBudget: totalBudget - newTotalCost,
      },
    };
  } catch (error) {
    console.error('[TripEdit] Hotel swap error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to swap hotel',
    };
  }
}

// ============================================
// SWAP ACTIVITY
// ============================================

/**
 * Swap, add, or remove activity for a trip option
 */
export async function swapActivity(
  tripOptionId: string,
  activityId: string,
  action: 'add' | 'remove' | 'replace',
  replaceWithId?: string
): Promise<SwapResult> {
  try {
    // Get current trip option
    const tripOption = await prisma.tripOption.findUnique({
      where: { id: tripOptionId },
      include: {
        activityOptions: true,
        tripRequest: {
          include: {
            budgetAllocations: true,
          },
        },
      },
    });

    if (!tripOption) {
      return { success: false, error: 'Trip option not found' };
    }

    // Get activity budget
    const activityBudget = tripOption.tripRequest.budgetAllocations.find(
      (alloc) => alloc.category === 'ACTIVITY'
    );

    if (!activityBudget) {
      return { success: false, error: 'Activity budget allocation not found' };
    }

    const currentActivitiesCost =
      tripOption.activityOptions?.reduce((sum, act) => sum + (act.price || 0), 0) || 0;

    let newTotalCost = tripOption.totalCost;
    let difference = 0;

    // Handle different actions
    if (action === 'add') {
      const newActivity = await prisma.activityOption.findUnique({
        where: { id: activityId },
      });

      if (!newActivity) {
        return { success: false, error: 'Activity not found' };
      }

      // Check if adding would exceed budget
      const newActivitiesCost = currentActivitiesCost + newActivity.price;

      if (newActivitiesCost > activityBudget.allocated) {
        return {
          success: false,
          error: `Adding activity would exceed budget. Activity budget: $${(activityBudget.allocated / 100).toFixed(2)}, New cost: $${(newActivitiesCost / 100).toFixed(2)}`,
        };
      }

      difference = newActivity.price;
      newTotalCost = tripOption.totalCost + difference;

      // Add activity to trip option (relationship)
      await prisma.tripOption.update({
        where: { id: tripOptionId },
        data: {
          activityOptions: {
            connect: { id: activityId },
          },
          totalCost: newTotalCost,
        },
      });

      // Lock activity
      await lockEntity({
        entityType: 'activity',
        entityId: activityId,
        lockStatus: LockStatus.LOCKED,
      });
    } else if (action === 'remove') {
      const activityToRemove = tripOption.activityOptions?.find((act) => act.id === activityId);

      if (!activityToRemove) {
        return { success: false, error: 'Activity not in trip option' };
      }

      difference = -activityToRemove.price;
      newTotalCost = tripOption.totalCost + difference;

      // Remove activity from trip option
      await prisma.tripOption.update({
        where: { id: tripOptionId },
        data: {
          activityOptions: {
            disconnect: { id: activityId },
          },
          totalCost: newTotalCost,
        },
      });

      // Unlock activity
      await unlockEntity('activity', activityId);
    } else if (action === 'replace') {
      if (!replaceWithId) {
        return { success: false, error: 'replaceWithId is required for replace action' };
      }

      const oldActivity = tripOption.activityOptions?.find((act) => act.id === activityId);
      const newActivity = await prisma.activityOption.findUnique({
        where: { id: replaceWithId },
      });

      if (!oldActivity) {
        return { success: false, error: 'Activity to replace not found in trip option' };
      }

      if (!newActivity) {
        return { success: false, error: 'Replacement activity not found' };
      }

      difference = newActivity.price - oldActivity.price;
      const newActivitiesCost = currentActivitiesCost + difference;

      if (newActivitiesCost > activityBudget.allocated) {
        return {
          success: false,
          error: `Replacement would exceed budget. Activity budget: $${(activityBudget.allocated / 100).toFixed(2)}, New cost: $${(newActivitiesCost / 100).toFixed(2)}`,
        };
      }

      newTotalCost = tripOption.totalCost + difference;

      // Replace activity
      await prisma.tripOption.update({
        where: { id: tripOptionId },
        data: {
          activityOptions: {
            disconnect: { id: activityId },
            connect: { id: replaceWithId },
          },
          totalCost: newTotalCost,
        },
      });

      // Unlock old, lock new
      await unlockEntity('activity', activityId);

      await lockEntity({
        entityType: 'activity',
        entityId: replaceWithId,
        lockStatus: LockStatus.LOCKED,
      });
    }

    // Check total budget
    const totalBudget = tripOption.tripRequest.budgetTotal;
    if (newTotalCost > totalBudget) {
      return {
        success: false,
        error: `Operation would exceed total budget. Total budget: $${(totalBudget / 100).toFixed(2)}, New total: $${(newTotalCost / 100).toFixed(2)}`,
      };
    }

    // Get updated trip option
    const updatedTripOption = await prisma.tripOption.findUnique({
      where: { id: tripOptionId },
      include: {
        flightOption: true,
        hotelOption: true,
        activityOptions: true,
      },
    });

    console.log(`[TripEdit] Activity ${action} successful. Cost change: $${(difference / 100).toFixed(2)}`);

    return {
      success: true,
      updatedTripOption,
      budgetImpact: {
        previousCost: currentActivitiesCost,
        newCost: currentActivitiesCost + difference,
        difference,
        remainingBudget: totalBudget - newTotalCost,
      },
    };
  } catch (error) {
    console.error('[TripEdit] Activity swap error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to swap activity',
    };
  }
}

// ============================================
// EDIT TRIP
// ============================================

/**
 * Edit trip parameters and regenerate options
 */
export async function editTrip(
  tripRequestId: string,
  changes: any,
  preserveLocks: boolean
): Promise<EditResult> {
  try {
    console.log('[TripEdit] Editing trip request:', tripRequestId);
    console.log('[TripEdit] Changes:', changes);
    console.log('[TripEdit] Preserve locks:', preserveLocks);

    // Get current trip request
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
      return { success: false, error: 'Trip request not found' };
    }

    // Update trip request with changes
    const updateData: any = {};

    if (changes.destination) updateData.destination = changes.destination;
    if (changes.budgetTotal) updateData.budgetTotal = changes.budgetTotal;
    if (changes.startDate) updateData.startDate = new Date(changes.startDate);
    if (changes.numberOfDays) updateData.numberOfDays = changes.numberOfDays;
    if (changes.travelStyle) updateData.travelStyle = changes.travelStyle;
    if (changes.interests) updateData.interests = changes.interests;

    await prisma.tripRequest.update({
      where: { id: tripRequestId },
      data: updateData,
    });

    console.log('[TripEdit] Trip request updated successfully');

    // For now, return success with message to regenerate
    // Full implementation would call trip generation service
    return {
      success: true,
      preservedComponents: preserveLocks
        ? ['Locked components will be preserved in regeneration']
        : [],
    };
  } catch (error) {
    console.error('[TripEdit] Trip edit error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to edit trip',
    };
  }
}
