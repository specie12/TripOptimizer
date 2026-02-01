/**
 * Chat Routes — AI Trip Planning Chatbot
 */

import { Router, Request, Response } from 'express';
import { processMessage } from '../services/chat.service';

const router = Router();

/**
 * POST /chat/message
 *
 * Process a chat message and return the assistant's reply.
 */
router.post('/message', async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, conversationHistory } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({ error: 'Message is required and must be a non-empty string.' });
      return;
    }

    if (!Array.isArray(conversationHistory)) {
      res.status(400).json({ error: 'conversationHistory is required and must be an array.' });
      return;
    }

    const result = await processMessage(message.trim(), conversationHistory);
    res.json(result);
  } catch (error) {
    console.error('Chat route error:', error);
    res.status(500).json({ error: 'Internal server error processing chat message.' });
  }
});

/**
 * GET /chat/health
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

export default router;
