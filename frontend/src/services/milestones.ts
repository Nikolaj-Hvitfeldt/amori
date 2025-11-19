import {
  Milestone,
  CreateMilestoneDto,
  UpdateMilestoneDto,
} from "../types/milestones";
import { API_BASE_URL } from "./api";
import { getCachedData, setCachedData, invalidateResourceCache } from "../utils/cache";

const CACHE_KEY_ALL = "milestones_all";
const CACHE_KEY_PREFIX = "milestones_";

export const milestonesService = {
  async getAll(limit?: number, offset?: number): Promise<{ data: Milestone[]; total: number }> {
    const cacheKey = limit !== undefined || offset !== undefined 
      ? `${CACHE_KEY_ALL}_${limit || 'all'}_${offset || 0}`
      : CACHE_KEY_ALL;
    
    // Check cache first for all requests
    const cached = await getCachedData<{ data: Milestone[]; total: number }>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Build URL with query parameters
    const url = new URL(`${API_BASE_URL}/milestones`);
    if (limit !== undefined) url.searchParams.set("limit", limit.toString());
    if (offset !== undefined) url.searchParams.set("offset", offset.toString());

    // Fetch from API
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Failed to fetch milestones: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Cache the result with 1 hour TTL (milestones change less frequently) for all requests
    await setCachedData(cacheKey, result, 60 * 60 * 1000);
    
    return result;
  },

  async getById(id: string): Promise<Milestone> {
    const cacheKey = `${CACHE_KEY_PREFIX}${id}`;
    
    // Check cache first
    const cached = await getCachedData<Milestone>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Fetch from API
    const response = await fetch(`${API_BASE_URL}/milestones/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch milestone: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Cache the result with 1 hour TTL (milestones change less frequently)
    await setCachedData(cacheKey, data, 60 * 60 * 1000);
    
    return data;
  },

  async create(milestone: CreateMilestoneDto): Promise<Milestone> {
    const response = await fetch(`${API_BASE_URL}/milestones`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(milestone),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", response.status, errorText);
      throw new Error(
        `Failed to create milestone: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();
    
    // Invalidate cache since we added a new entry
    await invalidateResourceCache("milestones");
    
    return data;
  },

  async update(id: string, milestone: UpdateMilestoneDto): Promise<Milestone> {
    const response = await fetch(`${API_BASE_URL}/milestones/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(milestone),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", response.status, errorText);
      throw new Error(
        `Failed to update milestone: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();
    
    // Invalidate cache for this specific entry and the list
    await invalidateResourceCache("milestones");
    
    return data;
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/milestones/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", response.status, errorText);
      throw new Error(
        `Failed to delete milestone: ${response.status} - ${errorText}`
      );
    }

    // Invalidate cache since we removed an entry
    await invalidateResourceCache("milestones");
  },
};

