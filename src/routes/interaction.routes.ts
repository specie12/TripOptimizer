/**
 * Interaction Routes
 *
 * API endpoints for tracking user interactions.
 * Used to build confidence scores for personalization.
 */

import { Router, Request, Response } from 'express';
import { InteractionType } from '@prisma/client';
import {
  recordInteraction,
  getOrCreateAnonymousUser,
  getUser,
} from '../services/interaction.service';

const router = Router();

/**
 * Valid interaction types
 */
const VALID_INTERACTION_TYPES: InteractionType[] = [
  'VIEW_TRIP_OPTION',
  'EXPAND_EXPLANATION',
  'CLICK_BOOK_FLIGHT',
  'CLICK_BOOK_HOTEL',
  'CHANGE_HOTEL',
];

/**
 * POST /interaction/track
 *
 * Track a user interaction event.
 *
 * Body:
 * - userId: string (optional)
 * - tripOptionId: string (optional)
 * - eventType: InteractionType
 * - metadata: object (optional)
 */
router.post('/track', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, tripOptionId, eventType, metadata } = req.body;

    // Validate eventType
    if (!eventType || !VALID_INTERACTION_TYPES.includes(eventType)) {
      res.status(400).json({
        error: 'invalid_event_type',
        message: `eventType must be one of: ${VALID_INTERACTION_TYPES.join(', ')}`,
      });
      return;
    }

    // Record the interaction
    const event = await recordInteraction(
      userId || null,
      tripOptionId || null,
      eventType as InteractionType,
      metadata
    );

    res.status(201).json({
      eventId: event.id,
      recorded: true,
    });
  } catch (error) {
    console.error('Error tracking interaction:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to track interaction',
    });
  }
});

/**
 * POST /interaction/user
 *
 * Create a new anonymous user and return their ID.
 * Frontend should store this in localStorage for subsequent requests.
 */
router.post('/user', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = await getOrCreateAnonymousUser();
    res.status(201).json({ userId });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to create user',
    });
  }
});

/**
 * GET /interaction/user/:userId
 *
 * Get user information (for debugging only).
 * Does NOT expose inferred preferences.
 */
router.get('/user/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const user = await getUser(userId);

    if (!user) {
      res.status(404).json({
        error: 'not_found',
        message: 'User not found',
      });
      return;
    }

    // Only expose non-sensitive info
    res.json({
      id: user.id,
      createdAt: user.createdAt,
      totalInteractions: user.totalInteractions,
      // Note: confidenceScore and inferredPreferences are NOT exposed
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to fetch user',
    });
  }
});

export default router;
