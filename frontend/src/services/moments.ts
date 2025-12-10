import { API_BASE_URL } from "./api";
import { Moment, CreateMomentDto, UpdateMomentDto } from "../types/moments";
import { getCachedData, setCachedData, invalidateResourceCache } from "../utils/cache";

// Re-export types for backward compatibility
export type { Moment, CreateMomentDto, UpdateMomentDto };

const CACHE_KEY_ALL = "moments_all";
const CACHE_KEY_PREFIX = "moments_";

class MomentsService {
  private baseUrl = `${API_BASE_URL}/moments`;

  async getAllMoments(limit?: number, offset?: number, bypassCache: boolean = false): Promise<{ data: Moment[]; total: number }> {
    try {
      const cacheKey = limit !== undefined || offset !== undefined 
        ? `${CACHE_KEY_ALL}_${limit || 'all'}_${offset || 0}`
        : CACHE_KEY_ALL;
      
      // Check cache first for all requests (unless bypassing)
      if (!bypassCache) {
        const cached = await getCachedData<{ data: Moment[]; total: number }>(cacheKey);
        if (cached !== null) {
          return cached;
        }
      }

      // Build URL with query parameters
      const url = new URL(this.baseUrl);
      if (limit !== undefined) url.searchParams.set("limit", limit.toString());
      if (offset !== undefined) url.searchParams.set("offset", offset.toString());

      // Fetch from API
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Cache the result with 30 minute TTL for all requests
      await setCachedData(cacheKey, result, 30 * 60 * 1000);
      
      return result;
    } catch (error) {
      console.error("Error fetching moments:", error);
      throw error;
    }
  }

  async getMomentById(id: string): Promise<Moment> {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}${id}`;
      
      // Check cache first
      const cached = await getCachedData<Moment>(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Fetch from API
      const response = await fetch(`${this.baseUrl}/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache the result with 30 minute TTL
      await setCachedData(cacheKey, data, 30 * 60 * 1000);
      
      return data;
    } catch (error) {
      console.error("Error fetching moment:", error);
      throw error;
    }
  }

  async createMoment(data: CreateMomentDto): Promise<Moment> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Invalidate cache since we added a new entry
      await invalidateResourceCache("moments");
      
      return result;
    } catch (error) {
      console.error("Error creating moment:", error);
      throw error;
    }
  }

  async updateMoment(id: string, data: UpdateMomentDto): Promise<Moment> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Invalidate cache for this specific entry and the list
      await invalidateResourceCache("moments");
      
      return result;
    } catch (error) {
      console.error("Error updating moment:", error);
      throw error;
    }
  }

  async deleteMoment(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Invalidate cache since we removed an entry
      await invalidateResourceCache("moments");
    } catch (error) {
      console.error("Error deleting moment:", error);
      throw error;
    }
  }
}

export const momentsService = new MomentsService();
