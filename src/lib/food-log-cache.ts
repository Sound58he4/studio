// src/lib/food-log-cache.ts
'use client';

import { StoredFoodLogEntry, DailyNutritionSummary } from '@/app/dashboard/types';
import { format, startOfDay, endOfDay, parseISO } from 'date-fns';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface NutritionCache {
  [key: string]: CacheEntry<any>;
}

// Cache configuration
const CACHE_CONFIG = {
  // Cache durations in milliseconds
  DAILY_LOGS: 10 * 60 * 1000, // 10 minutes
  NUTRITION_SUMMARY: 15 * 60 * 1000, // 15 minutes
  RECENT_ITEMS: 30 * 60 * 1000, // 30 minutes
  AI_ESTIMATES: 60 * 60 * 1000, // 1 hour
  
  // Storage keys
  PREFIX: 'bago-food-cache-',
  
  // Cache size limits
  MAX_DAILY_LOGS: 100,
  MAX_AI_ESTIMATES: 50,
  MAX_RECENT_ITEMS: 20,
};

class FoodLogCacheManager {
  private cache: NutritionCache = {};
  private isClient = typeof window !== 'undefined';

  constructor() {
    if (this.isClient) {
      this.loadFromStorage();
      this.startCleanupInterval();
    }
  }

  // Get cache key for different data types
  private getCacheKey(type: string, userId: string, date?: Date | string): string {
    let dateStr = '';
    
    // Only format as date if it's actually a Date object or valid date string
    if (date) {
      try {
        if (date instanceof Date) {
          dateStr = format(date, 'yyyy-MM-dd');
        } else if (typeof date === 'string') {
          // Check if it's a date string or just a regular string (like food description)
          const parsedDate = new Date(date);
          if (!isNaN(parsedDate.getTime()) && date.includes('-') && date.length >= 8) {
            // Looks like a date string
            dateStr = format(parsedDate, 'yyyy-MM-dd');
          } else {
            // It's a regular string (like food description), use it directly
            dateStr = date.toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
          }
        }
      } catch (error) {
        console.warn('[Food Cache] Invalid date provided for cache key:', date);
        // Fallback: treat as string
        dateStr = String(date).toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
      }
    }
    
    return `${CACHE_CONFIG.PREFIX}${type}-${userId}${dateStr ? `-${dateStr}` : ''}`;
  }

  // Store data in cache with expiration
  private setCache<T>(key: string, data: T, duration: number): void {
    const now = Date.now();
    this.cache[key] = {
      data,
      timestamp: now,
      expiresAt: now + duration,
    };
    
    if (this.isClient) {
      try {
        localStorage.setItem(key, JSON.stringify(this.cache[key]));
      } catch (error) {
        console.warn('[Food Cache] Failed to save to localStorage:', error);
        this.cleanup(); // Try to free up space
      }
    }
  }

