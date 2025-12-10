import { useEffect, useRef, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import { syncService, LastUpdatedTimestamps } from "../services/sync";
import { DEFAULT_SYNC_CHECK_INTERVAL, MIN_SYNC_CHECK_INTERVAL } from "../constants/sync";

interface UseAutoRefreshOptions {
  /**
   * Callback to refresh data (only called if data has changed)
   */
  onRefresh: () => void | Promise<void>;
  /**
   * Resource type to check for updates ('moments' | 'dates' | 'milestones' | 'all')
   */
  resourceType: "moments" | "dates" | "milestones" | "all";
  /**
   * Whether the screen is currently focused/active
   */
  isFocused?: boolean;
  /**
   * Interval in milliseconds for periodic check (default: 30 seconds)
   * Set to 0 to disable periodic check
   */
  checkInterval?: number;
  /**
   * Whether to check when app comes to foreground (default: true)
   */
  checkOnForeground?: boolean;
}

/**
 * Hook to automatically check for data changes and refresh only when needed:
 * - App comes to foreground
 * - Periodically while app is active
 * Uses lightweight timestamp checks to avoid unnecessary refreshes
 */
export function useAutoRefresh({
  onRefresh,
  resourceType,
  isFocused = true,
  checkInterval = DEFAULT_SYNC_CHECK_INTERVAL,
  checkOnForeground = true,
}: UseAutoRefreshOptions) {
  const appState = useRef(AppState.currentState);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<number>(0);
  const isCheckingRef = useRef<boolean>(false);
  const lastKnownTimestampsRef = useRef<LastUpdatedTimestamps | null>(null);

  // Check if data has changed and refresh if needed
  const checkAndRefresh = useCallback(async () => {
    const now = Date.now();
    // Prevent checking if we just checked recently or already checking
    if (now - lastCheckRef.current < MIN_SYNC_CHECK_INTERVAL || isCheckingRef.current) {
      return;
    }

    isCheckingRef.current = true;
    lastCheckRef.current = now;

    try {
      // Get current timestamps from server
      const currentTimestamps = await syncService.getLastUpdatedTimestamps();

      // If we don't have previous timestamps, store current and refresh
      if (!lastKnownTimestampsRef.current) {
        lastKnownTimestampsRef.current = currentTimestamps;
        await onRefresh();
        return;
      }

      // Check if any relevant resource has been updated
      const hasChanged =
        resourceType === "all"
          ? currentTimestamps.moments !== lastKnownTimestampsRef.current.moments ||
            currentTimestamps.dates !== lastKnownTimestampsRef.current.dates ||
            currentTimestamps.milestones !== lastKnownTimestampsRef.current.milestones
          : currentTimestamps[resourceType] !== lastKnownTimestampsRef.current[resourceType];

      if (hasChanged) {
        // Data has changed, refresh and update stored timestamps
        lastKnownTimestampsRef.current = currentTimestamps;
        await onRefresh();
      }
      // If no change, do nothing - use cached data
    } catch (error) {
      console.error("Auto-refresh check error:", error);
      // On network/API errors, don't refresh unnecessarily
      // Only refresh if it's a critical error (not a network timeout)
      const isNetworkError = error instanceof TypeError || 
        (error as any)?.message?.includes("fetch") ||
        (error as any)?.message?.includes("network");
      
      if (!isNetworkError) {
        // Non-network error might indicate data issue, refresh to be safe
        await onRefresh();
      }
    } finally {
      isCheckingRef.current = false;
    }
  }, [onRefresh, resourceType]);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    if (!checkOnForeground) return;

    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App has come to the foreground - check for changes
        if (isFocused) {
          checkAndRefresh();
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [checkOnForeground, isFocused, checkAndRefresh]);

  // Set up periodic check
  useEffect(() => {
    if (!checkInterval || checkInterval <= 0 || !isFocused) {
      // Clear interval if disabled or screen not focused
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval to check for changes
    intervalRef.current = setInterval(() => {
      if (isFocused && appState.current === "active") {
        checkAndRefresh();
      }
    }, checkInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [checkInterval, isFocused, checkAndRefresh]);
}

