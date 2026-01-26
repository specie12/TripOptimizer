/**
 * Trip Edit Routes
 *
 * Endpoints for swapping and editing trip components.
 * Allows users to customize trip options after generation.
 */

import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { swapFlight, swapHotel, swapActivity, editTrip } from '../services/trip-edit.service';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/trip-edit/:tripOptionId/swap/flight
 *
 * Swap flight for a trip option
 * Body: { provider, price, departureTime, returnTime, deepLink }
 */
router.post('/:tripOptionId/swap/flight', async (req: Request, res: Response) => {
  try {
    const { tripOptionId } = req.params;
    const { provider, price, departureTime, returnTime, deepLink } = req.body;

    if (!provider || price === undefined || !departureTime || !returnTime || !deepLink) {
      return res.status(400).json({
        success: false,
        error: 'Missing required flight data: provider, price, departureTime, returnTime, deepLink',
      });
    }

    console.log(`[TripEdit] Swapping flight for trip ${tripOptionId}`);

    const result = await swapFlight(tripOptionId, {
      provider,
      price,
      departureTime,
      returnTime,
      deepLink,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[TripEdit] Flight swap error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to swap flight',
    });
  }
});

/**
 * POST /api/trip-edit/:tripOptionId/swap/hotel
 *
 * Swap hotel for a trip option
 * Body: { name, priceTotal, rating?, deepLink }
 */
router.post('/:tripOptionId/swap/hotel', async (req: Request, res: Response) => {
  try {
    const { tripOptionId } = req.params;
    const { name, priceTotal, rating, deepLink } = req.body;

    if (!name || priceTotal === undefined || !deepLink) {
      return res.status(400).json({
        success: false,
        error: 'Missing required hotel data: name, priceTotal, deepLink',
      });
    }

    console.log(`[TripEdit] Swapping hotel for trip ${tripOptionId}`);

    const result = await swapHotel(tripOptionId, {
      name,
      priceTotal,
      rating: rating || null,
      deepLink,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[TripEdit] Hotel swap error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to swap hotel',
    });
  }
});

/**
 * POST /api/trip-edit/:tripOptionId/swap/activity
 *
 * Swap or modify activities for a trip option
 * Body: { activityId, action: 'add'|'remove'|'replace', replaceWithId? }
 */
router.post('/:tripOptionId/swap/activity', async (req: Request, res: Response) => {
  try {
    const { tripOptionId } = req.params;
    const { activityId, action } = req.body;

    if (!activityId || !action) {
      return res.status(400).json({
        success: false,
        error: 'activityId and action are required',
      });
    }

    if (!['add', 'remove', 'replace'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'action must be one of: add, remove, replace',
      });
    }

    console.log(`[TripEdit] ${action} activity ${activityId} for trip ${tripOptionId}`);

    const result = await swapActivity(tripOptionId, activityId, action, req.body.replaceWithId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[TripEdit] Activity swap error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to swap activity',
    });
  }
});

/**
 * POST /api/trip-edit/:tripRequestId/edit
 *
 * Edit trip parameters and regenerate options
 * Body: { changes: {...}, preserveLocks: boolean }
 */
router.post('/:tripRequestId/edit', async (req: Request, res: Response) => {
  try {
    const { tripRequestId } = req.params;
    const { changes, preserveLocks } = req.body;

    if (!changes) {
      return res.status(400).json({
        success: false,
        error: 'changes object is required',
      });
    }

    console.log(`[TripEdit] Editing trip request ${tripRequestId}:`, changes);

    const result = await editTrip(tripRequestId, changes, preserveLocks || false);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[TripEdit] Trip edit error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to edit trip',
    });
  }
});

/**
 * GET /api/trip-edit/:tripOptionId/budget
 *
 * Get current budget breakdown for a trip option
 */
router.get('/:tripOptionId/budget', async (req: Request, res: Response) => {
  try {
    const { tripOptionId } = req.params;

    const tripOption = await prisma.tripOption.findUnique({
      where: { id: tripOptionId },
      include: {
        flightOption: true,
        hotelOption: true,
        activityOptions: true,
        tripRequest: {
          include: {
            budgetAllocations: true,
          },
        },
      },
    });

    if (!tripOption) {
      return res.status(404).json({
        success: false,
        error: 'Trip option not found',
      });
    }

    // Calculate current spending
    const flightCost = tripOption.flightOption?.price || 0;
    const hotelCost = tripOption.hotelOption?.priceTotal || 0;
    const activitiesCost =
      tripOption.activityOptions?.reduce((sum, activity) => sum + (activity.price || 0), 0) || 0;

    // Get budget allocations
    const allocations = tripOption.tripRequest.budgetAllocations || [];
    const budgetMap: Record<string, number> = {};
    allocations.forEach((alloc) => {
      budgetMap[alloc.category] = alloc.allocated;
    });

    // Calculate remaining budget
    const totalBudget = tripOption.tripRequest.budgetTotal;
    const totalSpent = flightCost + hotelCost + activitiesCost;
    const remaining = totalBudget - totalSpent;

    res.json({
      success: true,
      budget: {
        total: totalBudget,
        allocated: budgetMap,
        spent: {
          flight: flightCost,
          hotel: hotelCost,
          activities: activitiesCost,
          total: totalSpent,
        },
        remaining,
        percentageUsed: (totalSpent / totalBudget) * 100,
      },
    });
  } catch (error) {
    console.error('[TripEdit] Budget retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get budget',
    });
  }
});

export default router;
