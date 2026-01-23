/**
 * Lock-Down Routes (Phase 2)
 *
 * API endpoints for locking/unlocking trip options, flights, and hotels
 */

import { Router, Request, Response } from 'express';
import {
  lockEntity,
  unlockEntity,
  getTripOptionLockState,
  getLockedItemsForTripRequest,
} from '../services/lockdown.service';
import { LockRequest } from '../types/lockdown.types';
import { LockStatus } from '@prisma/client';

export const lockdownRouter = Router();

/**
 * POST /lockdown/lock
 * Lock an entity (trip option, flight, or hotel)
 *
 * Body:
 * {
 *   "entityType": "trip_option" | "flight" | "hotel",
 *   "entityId": "uuid",
 *   "lockStatus": "LOCKED" | "CONFIRMED"
 * }
 */
lockdownRouter.post('/lock', async (req: Request, res: Response) => {
  try {
    const request: LockRequest = req.body;

    // Validation
    if (!request.entityType || !request.entityId || !request.lockStatus) {
      return res.status(400).json({
        error: 'Missing required fields: entityType, entityId, lockStatus',
      });
    }

    const validEntityTypes = ['trip_option', 'flight', 'hotel', 'activity'];
    if (!validEntityTypes.includes(request.entityType)) {
      return res.status(400).json({
        error: `Invalid entityType. Must be one of: ${validEntityTypes.join(', ')}`,
      });
    }

    const validLockStatuses: LockStatus[] = [LockStatus.LOCKED, LockStatus.CONFIRMED];
    if (!validLockStatuses.includes(request.lockStatus as LockStatus)) {
      return res.status(400).json({
        error: `Invalid lockStatus. Must be one of: ${validLockStatuses.join(', ')}`,
      });
    }

    // Perform lock operation
    const result = await lockEntity(request);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error locking entity:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /lockdown/unlock
 * Unlock an entity
 *
 * Body:
 * {
 *   "entityType": "trip_option" | "flight" | "hotel",
 *   "entityId": "uuid"
 * }
 */
lockdownRouter.post('/unlock', async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.body;

    // Validation
    if (!entityType || !entityId) {
      return res.status(400).json({
        error: 'Missing required fields: entityType, entityId',
      });
    }

    const validEntityTypes = ['trip_option', 'flight', 'hotel', 'activity'];
    if (!validEntityTypes.includes(entityType)) {
      return res.status(400).json({
        error: `Invalid entityType. Must be one of: ${validEntityTypes.join(', ')}`,
      });
    }

    // Perform unlock operation
    const result = await unlockEntity(entityType, entityId);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error unlocking entity:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /lockdown/status/:tripOptionId
 * Get lock status for a trip option and all its components
 */
lockdownRouter.get('/status/:tripOptionId', async (req: Request, res: Response) => {
  try {
    const { tripOptionId } = req.params;

    if (!tripOptionId) {
      return res.status(400).json({
        error: 'Missing tripOptionId parameter',
      });
    }

    const lockState = await getTripOptionLockState(tripOptionId);

    if (!lockState) {
      return res.status(404).json({
        error: 'Trip option not found',
      });
    }

    return res.status(200).json(lockState);
  } catch (error) {
    console.error('Error getting lock status:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /lockdown/trip/:tripRequestId
 * Get all locked items for a trip request
 */
lockdownRouter.get('/trip/:tripRequestId', async (req: Request, res: Response) => {
  try {
    const { tripRequestId } = req.params;

    if (!tripRequestId) {
      return res.status(400).json({
        error: 'Missing tripRequestId parameter',
      });
    }

    const lockedItems = await getLockedItemsForTripRequest(tripRequestId);

    return res.status(200).json({
      tripRequestId,
      lockedItems,
      totalLocked: lockedItems.filter((item) => item.isPartiallyLocked).length,
      totalFullyLocked: lockedItems.filter((item) => item.isFullyLocked).length,
    });
  } catch (error) {
    console.error('Error getting locked items for trip:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /lockdown/health
 * Health check endpoint
 */
lockdownRouter.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'lockdown',
    timestamp: new Date().toISOString(),
  });
});