  // Get data from cache if valid
  private getCache<T>(key: string): T | null {
    let entry = this.cache[key];
    
    // Try to load from localStorage if not in memory
    if (!entry && this.isClient) {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          entry = JSON.parse(stored);
          this.cache[key] = entry;
        }
      } catch (error) {
        console.warn('[Food Cache] Failed to parse cached data for key:', key, error);
        this.clearCacheKey(key);
        return null;
      }
    }

    if (!entry) return null;

    // Check if expired
    try {
      if (Date.now() > entry.expiresAt) {
        this.clearCacheKey(key);
        return null;
      }
    } catch (error) {
      console.warn('[Food Cache] Error checking expiration for key:', key, error);
      this.clearCacheKey(key);
      return null;
    }

    return entry.data as T;
  }

  // Clear specific cache key
  private clearCacheKey(key: string): void {
    delete this.cache[key];
    if (this.isClient) {
      localStorage.removeItem(key);
    }
  }

  // Daily food logs cache
  cacheDailyLogs(userId: string, date: Date, logs: StoredFoodLogEntry[]): void {
    const key = this.getCacheKey('daily-logs', userId, date);
    // Sort by timestamp for consistency
    const sortedLogs = logs.sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime());
    this.setCache(key, sortedLogs, CACHE_CONFIG.DAILY_LOGS);
  }

  getCachedDailyLogs(userId: string, date: Date): StoredFoodLogEntry[] | null {
    const key = this.getCacheKey('daily-logs', userId, date);
    return this.getCache<StoredFoodLogEntry[]>(key);
  }

  // Add new log to existing cache
  addLogToCache(userId: string, date: Date, newLog: StoredFoodLogEntry): void {
    const key = this.getCacheKey('daily-logs', userId, date);
    const existingLogs = this.getCache<StoredFoodLogEntry[]>(key) || [];
    
    // Add new log and maintain sort order
    const updatedLogs = [newLog, ...existingLogs]
      .sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime())
      .slice(0, CACHE_CONFIG.MAX_DAILY_LOGS); // Limit cache size
    
    this.setCache(key, updatedLogs, CACHE_CONFIG.DAILY_LOGS);
  }

  // Nutrition summary cache
  cacheNutritionSummary(userId: string, date: Date, summary: DailyNutritionSummary): void {
    const key = this.getCacheKey('nutrition-summary', userId, date);
    this.setCache(key, summary, CACHE_CONFIG.NUTRITION_SUMMARY);
  }

  getCachedNutritionSummary(userId: string, date: Date): DailyNutritionSummary | null {
    const key = this.getCacheKey('nutrition-summary', userId, date);
    return this.getCache<DailyNutritionSummary>(key);
  }

  // Recent items cache
  cacheRecentItems(userId: string, items: StoredFoodLogEntry[]): void {
    const key = this.getCacheKey('recent-items', userId);
    const limitedItems = items.slice(0, CACHE_CONFIG.MAX_RECENT_ITEMS);
    this.setCache(key, limitedItems, CACHE_CONFIG.RECENT_ITEMS);
  }

  getCachedRecentItems(userId: string): StoredFoodLogEntry[] | null {
    const key = this.getCacheKey('recent-items', userId);
    return this.getCache<StoredFoodLogEntry[]>(key);
  }

  // AI nutrition estimates cache - use a different method to avoid date confusion
  async cacheAIEstimate(foodDescription: string, result: CachedAIResult): Promise<void> {
    try {
      const key = this.generateCacheKey(foodDescription);
      const cacheEntry: CacheEntry<CachedAIResult> = {
        data: result,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.AI_CACHE_DURATION
      };
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(cacheEntry));
        console.log(`[FoodLogCache] Cached AI estimate for: ${foodDescription}`);
      }
    } catch (error) {
      console.error('[FoodLogCache] Error caching AI estimate:', error);
    }
  }

  async getCachedAIEstimate(foodDescription: string): Promise<CachedAIResult | null> {
    try {
      const key = this.generateCacheKey(foodDescription);
      
      if (typeof window === 'undefined') return null;
      
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      
      const entry: CacheEntry<CachedAIResult> = JSON.parse(cached);
      
      if (Date.now() > entry.expiresAt) {
        localStorage.removeItem(key);
        return null;
      }
      
      console.log(`[FoodLogCache] Cache hit for: ${foodDescription}`);
      return entry.data;
    } catch (error) {
      console.error('[FoodLogCache] Error getting cached AI estimate:', error);
      return null;
    }
  }

  // Bulk operations for performance
  bulkCacheDailyLogs(userId: string, logsByDate: { [date: string]: StoredFoodLogEntry[] }): void {
    Object.entries(logsByDate).forEach(([dateStr, logs]) => {
      const date = parseISO(dateStr);
      this.cacheDailyLogs(userId, date, logs);
    });
  }

  // Cache invalidation
  invalidateUserCache(userId: string): void {
    const keysToRemove = Object.keys(this.cache).filter(key => key.includes(userId));
    keysToRemove.forEach(key => this.clearCacheKey(key));
    
    if (this.isClient) {
      // Clean localStorage as well
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.includes(CACHE_CONFIG.PREFIX) && key.includes(userId)) {
          localStorage.removeItem(key);
        }
      }
    }
  }

  invalidateDateCache(userId: string, date: Date): void {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const keysToRemove = Object.keys(this.cache).filter(key => 
        key.includes(userId) && key.includes(dateStr)
      );
      keysToRemove.forEach(key => this.clearCacheKey(key));
    } catch (error) {
      console.warn('[Food Cache] Error invalidating date cache:', error);
      // Fallback: invalidate all user cache
      this.invalidateUserCache(userId);
    }
  }

  // Maintenance operations
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys = Object.keys(this.cache).filter(key => 
      this.cache[key] && this.cache[key].expiresAt < now
    );
    
    expiredKeys.forEach(key => this.clearCacheKey(key));
    
    // If cache is still too large, remove oldest entries
    const cacheSize = Object.keys(this.cache).length;
    if (cacheSize > 100) {
      const sortedEntries = Object.entries(this.cache)
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = sortedEntries.slice(0, Math.floor(cacheSize * 0.3));
      toRemove.forEach(([key]) => this.clearCacheKey(key));
    }
  }

  private loadFromStorage(): void {
    if (!this.isClient) return;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_CONFIG.PREFIX)) {
        try {
          const entry = JSON.parse(localStorage.getItem(key) || '');
          if (entry && entry.expiresAt > Date.now()) {
            this.cache[key] = entry;
          } else {
            localStorage.removeItem(key);
          }
        } catch (error) {
          localStorage.removeItem(key);
        }
      }
    }
  }

  private startCleanupInterval(): void {
    if (!this.isClient) return;
    
    // Clean up every 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  // Get cache statistics
  getCacheStats(): { totalKeys: number; memoryKeys: number; storageKeys: number; } {
    if (!this.isClient) {
      return { totalKeys: 0, memoryKeys: 0, storageKeys: 0 };
    }

    const memoryKeys = Object.keys(this.cache).length;
    let storageKeys = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_CONFIG.PREFIX)) {
        storageKeys++;
      }
    }
    
    return {
      totalKeys: Math.max(memoryKeys, storageKeys),
      memoryKeys,
      storageKeys,
    };
  }

  // Clear all cache
  clearAll(): void {
    this.cache = {};
    if (typeof window !== 'undefined') {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_CONFIG.PREFIX)) {
          localStorage.removeItem(key);
        }
      }
    }
  }
}

