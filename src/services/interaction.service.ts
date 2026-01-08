/**
 * Interaction Service
 *
 * Tracks user interactions and updates confidence scores for personalization.
 *
 * Key responsibilities:
 * 1. Record interaction events
 * 2. Update user confidence scores
 * 3. Trigger preference re-inference when thresholds are met
 */

import { PrismaClient, InteractionType, Prisma } from '@prisma/client';
import {
  calculateConfidenceIncrement,
  updateUserPreferences,
  MIN_INTERACTIONS_FOR_INFERENCE,
} from '../personalization';

const prisma = new PrismaClient();

/**
 * Record a user interaction and update their confidence score
 *
 * @param userId - User ID (optional for anonymous users)
 * @param tripOptionId - ID of the trip option interacted with (optional)
 * @param eventType - Type of interaction
 * @param metadata - Additional event-specific data
 * @returns The created interaction event
 */
export async function recordInteraction(
  userId: string | null,
  tripOptionId: string | null,
  eventType: InteractionType,
  metadata?: Record<string, unknown>
) {
  // Create the interaction event
  const event = await prisma.interactionEvent.create({
    data: {
      userId,
      tripOptionId,
      eventType,
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
    },
  });

  // If user is identified, update their confidence score
  if (userId) {
    await updateUserConfidence(userId, eventType);
  }

  return event;
}

/**
 * Update user's confidence score and trigger preference inference if needed
 *
 * @param userId - User ID
 * @param interactionType - Type of interaction that occurred
 */
async function updateUserConfidence(
  userId: string,
  interactionType: InteractionType
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    console.warn(`User ${userId} not found for confidence update`);
    return;
  }

  // Calculate new confidence score
  const newConfidenceScore = calculateConfidenceIncrement(
    user.confidenceScore,
    interactionType
  );

  const newTotalInteractions = user.totalInteractions + 1;

  // Update user
  await prisma.user.update({
    where: { id: userId },
    data: {
      confidenceScore: newConfidenceScore,
      totalInteractions: newTotalInteractions,
      lastSeenAt: new Date(),
    },
  });

  console.log(
    `User ${userId} confidence: ${user.confidenceScore.toFixed(3)} -> ${newConfidenceScore.toFixed(3)} ` +
    `(${interactionType}, total: ${newTotalInteractions})`
  );

  // Check if we should update inferred preferences
  // Only re-infer every 5 interactions after reaching minimum threshold
  if (
    newTotalInteractions >= MIN_INTERACTIONS_FOR_INFERENCE &&
    newTotalInteractions % 5 === 0
  ) {
    console.log(`Triggering preference re-inference for user ${userId}`);
    try {
      await updateUserPreferences(userId);
    } catch (error) {
      console.error(`Failed to update preferences for user ${userId}:`, error);
    }
  }
}

/**
 * Get or create an anonymous user
 *
 * @returns User ID
 */
export async function getOrCreateAnonymousUser(): Promise<string> {
  const user = await prisma.user.create({
    data: {},
  });
  return user.id;
}

/**
 * Get user by ID
 *
 * @param userId - User ID
 * @returns User or null
 */
export async function getUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
  });
}

/**
 * Get user interaction history
 *
 * @param userId - User ID
 * @param limit - Maximum number of events to return
 * @returns Interaction events
 */
export async function getUserInteractions(userId: string, limit: number = 50) {
  return prisma.interactionEvent.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      tripOption: {
        select: {
          destination: true,
          score: true,
        },
      },
    },
  });
}
