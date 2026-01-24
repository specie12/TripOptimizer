/**
 * Input Validation Middleware
 *
 * Validates request bodies for the Trip Generation API.
 */

import { Request, Response, NextFunction } from 'express';
import { GenerateTripRequest, ValidationError, ApiErrorResponse } from '../types/api.types';

/**
 * Validate the POST /trip/generate request body
 */
export function validateGenerateTripRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const body = req.body as Partial<GenerateTripRequest>;
  const errors: ValidationError[] = [];

  // Required: originCity
  if (!body.originCity || typeof body.originCity !== 'string' || body.originCity.trim() === '') {
    errors.push({
      field: 'originCity',
      message: 'originCity is required and must be a non-empty string',
    });
  }

  // Required: numberOfDays
  if (body.numberOfDays === undefined || body.numberOfDays === null) {
    errors.push({
      field: 'numberOfDays',
      message: 'numberOfDays is required',
    });
  } else if (
    typeof body.numberOfDays !== 'number' ||
    !Number.isInteger(body.numberOfDays) ||
    body.numberOfDays < 1 ||
    body.numberOfDays > 30
  ) {
    errors.push({
      field: 'numberOfDays',
      message: 'numberOfDays must be an integer between 1 and 30',
    });
  }

  // Required: budgetTotal
  if (body.budgetTotal === undefined || body.budgetTotal === null) {
    errors.push({
      field: 'budgetTotal',
      message: 'budgetTotal is required',
    });
  } else if (
    typeof body.budgetTotal !== 'number' ||
    !Number.isInteger(body.budgetTotal) ||
    body.budgetTotal < 10000
  ) {
    errors.push({
      field: 'budgetTotal',
      message: 'budgetTotal must be an integer >= 10000 (minimum $100)',
    });
  }

  // Required: travelStyle
  if (!body.travelStyle) {
    errors.push({
      field: 'travelStyle',
      message: 'travelStyle is required',
    });
  } else if (!['BUDGET', 'MID_RANGE', 'BALANCED', 'LUXURY'].includes(body.travelStyle)) {
    errors.push({
      field: 'travelStyle',
      message: 'travelStyle must be one of: "BUDGET", "MID_RANGE", "BALANCED", or "LUXURY"',
    });
  }

  // Optional: destination (if provided, must be non-empty string)
  if (body.destination !== undefined && body.destination !== null) {
    if (typeof body.destination !== 'string' || body.destination.trim() === '') {
      errors.push({
        field: 'destination',
        message: 'destination, if provided, must be a non-empty string',
      });
    }
  }

  // Optional: startDate (if provided, must be valid ISO date)
  if (body.startDate !== undefined && body.startDate !== null) {
    if (typeof body.startDate !== 'string' || !isValidISODate(body.startDate)) {
      errors.push({
        field: 'startDate',
        message: 'startDate, if provided, must be a valid ISO 8601 date string',
      });
    } else {
      const startDate = new Date(body.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (startDate < today) {
        errors.push({
          field: 'startDate',
          message: 'startDate cannot be in the past',
        });
      }
    }
  }

  // Optional: endDate (if provided, must be valid ISO date)
  if (body.endDate !== undefined && body.endDate !== null) {
    if (typeof body.endDate !== 'string' || !isValidISODate(body.endDate)) {
      errors.push({
        field: 'endDate',
        message: 'endDate, if provided, must be a valid ISO 8601 date string',
      });
    }
  }

  // Cross-field validation: endDate must be after startDate
  if (body.startDate && body.endDate && errors.length === 0) {
    const start = new Date(body.startDate);
    const end = new Date(body.endDate);
    if (end <= start) {
      errors.push({
        field: 'endDate',
        message: 'endDate must be after startDate',
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

  // Optional: tripPace (Phase 7)
  if (body.tripPace !== undefined && body.tripPace !== null) {
    if (!['RELAXED', 'BALANCED', 'PACKED'].includes(body.tripPace)) {
      errors.push({
        field: 'tripPace',
        message: 'tripPace, if provided, must be one of: "RELAXED", "BALANCED", or "PACKED"',
      });
    }
  }

  // Optional: accommodationType (Phase 7)
  if (body.accommodationType !== undefined && body.accommodationType !== null) {
    if (!['HOTELS', 'AIRBNB', 'RESORTS', 'HOSTELS'].includes(body.accommodationType)) {
      errors.push({
        field: 'accommodationType',
        message: 'accommodationType, if provided, must be one of: "HOTELS", "AIRBNB", "RESORTS", or "HOSTELS"',
      });
    }
  }

  // Optional: interests (Phase 7)
  if (body.interests !== undefined && body.interests !== null) {
    if (!Array.isArray(body.interests)) {
      errors.push({
        field: 'interests',
        message: 'interests, if provided, must be an array',
      });
    } else {
      const validInterests = [
        'CULTURE_HISTORY',
        'FOOD_DINING',
        'ADVENTURE',
        'BEACH_RELAXATION',
        'NIGHTLIFE',
        'NATURE_WILDLIFE',
        'SHOPPING',
        'ART_MUSEUMS',
      ];
      const invalidInterests = body.interests.filter((i) => !validInterests.includes(i));
      if (invalidInterests.length > 0) {
        errors.push({
          field: 'interests',
          message: `interests contains invalid values: ${invalidInterests.join(', ')}`,
        });
      }
    }
  }

  // If there are validation errors, return 400
  if (errors.length > 0) {
    const response: ApiErrorResponse = {
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
 * Check if a string is a valid ISO 8601 date
 */
function isValidISODate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Generic error handler middleware
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Unhandled error:', err);

  const response: ApiErrorResponse = {
    error: 'internal_error',
    message: process.env.NODE_ENV === 'development'
      ? err.message
      : 'An internal error occurred',
  };

  res.status(500).json(response);
}
