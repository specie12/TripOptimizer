/**
 * Cache Service
 *
 * Simple in-memory cache for API integration responses.
 */

import { CacheEntry, CacheConfig } from '../types/integration.types';

/**
 * Default cache configuration
 */
const DEFAULT_CONFIG: CacheConfig = {
  enabled: true,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000,
};

/**
 * In-memory cache service
 */
class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate cache key from object
   */
  private generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}=${JSON.stringify(params[key])}`)
      .join('&');
    return `${prefix}:${sortedParams}`;
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    const now = new Date().getTime();
    const cachedAt = entry.cachedAt.getTime();
    return now - cachedAt > entry.ttl;
  }

  /**
   * Get cached data
   */
  get<T>(prefix: string, params: Record<string, any>): T | null {
    if (!this.config.enabled) {
      return null;
    }

    const key = this.generateKey(prefix, params);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cached data
   */
  set<T>(prefix: string, params: Record<string, any>, data: T, ttl?: number): void {
    if (!this.config.enabled) {
      return;
    }

    // Enforce max cache size (LRU-style eviction)
    if (this.cache.size >= this.config.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const key = this.generateKey(prefix, params);
    const entry: CacheEntry<T> = {
      data,
      cachedAt: new Date(),
      ttl: ttl ?? this.config.defaultTTL,
    };

    this.cache.set(key, entry);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear cache entries matching prefix
   */
  clearByPrefix(prefix: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; enabled: boolean } {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      enabled: this.config.enabled,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
  }
}

// Singleton instance
export const cacheService = new CacheService();

// Run cleanup every 10 minutes
setInterval(() => {
  cacheService.cleanup();
}, 10 * 60 * 1000);
