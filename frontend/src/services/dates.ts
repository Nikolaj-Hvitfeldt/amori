import {
  DateEntry,
  CreateDateEntryDto,
  UpdateDateEntryDto,
} from "../types/dates";
import { API_BASE_URL } from "./api";
import { getCachedData, setCachedData, invalidateResourceCache } from "../utils/cache";

const CACHE_KEY_ALL = "dates_all";
const CACHE_KEY_PREFIX = "dates_";

export const datesService = {
  async getAll(limit?: number, offset?: number): Promise<{ data: DateEntry[]; total: number }> {
    const cacheKey = limit !== undefined || offset !== undefined 
      ? `${CACHE_KEY_ALL}_${limit || 'all'}_${offset || 0}`
      : CACHE_KEY_ALL;
    
    // Check cache first for all requests
    const cached = await getCachedData<{ data: DateEntry[]; total: number }>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Build URL with query parameters
    const url = new URL(`${API_BASE_URL}/dates`);
    if (limit !== undefined) url.searchParams.set("limit", limit.toString());
    if (offset !== undefined) url.searchParams.set("offset", offset.toString());

    // Fetch from API
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Failed to fetch dates: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Cache the result with 30 minute TTL for all requests
    await setCachedData(cacheKey, result, 30 * 60 * 1000);
    
    return result;
  },

  async getById(id: string): Promise<DateEntry> {
    const cacheKey = `${CACHE_KEY_PREFIX}${id}`;
    
    // Check cache first
    const cached = await getCachedData<DateEntry>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Fetch from API
    const response = await fetch(`${API_BASE_URL}/dates/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch date: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Cache the result with 30 minute TTL
    await setCachedData(cacheKey, data, 30 * 60 * 1000);
    
    return data;
  },

  async create(dateEntry: CreateDateEntryDto): Promise<DateEntry> {
    const response = await fetch(`${API_BASE_URL}/dates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dateEntry),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", response.status, errorText);
      throw new Error(
        `Failed to create date entry: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();
    
    // Invalidate cache since we added a new entry
    await invalidateResourceCache("dates");
    
    return data;
  },

  async update(id: string, dateEntry: UpdateDateEntryDto): Promise<DateEntry> {
    const response = await fetch(`${API_BASE_URL}/dates/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dateEntry),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", response.status, errorText);
      throw new Error(
        `Failed to update date entry: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();
    
    // Invalidate cache for this specific entry and the list
    await invalidateResourceCache("dates");
    
    return data;
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/dates/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", response.status, errorText);
      throw new Error(
        `Failed to delete date entry: ${response.status} - ${errorText}`
      );
    }

    // Invalidate cache since we removed an entry
    await invalidateResourceCache("dates");
  },
};
