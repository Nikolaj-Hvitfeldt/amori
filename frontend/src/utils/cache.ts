import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Cache configuration
const CACHE_PREFIX = "amori_cache_";
const DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds (default for dates/moments)

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Platform-specific storage
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      return localStorage.getItem(key);
    }
    return await AsyncStorage.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
      return;
    }
    await AsyncStorage.setItem(key, value);
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
      return;
    }
    await AsyncStorage.removeItem(key);
  },

  async clear(): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.clear();
      return;
    }
    await AsyncStorage.clear();
  },
};

/**
 * Get cached data if it exists and hasn't expired
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const cached = await storage.getItem(cacheKey);

    if (!cached) {
      return null;
    }

    const entry: CacheEntry<T> = JSON.parse(cached);
    const now = Date.now();
    const age = now - entry.timestamp;

    // Check if cache has expired
    if (age > entry.ttl) {
      // Cache expired, remove it
      await storage.removeItem(cacheKey);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.warn(`Error reading cache for key ${key}:`, error);
    return null;
  }
}

/**
 * Store data in cache with optional TTL
 */
export async function setCachedData<T>(
  key: string,
  data: T,
  ttl: number = DEFAULT_TTL
): Promise<void> {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    await storage.setItem(cacheKey, JSON.stringify(entry));
  } catch (error) {
    console.warn(`Error writing cache for key ${key}:`, error);
    // Don't throw - caching failures shouldn't break the app
  }
}

/**
 * Remove cached data for a specific key
 */
export async function invalidateCache(key: string): Promise<void> {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    await storage.removeItem(cacheKey);
  } catch (error) {
    console.warn(`Error invalidating cache for key ${key}:`, error);
  }
}

/**
 * Invalidate all caches for a specific resource type (e.g., 'dates', 'moments', 'milestones')
 */
export async function invalidateResourceCache(resourceType: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      // On web, iterate through localStorage keys
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${CACHE_PREFIX}${resourceType}_`)) {
          keys.push(key);
        }
      }
      keys.forEach((key) => localStorage.removeItem(key));
    } else {
      // On native, get all keys and filter
      const allKeys = await AsyncStorage.getAllKeys();
      const keysToRemove = allKeys.filter((key) =>
        key.startsWith(`${CACHE_PREFIX}${resourceType}_`)
      );
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
      }
    }
  } catch (error) {
    console.warn(`Error invalidating resource cache for ${resourceType}:`, error);
  }
}

/**
 * Clear all cached data
 */
export async function clearAllCache(): Promise<void> {
  try {
    if (Platform.OS === "web") {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX)) {
          keys.push(key);
        }
      }
      keys.forEach((key) => localStorage.removeItem(key));
    } else {
      const allKeys = await AsyncStorage.getAllKeys();
      const keysToRemove = allKeys.filter((key) => key.startsWith(CACHE_PREFIX));
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
      }
    }
  } catch (error) {
    console.warn("Error clearing all cache:", error);
  }
}