// Singleton instance
export const foodLogCache = new FoodLogCacheManager();

// Utility functions for common operations
export const FoodCacheUtils = {
  // Get today's cached logs
  getTodaysLogs(userId: string): StoredFoodLogEntry[] | null {
    return foodLogCache.getCachedDailyLogs(userId, startOfDay(new Date()));
  },

  // Cache today's logs
  cacheTodaysLogs(userId: string, logs: StoredFoodLogEntry[]): void {
    foodLogCache.cacheDailyLogs(userId, startOfDay(new Date()), logs);
  },

  // Add log to today's cache
  addLogToToday(userId: string, log: StoredFoodLogEntry): void {
    foodLogCache.addLogToCache(userId, startOfDay(new Date()), log);
  },

  // Get cached summary for today
  getTodaysSummary(userId: string): DailyNutritionSummary | null {
    return foodLogCache.getCachedNutritionSummary(userId, startOfDay(new Date()));
  },

  // Calculate nutrition summary from logs
  calculateSummaryFromLogs(logs: StoredFoodLogEntry[]): DailyNutritionSummary {
    const summary = logs.reduce(
      (acc, log) => ({
        totalCalories: acc.totalCalories + (log.calories || 0),
        totalProtein: acc.totalProtein + (log.protein || 0),
        totalCarbohydrates: acc.totalCarbohydrates + (log.carbohydrates || 0),
        totalFat: acc.totalFat + (log.fat || 0),
        entryCount: acc.entryCount + 1,
      }),
      {
        totalCalories: 0,
        totalProtein: 0,
        totalCarbohydrates: 0,
        totalFat: 0,
        entryCount: 0,
        lastUpdated: new Date().toISOString(),
      }
    );

    return {
      ...summary,
      totalCalories: Math.round(summary.totalCalories),
      totalProtein: parseFloat(summary.totalProtein.toFixed(1)),
      totalCarbohydrates: parseFloat(summary.totalCarbohydrates.toFixed(1)),
      totalFat: parseFloat(summary.totalFat.toFixed(1)),
    };
  },
};
