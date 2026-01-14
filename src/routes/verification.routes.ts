/**
 * Verification Routes
 *
 * API endpoints for AI-powered entity verification.
 * Verifies existence and operational status of travel entities.
 */

import { Router, Request, Response } from 'express';
import { validateVerifyRequest } from '../middleware/verification.validation';
import { verifyEntity } from '../services/verification.service';
import {
  VerifyEntityRequest,
  VerifyErrorResponse,
} from '../types/verification.types';

const router = Router();

/**
 * POST /verify/entity
 *
 * Verify existence and operational status of a travel entity.
 *
 * This endpoint:
 * 1. Validates input (entity name required, optional context)
 * 2. Sends entity info to Claude for verification
 * 3. Returns structured verification result
 *
 * IMPORTANT: This agent ONLY verifies.
 * It NEVER suggests alternatives or fabricates data.
 */
router.post(
  '/entity',
  validateVerifyRequest,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const request = req.body as VerifyEntityRequest;

      console.log(
        `Verification request: "${request.entityName}"` +
          (request.entityType ? ` (${request.entityType})` : '') +
          (request.city ? `, ${request.city}` : '') +
          (request.country ? `, ${request.country}` : '')
      );

      const result = await verifyEntity(request);

      console.log(
        `Verification complete: ${result.result.verificationStatus}` +
          `, confidence=${result.result.confidence?.toFixed(2) ?? 'null'}` +
          `, time=${result.meta.processingTimeMs}ms`
      );

      res.status(200).json(result);
    } catch (error) {
      console.error('Verification error:', error);

      const response: VerifyErrorResponse = {
        error: 'verification_error',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to verify entity. Please try again.',
      };

      res.status(500).json(response);
    }
  }
);

/**
 * GET /verify/health
 *
 * Health check endpoint for verification service
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'verification',
    timestamp: new Date().toISOString(),
    mockMode: process.env.MOCK_CLAUDE === 'true',
  });
});

export default router;
