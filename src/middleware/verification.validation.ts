/**
 * Verification Input Validation Middleware
 *
 * Validates request bodies for the Verification API.
 */

import { Request, Response, NextFunction } from 'express';
import {
  VerifyEntityRequest,
  VerifyValidationError,
  VerifyErrorResponse,
  EntityType,
} from '../types/verification.types';

// Constants for validation
const MIN_ENTITY_NAME_LENGTH = 2;
const MAX_ENTITY_NAME_LENGTH = 200;
const VALID_ENTITY_TYPES: EntityType[] = [
  'HOTEL',
  'AIRLINE',
  'ACTIVITY',
  'RESTAURANT',
  'TRANSPORT',
  'OTHER',
];

/**
 * Validate the POST /verify/entity request body
 */
export function validateVerifyRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const body = req.body as Partial<VerifyEntityRequest>;
  const errors: VerifyValidationError[] = [];

  // Required: entityName
  if (!body.entityName || typeof body.entityName !== 'string') {
    errors.push({
      field: 'entityName',
      message: 'entityName is required and must be a string',
    });
  } else {
    const trimmedName = body.entityName.trim();

    // Check minimum length
    if (trimmedName.length < MIN_ENTITY_NAME_LENGTH) {
      errors.push({
        field: 'entityName',
        message: `entityName must be at least ${MIN_ENTITY_NAME_LENGTH} characters`,
      });
    }

    // Check maximum length
    if (trimmedName.length > MAX_ENTITY_NAME_LENGTH) {
      errors.push({
        field: 'entityName',
        message: `entityName must not exceed ${MAX_ENTITY_NAME_LENGTH} characters`,
      });
    }
  }

  // Optional: entityType (if provided, must be valid)
  if (body.entityType !== undefined && body.entityType !== null) {
    if (!VALID_ENTITY_TYPES.includes(body.entityType)) {
      errors.push({
        field: 'entityType',
        message: `entityType must be one of: ${VALID_ENTITY_TYPES.join(', ')}`,
      });
    }
  }

  // Optional: address (if provided, must be non-empty string)
  if (body.address !== undefined && body.address !== null) {
    if (typeof body.address !== 'string' || body.address.trim() === '') {
      errors.push({
        field: 'address',
        message: 'address, if provided, must be a non-empty string',
      });
    }
  }

  // Optional: city (if provided, must be non-empty string)
  if (body.city !== undefined && body.city !== null) {
    if (typeof body.city !== 'string' || body.city.trim() === '') {
      errors.push({
        field: 'city',
        message: 'city, if provided, must be a non-empty string',
      });
    }
  }

  // Optional: country (if provided, must be non-empty string)
  if (body.country !== undefined && body.country !== null) {
    if (typeof body.country !== 'string' || body.country.trim() === '') {
      errors.push({
        field: 'country',
        message: 'country, if provided, must be a non-empty string',
      });
    }
  }

  // Optional: website (if provided, must be valid URL format)
  if (body.website !== undefined && body.website !== null) {
    if (typeof body.website !== 'string' || !isValidUrl(body.website)) {
      errors.push({
        field: 'website',
        message: 'website, if provided, must be a valid URL',
      });
    }
  }

  // Optional: userId (if provided, must be non-empty string)
  if (body.userId !== undefined && body.userId !== null) {
    if (typeof body.userId !== 'string' || body.userId.trim() === '') {
      errors.push({
        field: 'userId',
        message: 'userId, if provided, must be a non-empty string',
      });
    }
  }

  // If there are validation errors, return 400
  if (errors.length > 0) {
    const response: VerifyErrorResponse = {
      error: 'validation',
      message: 'Request validation failed',
      details: errors,
    };
    res.status(400).json(response);
    return;
  }

  // Validation passed, continue to next middleware
  next();
}

/**
 * Check if a string is a valid URL
 */
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
