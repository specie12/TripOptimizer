/**
 * Budget & Spend Tracking Routes (Phase 5)
 *
 * API endpoints for recording spends, tracking budgets, and getting alerts
 */

import { Router, Request, Response } from 'express';
import { BudgetCategory } from '@prisma/client';
import {
  recordSpend,
  getTripBudgetBreakdown,
  getBudgetAlerts,
  getTripSpendSummary,
  validateSpend,
} from '../services/spend.service';
import {
  RecordSpendRequest,
  ValidateSpendRequest,
} from '../types/spend.types';

export const budgetRouter = Router();

/**
 * POST /budget/spend
 * Record a spend for a trip request
 *
 * Body:
 * {
 *   "tripRequestId": "uuid",
 *   "category": "FLIGHT" | "HOTEL" | "ACTIVITY" | "FOOD" | "TRANSPORT" | "CONTINGENCY",
 *   "amount": 5000,  // cents
 *   "description": "Lunch at restaurant"
 * }
 */
budgetRouter.post('/spend', async (req: Request, res: Response) => {
  try {
    const request: RecordSpendRequest = req.body;

    // Validation
    if (!request.tripRequestId || !request.category || !request.amount) {
      return res.status(400).json({
        error: 'Missing required fields: tripRequestId, category, amount',
      });
    }

    if (request.amount <= 0) {
      return res.status(400).json({
        error: 'Amount must be greater than 0',
      });
    }

    const validCategories = Object.values(BudgetCategory);
    if (!validCategories.includes(request.category as BudgetCategory)) {
      return res.status(400).json({
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
      });
    }

    // Record the spend
    const result = await recordSpend(request);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error recording spend:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /budget/breakdown/:tripRequestId
 * Get complete budget breakdown for a trip
 */
budgetRouter.get('/breakdown/:tripRequestId', async (req: Request, res: Response) => {
  try {
    const { tripRequestId } = req.params;

    if (!tripRequestId) {
      return res.status(400).json({
        error: 'Missing tripRequestId parameter',
      });
    }

    const breakdown = await getTripBudgetBreakdown(tripRequestId);

    if (!breakdown) {
      return res.status(404).json({
        error: 'Trip request not found',
      });
    }

    return res.status(200).json(breakdown);
  } catch (error) {
    console.error('Error getting budget breakdown:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /budget/alerts/:tripRequestId
 * Get budget alerts for a trip
 */
budgetRouter.get('/alerts/:tripRequestId', async (req: Request, res: Response) => {
  try {
    const { tripRequestId } = req.params;

    if (!tripRequestId) {
      return res.status(400).json({
        error: 'Missing tripRequestId parameter',
      });
    }

    const alerts = await getBudgetAlerts(tripRequestId);

    return res.status(200).json({
      tripRequestId,
      alerts,
      totalAlerts: alerts.length,
    });
  } catch (error) {
    console.error('Error getting budget alerts:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /budget/summary/:tripRequestId
 * Get spend summary for a trip
 */
budgetRouter.get('/summary/:tripRequestId', async (req: Request, res: Response) => {
  try {
    const { tripRequestId } = req.params;

    if (!tripRequestId) {
      return res.status(400).json({
        error: 'Missing tripRequestId parameter',
      });
    }

    const summary = await getTripSpendSummary(tripRequestId);

    if (!summary) {
      return res.status(404).json({
        error: 'Trip request not found or no spend records',
      });
    }

    return res.status(200).json(summary);
  } catch (error) {
    console.error('Error getting spend summary:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /budget/validate
 * Validate a potential spend before recording
 *
 * Body:
 * {
 *   "tripRequestId": "uuid",
 *   "category": "FLIGHT",
 *   "amount": 5000
 * }
 */
budgetRouter.post('/validate', async (req: Request, res: Response) => {
  try {
    const request: ValidateSpendRequest = req.body;

    // Validation
    if (!request.tripRequestId || !request.category || !request.amount) {
      return res.status(400).json({
        error: 'Missing required fields: tripRequestId, category, amount',
      });
    }

    if (request.amount <= 0) {
      return res.status(400).json({
        error: 'Amount must be greater than 0',
      });
    }

    const result = await validateSpend(request);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error validating spend:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /budget/health
 * Health check endpoint
 */
budgetRouter.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'budget-tracking',
    timestamp: new Date().toISOString(),
  });
});
