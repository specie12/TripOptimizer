/**
 * Optimization Routes (Phase 6)
 *
 * API endpoints for continuous optimization, price monitoring, and alternative recommendations
 */

import { Router, Request, Response } from 'express';
import {
  monitorTripPrices,
  reOptimizeTrip,
  canOptimizeTrip,
} from '../services/optimization.service';
import {
  ReOptimizeRequest,
  OptimizationTrigger,
} from '../types/optimization.types';

export const optimizationRouter = Router();

/**
 * POST /optimization/reoptimize
 * Re-optimize a trip based on current prices and availability
 *
 * Body:
 * {
 *   "tripRequestId": "uuid",
 *   "trigger": "PRICE_DROP" | "BETTER_OPTION" | "MANUAL" | "PERIODIC",
 *   "respectLocks": true,
 *   "categories": ["flight", "hotel"]  // optional
 * }
 */
optimizationRouter.post('/reoptimize', async (req: Request, res: Response) => {
  try {
    const request: ReOptimizeRequest = req.body;

    // Validation
    if (!request.tripRequestId) {
      return res.status(400).json({
        error: 'Missing required field: tripRequestId',
      });
    }

    if (!request.trigger) {
      request.trigger = OptimizationTrigger.MANUAL;
    }

    if (request.respectLocks === undefined) {
      request.respectLocks = true; // Default to respecting locks
    }

    const validTriggers = Object.values(OptimizationTrigger);
    if (!validTriggers.includes(request.trigger)) {
      return res.status(400).json({
        error: `Invalid trigger. Must be one of: ${validTriggers.join(', ')}`,
      });
    }

    // Perform re-optimization
    const result = await reOptimizeTrip(request);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error re-optimizing trip:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /optimization/monitor/:tripRequestId
 * Monitor prices for a trip and detect changes
 */
optimizationRouter.get('/monitor/:tripRequestId', async (req: Request, res: Response) => {
  try {
    const { tripRequestId } = req.params;

    if (!tripRequestId) {
      return res.status(400).json({
        error: 'Missing tripRequestId parameter',
      });
    }

    const result = await monitorTripPrices(tripRequestId);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error monitoring trip prices:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /optimization/can-optimize/:tripRequestId
 * Check if a trip can be optimized (has unlocked items)
 */
optimizationRouter.get('/can-optimize/:tripRequestId', async (req: Request, res: Response) => {
  try {
    const { tripRequestId } = req.params;

    if (!tripRequestId) {
      return res.status(400).json({
        error: 'Missing tripRequestId parameter',
      });
    }

    const canOptimize = await canOptimizeTrip(tripRequestId);

    return res.status(200).json({
      tripRequestId,
      canOptimize,
      message: canOptimize
        ? 'Trip has unlocked items and can be optimized'
        : 'All items are locked or confirmed',
    });
  } catch (error) {
    console.error('Error checking if trip can be optimized:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /optimization/health
 * Health check endpoint
 */
optimizationRouter.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'optimization',
    timestamp: new Date().toISOString(),
  });
});
