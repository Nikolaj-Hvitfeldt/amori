/**
 * Sync and refresh constants
 */

// Default check interval for data synchronization (30 seconds)
export const DEFAULT_SYNC_CHECK_INTERVAL = 30 * 1000;

// Minimum time between sync checks (prevents rapid-fire requests)
export const MIN_SYNC_CHECK_INTERVAL = 5 * 1000;

// Cache TTL for sync timestamps (1 minute - they're lightweight)
export const SYNC_TIMESTAMP_CACHE_TTL = 60 * 1000;

