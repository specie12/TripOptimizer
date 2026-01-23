/**
 * Activity Integration
 *
 * Abstraction layer for activity/tour search APIs.
 * Supports mock provider for development and real providers for production.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  ActivityIntegrationProvider,
  ActivitySearchCriteria,
  ActivityResult,
  IntegrationResponse,
  IntegrationStatus,
} from '../types/integration.types';
import { MOCK_ACTIVITIES, ActivityCandidate } from '../config/activities.config';
import { cacheService } from '../services/cache.service';

// =============================================================================
// MOCK ACTIVITY PROVIDER
// =============================================================================

/**
 * Mock activity provider using static activity data
 */
class MockActivityProvider implements ActivityIntegrationProvider {
  name = 'MockActivityProvider';

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async search(criteria: ActivitySearchCriteria): Promise<IntegrationResponse<ActivityResult[]>> {
    // Check cache first
    const cacheKey = {
      destination: criteria.destination,
      categories: criteria.categories,
      maxPrice: criteria.maxPrice,
    };
    const cached = cacheService.get<ActivityResult[]>('activities', cacheKey);

    if (cached) {
      return {
        data: cached,
        provider: this.name,
        status: IntegrationStatus.MOCK,
        cached: true,
        timestamp: new Date(),
      };
    }

    // Get activities for destination
    const activities = MOCK_ACTIVITIES[criteria.destination] || [];

    if (activities.length === 0) {
      return {
        data: [],
        provider: this.name,
        status: IntegrationStatus.MOCK,
        cached: false,
        timestamp: new Date(),
        error: `No activities found for destination ${criteria.destination}`,
      };
    }

    // Convert mock activities to integration format
    const results: ActivityResult[] = activities
      .map((activity) => this.transformMockActivity(activity, criteria.destination))
      .filter((activity) => {
        // Filter by categories if specified
        if (criteria.categories && criteria.categories.length > 0) {
          if (!criteria.categories.includes(activity.category)) {
            return false;
          }
        }
        // Filter by max price if specified
        if (criteria.maxPrice && activity.price > criteria.maxPrice) {
          return false;
        }
        // Filter by min rating if specified
        if (criteria.minRating && activity.rating !== undefined && activity.rating !== null && activity.rating < criteria.minRating) {
          return false;
        }
        // Filter by max duration if specified
        if (criteria.maxDuration && activity.duration > criteria.maxDuration) {
          return false;
        }
        return true;
      })
      .slice(0, criteria.maxResults ?? 20);

    // Cache the results
    cacheService.set('activities', cacheKey, results);

    return {
      data: results,
      provider: this.name,
      status: IntegrationStatus.MOCK,
      cached: false,
      timestamp: new Date(),
    };
  }

  /**
   * Transform mock activity data to integration format
   */
  private transformMockActivity(
    mockActivity: ActivityCandidate,
    destination: string
  ): ActivityResult {
    // Generate availability window (next 90 days)
    const now = new Date();
    const availableFrom = new Date(now);
    const availableTo = new Date(now);
    availableTo.setDate(availableTo.getDate() + 90);

    return {
      id: uuidv4(),
      name: mockActivity.name,
      category: mockActivity.category,
      description: mockActivity.description,
      duration: mockActivity.duration,
      price: mockActivity.price,
      rating: mockActivity.rating || null,
      reviewCount: mockActivity.reviewCount,
      deepLink: mockActivity.deepLink,
      imageUrl: mockActivity.imageUrl,
      availableFrom: availableFrom.toISOString(),
      availableTo: availableTo.toISOString(),
    };
  }
}

// =============================================================================
// ACTIVITY INTEGRATION SERVICE
// =============================================================================

/**
 * Activity integration service with provider fallback
 */
class ActivityIntegrationService {
  private providers: ActivityIntegrationProvider[];
  private currentProvider: ActivityIntegrationProvider;

  constructor() {
    // Initialize with mock provider
    // In production, add real providers here (Viator, GetYourGuide, etc.)
    this.providers = [new MockActivityProvider()];
    this.currentProvider = this.providers[0];
  }

  /**
   * Search for activities using current provider with fallback
   */
  async search(criteria: ActivitySearchCriteria): Promise<IntegrationResponse<ActivityResult[]>> {
    // Try current provider first
    if (await this.currentProvider.isAvailable()) {
      try {
        return await this.currentProvider.search(criteria);
      } catch (error) {
        console.error(`Activity provider ${this.currentProvider.name} failed:`, error);
      }
    }

    // Try fallback providers
    for (const provider of this.providers) {
      if (provider === this.currentProvider) continue;

      if (await provider.isAvailable()) {
        try {
          console.log(`Falling back to activity provider: ${provider.name}`);
          const response = await provider.search(criteria);
          this.currentProvider = provider; // Switch to working provider
          return response;
        } catch (error) {
          console.error(`Activity provider ${provider.name} failed:`, error);
        }
      }
    }

    // All providers failed
    return {
      data: [],
      provider: 'none',
      status: IntegrationStatus.ERROR,
      cached: false,
      timestamp: new Date(),
      error: 'All activity providers unavailable',
    };
  }

  /**
   * Get current provider name
   */
  getProviderName(): string {
    return this.currentProvider.name;
  }

  /**
   * Add a new provider
   */
  addProvider(provider: ActivityIntegrationProvider): void {
    this.providers.push(provider);
  }
}

// Singleton instance
export const activityIntegration = new ActivityIntegrationService();
