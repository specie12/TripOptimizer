/**
 * Lock-Down Service (Phase 2)
 *
 * Manages the lock-down mechanism for protecting user-selected bookings
 * from re-optimization.
 *
 * Rules:
 * - UNLOCKED: Can be freely re-optimized or changed
 * - LOCKED: User has selected this option, protected from automatic re-optimization
 * - CONFIRMED: Booking is confirmed, immutable (cannot be unlocked or changed)
 */

import { PrismaClient, LockStatus } from '@prisma/client';
import {
  LockRequest,
  LockResponse,
  LockableEntity,
  TripOptionLockState,
  LockValidation,
  LockDownRules,
  DEFAULT_LOCKDOWN_RULES,
} from '../types/lockdown.types';

const prisma = new PrismaClient();

/**
 * Lock an entity (trip option, flight, hotel, or activity)
 */
export async function lockEntity(
  request: LockRequest,
  rules: LockDownRules = DEFAULT_LOCKDOWN_RULES
): Promise<LockResponse> {
  const { entityType, entityId, lockStatus } = request;

  try {
    // Validate the lock operation
    const validation = await validateLockOperation(entityType, entityId, lockStatus, rules);
    if (!validation.canLock) {
      return {
        success: false,
        entityType,
        entityId,
        lockStatus,
        error: validation.reason,
      };
    }

    // Perform the lock operation based on entity type
    const lockedAt = new Date();
    let result;

    switch (entityType) {
      case 'trip_option':
        result = await prisma.tripOption.update({
          where: { id: entityId },
          data: { lockStatus, lockedAt },
        });
        break;

      case 'flight':
        result = await prisma.flightOption.update({
          where: { id: entityId },
          data: { lockStatus, lockedAt },
        });
        break;

      case 'hotel':
        result = await prisma.hotelOption.update({
          where: { id: entityId },
          data: { lockStatus, lockedAt },
        });
        break;

      case 'activity':
        // Future: Phase 3 - Activity options
        return {
          success: false,
          entityType,
          entityId,
          lockStatus,
          error: 'Activity lock-down not yet implemented (Phase 3)',
        };

      default:
        return {
          success: false,
          entityType,
          entityId,
          lockStatus,
          error: `Unknown entity type: ${entityType}`,
        };
    }

    return {
      success: true,
      entityType,
      entityId,
      lockStatus: result.lockStatus,
      lockedAt: result.lockedAt || undefined,
    };
  } catch (error) {
    return {
      success: false,
      entityType,
      entityId,
      lockStatus,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Unlock an entity (if rules allow)
 */
export async function unlockEntity(
  entityType: LockableEntity,
  entityId: string,
  rules: LockDownRules = DEFAULT_LOCKDOWN_RULES
): Promise<LockResponse> {
  return lockEntity(
    { entityType, entityId, lockStatus: LockStatus.UNLOCKED },
    rules
  );
}

/**
 * Validate a lock operation
 */
async function validateLockOperation(
  entityType: LockableEntity,
  entityId: string,
  newLockStatus: LockStatus,
  rules: LockDownRules
): Promise<LockValidation> {
  try {
    // Get current lock status
    let currentLockStatus: LockStatus | undefined;

    switch (entityType) {
      case 'trip_option': {
        const tripOption = await prisma.tripOption.findUnique({
          where: { id: entityId },
          select: { lockStatus: true },
        });
        currentLockStatus = tripOption?.lockStatus;
        break;
      }

      case 'flight': {
        const flight = await prisma.flightOption.findUnique({
          where: { id: entityId },
          select: { lockStatus: true },
        });
        currentLockStatus = flight?.lockStatus;
        break;
      }

      case 'hotel': {
        const hotel = await prisma.hotelOption.findUnique({
          where: { id: entityId },
          select: { lockStatus: true },
        });
        currentLockStatus = hotel?.lockStatus;
        break;
      }

      case 'activity':
        return { canLock: false, reason: 'Activity lock-down not yet implemented (Phase 3)' };

      default:
        return { canLock: false, reason: `Unknown entity type: ${entityType}` };
    }

    if (!currentLockStatus) {
      return { canLock: false, reason: `Entity not found: ${entityId}` };
    }

    // Rule: Cannot unlock CONFIRMED items (unless rules allow)
    if (
      currentLockStatus === LockStatus.CONFIRMED &&
      newLockStatus !== LockStatus.CONFIRMED &&
      !rules.allowUnlockConfirmed
    ) {
      return {
        canLock: false,
        reason: 'Cannot unlock a confirmed booking. Cancel the booking first.',
      };
    }

    // Rule: Require explicit confirmation for CONFIRMED status
    if (
      newLockStatus === LockStatus.CONFIRMED &&
      rules.requireExplicitConfirmation &&
      currentLockStatus === LockStatus.UNLOCKED
    ) {
      return {
        canLock: false,
        reason: 'Must lock item before confirming. Use LOCKED status first.',
      };
    }

    return { canLock: true };
  } catch (error) {
    return {
      canLock: false,
      reason: error instanceof Error ? error.message : 'Validation error',
    };
  }
}

/**
 * Get the lock state for a trip option and all its components
 */
export async function getTripOptionLockState(
  tripOptionId: string
): Promise<TripOptionLockState | null> {
  try {
    const tripOption = await prisma.tripOption.findUnique({
      where: { id: tripOptionId },
      include: {
        flightOption: { select: { lockStatus: true } },
        hotelOption: { select: { lockStatus: true } },
      },
    });

    if (!tripOption) {
      return null;
    }

    const flightLockStatus = tripOption.flightOption?.lockStatus;
    const hotelLockStatus = tripOption.hotelOption?.lockStatus;

    // Determine if trip is fully or partially locked
    const lockStatuses = [
      tripOption.lockStatus,
      flightLockStatus,
      hotelLockStatus,
    ].filter((status): status is LockStatus => status !== undefined);

    const isFullyLocked = lockStatuses.every(
      (status) => status === LockStatus.LOCKED || status === LockStatus.CONFIRMED
    );

    const isPartiallyLocked = lockStatuses.some(
      (status) => status === LockStatus.LOCKED || status === LockStatus.CONFIRMED
    );

    return {
      tripOptionId,
      tripOptionLockStatus: tripOption.lockStatus,
      flightLockStatus,
      hotelLockStatus,
      isFullyLocked,
      isPartiallyLocked,
    };
  } catch (error) {
    console.error('Error getting trip option lock state:', error);
    return null;
  }
}

/**
 * Get all locked items for a trip request
 */
export async function getLockedItemsForTripRequest(
  tripRequestId: string
): Promise<TripOptionLockState[]> {
  try {
    const tripOptions = await prisma.tripOption.findMany({
      where: { tripRequestId },
      include: {
        flightOption: { select: { lockStatus: true } },
        hotelOption: { select: { lockStatus: true } },
      },
    });

    const lockStates: TripOptionLockState[] = [];

    for (const tripOption of tripOptions) {
      const flightLockStatus = tripOption.flightOption?.lockStatus;
      const hotelLockStatus = tripOption.hotelOption?.lockStatus;

      const lockStatuses = [
        tripOption.lockStatus,
        flightLockStatus,
        hotelLockStatus,
      ].filter((status): status is LockStatus => status !== undefined);

      const isFullyLocked = lockStatuses.every(
        (status) => status === LockStatus.LOCKED || status === LockStatus.CONFIRMED
      );

      const isPartiallyLocked = lockStatuses.some(
        (status) => status === LockStatus.LOCKED || status === LockStatus.CONFIRMED
      );

      lockStates.push({
        tripOptionId: tripOption.id,
        tripOptionLockStatus: tripOption.lockStatus,
        flightLockStatus,
        hotelLockStatus,
        isFullyLocked,
        isPartiallyLocked,
      });
    }

    return lockStates;
  } catch (error) {
    console.error('Error getting locked items for trip request:', error);
    return [];
  }
}

/**
 * Check if a trip option can be re-optimized (not locked or confirmed)
 */
export function canReOptimize(lockState: TripOptionLockState, rules: LockDownRules = DEFAULT_LOCKDOWN_RULES): boolean {
  // If rules allow re-optimization of locked items, only check for CONFIRMED
  if (rules.allowReOptimizeLocked) {
    return lockState.tripOptionLockStatus !== LockStatus.CONFIRMED;
  }

  // Default: Cannot re-optimize if any component is LOCKED or CONFIRMED
  return !lockState.isPartiallyLocked;
}
