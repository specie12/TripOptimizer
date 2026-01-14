/**
 * AI Verification Agent Type Definitions
 *
 * Types for verifying existence and operational status of travel entities.
 * Follows "UNKNOWN over guess" philosophy - only verify what can be confirmed.
 */

// =============================================================================
// ENUMS
// =============================================================================

/**
 * Type of entity being verified
 */
export type EntityType =
  | 'HOTEL'
  | 'AIRLINE'
  | 'ACTIVITY'
  | 'RESTAURANT'
  | 'TRANSPORT'
  | 'OTHER';

/**
 * Result of verification attempt
 */
export type VerificationStatus = 'VERIFIED' | 'UNVERIFIED' | 'UNKNOWN';

// =============================================================================
// VERIFICATION RESULT STRUCTURE
// =============================================================================

/**
 * Signals gathered during verification
 */
export interface VerificationSignals {
  /** Website resolves and appears functional */
  websiteResolves: boolean | null;
  /** Entity appears to still be operating */
  appearsOperational: boolean | null;
  /** Explicit closure signals detected (permanently closed, out of business) */
  closureSignalDetected: boolean | null;
}

/**
 * Complete verification result for an entity
 */
export interface VerificationResult {
  /** Name of the entity that was verified */
  entityName: string | null;
  /** Overall verification status */
  verificationStatus: VerificationStatus;
  /** Individual verification signals */
  signals: VerificationSignals;
  /** Confidence score (0-1) based on strength of signals */
  confidence: number | null;
  /** Short, factual notes - no speculation or recommendations */
  notes: string | null;
}

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

/**
 * Request body for POST /verify/entity
 */
export interface VerifyEntityRequest {
  /** Name of the entity to verify (required) */
  entityName: string;
  /** Type of entity (helps with verification context) */
  entityType?: EntityType;
  /** Street address */
  address?: string;
  /** City name */
  city?: string;
  /** Country name or code */
  country?: string;
  /** Website URL */
  website?: string;
  /** Optional user ID for tracking */
  userId?: string;
}

/**
 * Processing metadata
 */
export interface VerifyMeta {
  /** Time taken to process in milliseconds */
  processingTimeMs: number;
  /** Model used for verification */
  modelUsed: string;
  /** Whether mock mode was used */
  mockMode: boolean;
}

/**
 * Response body for POST /verify/entity
 */
export interface VerifyEntityResponse {
  /** Whether verification completed successfully */
  success: boolean;
  /** Verification result */
  result: VerificationResult;
  /** Processing metadata */
  meta: VerifyMeta;
}

/**
 * Validation error for verification requests
 */
export interface VerifyValidationError {
  field: string;
  message: string;
}

/**
 * Error response for verification endpoint
 */
export interface VerifyErrorResponse {
  error: string;
  message?: string;
  details?: VerifyValidationError[];
}
