/**
 * Lock-Down Types (Phase 2)
 *
 * Defines types for the lock-down mechanism that prevents re-optimization
 * of user-selected or confirmed bookings.
 */

import { LockStatus } from '@prisma/client';

/**
 * Re-export Prisma's LockStatus enum for convenience
 */
export { LockStatus };

/**
 * Entity types that can be locked
 */
export type LockableEntity = 'trip_option' | 'flight' | 'hotel' | 'activity';

/**
 * Request to lock an entity
 */
export interface LockRequest {
  entityType: LockableEntity;
  entityId: string;
  lockStatus: LockStatus;
}

/**
 * Response from a lock operation
 */
export interface LockResponse {
  success: boolean;
  entityType: LockableEntity;
  entityId: string;
  lockStatus: LockStatus;
  lockedAt?: Date;
  error?: string;
}

/**
 * Lock state for a trip option and its components
 */
export interface TripOptionLockState {
  tripOptionId: string;
  tripOptionLockStatus: LockStatus;
  flightLockStatus?: LockStatus;
  hotelLockStatus?: LockStatus;
  activityLockStatus?: LockStatus; // Future: Phase 3
  isFullyLocked: boolean; // True if all components are LOCKED or CONFIRMED
  isPartiallyLocked: boolean; // True if some components are locked
}

/**
 * Lock validation result
 */
export interface LockValidation {
  canLock: boolean;
  reason?: string;
}

/**
 * Lock-down rules configuration
 */
export interface LockDownRules {
  allowUnlockConfirmed: boolean; // Can CONFIRMED items be unlocked?
  allowReOptimizeLocked: boolean; // Can LOCKED items be re-optimized?
  requireExplicitConfirmation: boolean; // Require user confirmation for CONFIRMED status?
}

/**
 * Default lock-down rules (strict mode)
 */
export const DEFAULT_LOCKDOWN_RULES: LockDownRules = {
  allowUnlockConfirmed: false, // CONFIRMED bookings cannot be unlocked
  allowReOptimizeLocked: false, // LOCKED items protected from re-optimization
  requireExplicitConfirmation: true, // Must explicitly confirm bookings
};
