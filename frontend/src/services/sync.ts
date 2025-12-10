import { API_BASE_URL } from "./api";
import { getCachedData, setCachedData } from "../utils/cache";
import { SYNC_TIMESTAMP_CACHE_TTL } from "../constants/sync";

export interface LastUpdatedTimestamps {
  moments: string | null;
  dates: string | null;
  milestones: string | null;
}

const CACHE_KEY_SYNC_TIMESTAMPS = "sync_last_updated_timestamps";
let pendingRequest: Promise<LastUpdatedTimestamps> | null = null;

export const syncService = {
  async getLastUpdatedTimestamps(): Promise<LastUpdatedTimestamps> {
    // Check cache first (lightweight, can cache briefly)
    const cached = await getCachedData<LastUpdatedTimestamps>(CACHE_KEY_SYNC_TIMESTAMPS);
    if (cached !== null) {
      return cached;
    }

    // Deduplicate concurrent requests
    if (pendingRequest) {
      return pendingRequest;
    }

    // Make the request
    pendingRequest = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/sync/last-updated`);

        if (!response.ok) {
          throw new Error(`Failed to fetch last updated timestamps: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Cache the result briefly
        await setCachedData(CACHE_KEY_SYNC_TIMESTAMPS, data, SYNC_TIMESTAMP_CACHE_TTL);
        
        return data;
      } finally {
        // Clear pending request after completion
        pendingRequest = null;
      }
    })();

    return pendingRequest;
  },
};

