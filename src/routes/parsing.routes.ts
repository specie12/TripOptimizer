/**
 * Parsing Routes
 *
 * API endpoints for AI-powered booking data extraction.
 * Extracts structured data from unstructured travel documents.
 */

import { Router, Request, Response } from 'express';
import { validateParseRequest } from '../middleware/parsing.validation';
import { parseBookingContent } from '../services/parsing.service';
import {
  ParseBookingRequest,
  ParseBookingResponse,
  ParseErrorResponse,
} from '../types/parsing.types';

const router = Router();

/**
 * POST /parse/booking
 *
 * Parse unstructured travel booking content and extract structured data.
 *
 * This endpoint:
 * 1. Validates input (content size, document type hint)
 * 2. Sends content to Claude for extraction
 * 3. Normalizes and validates extracted data
 * 4. Returns structured booking data with confidence score
 *
 * IMPORTANT: This agent NEVER fabricates data.
 * Missing information is returned as null.
 */
router.post(
  '/booking',
  validateParseRequest,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { content, documentTypeHint, userId } = req.body as ParseBookingRequest;

      console.log(
        `Parsing request: ${content.length} chars` +
        (documentTypeHint ? `, type hint: ${documentTypeHint}` : '') +
        (userId ? `, user: ${userId}` : '')
      );

      const result = await parseBookingContent(content, documentTypeHint);

      console.log(
        `Parsing complete: confidence=${result.confidence.toFixed(2)}, ` +
        `warnings=${result.warnings.length}, ` +
        `time=${result.meta.processingTimeMs}ms`
      );

      res.status(200).json(result);
    } catch (error) {
      console.error('Parsing error:', error);

      const response: ParseErrorResponse = {
        error: 'parsing_error',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to parse booking content. Please try again.',
      };

      res.status(500).json(response);
    }
  }
);

/**
 * GET /parse/health
 *
 * Health check endpoint for parsing service
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'parsing',
    timestamp: new Date().toISOString(),
    mockMode: process.env.MOCK_CLAUDE === 'true',
  });
});

export default router;
