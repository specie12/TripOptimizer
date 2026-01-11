/**
 * Parsing Input Validation Middleware
 *
 * Validates request bodies for the Parsing API.
 */

import { Request, Response, NextFunction } from 'express';
import {
  ParseBookingRequest,
  ParseValidationError,
  ParseErrorResponse,
  DocumentType,
} from '../types/parsing.types';

// Constants for validation
const MAX_CONTENT_SIZE = 100 * 1024; // 100KB
const MIN_CONTENT_SIZE = 10; // 10 characters
const VALID_DOCUMENT_TYPES: DocumentType[] = ['EMAIL', 'PDF', 'TEXT'];

/**
 * Validate the POST /parse/booking request body
 */
export function validateParseRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const body = req.body as Partial<ParseBookingRequest>;
  const errors: ParseValidationError[] = [];

  // Required: content
  if (!body.content || typeof body.content !== 'string') {
    errors.push({
      field: 'content',
      message: 'content is required and must be a string',
    });
  } else {
    // Check minimum length
    if (body.content.length < MIN_CONTENT_SIZE) {
      errors.push({
        field: 'content',
        message: `content must be at least ${MIN_CONTENT_SIZE} characters`,
      });
    }

    // Check maximum length
    if (body.content.length > MAX_CONTENT_SIZE) {
      errors.push({
        field: 'content',
        message: `content must not exceed ${MAX_CONTENT_SIZE} bytes (100KB)`,
      });
    }
  }

  // Optional: documentTypeHint (if provided, must be valid)
  if (body.documentTypeHint !== undefined && body.documentTypeHint !== null) {
    if (!VALID_DOCUMENT_TYPES.includes(body.documentTypeHint)) {
      errors.push({
        field: 'documentTypeHint',
        message: `documentTypeHint must be one of: ${VALID_DOCUMENT_TYPES.join(', ')}`,
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
    const response: ParseErrorResponse = {
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
