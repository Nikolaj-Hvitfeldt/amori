import {
  DateEntry,
  CreateDateEntryDto,
  UpdateDateEntryDto,
} from "../types/dates";
import { apiFetch, withPagination } from "./api";
import { getCachedData, setCachedData, invalidateResourceCache } from "../utils/cache";

const CACHE_KEY_ALL = "dates_all";
const CACHE_KEY_PREFIX = "dates_";

export const datesService = {
  async getAll(limit?: number, offset?: number, bypassCache: boolean = false): Promise<{ data: DateEntry[]; total: number }> {
    const cacheKey = limit !== undefined || offset !== undefined 
      ? `${CACHE_KEY_ALL}_${limit || 'all'}_${offset || 0}`
      : CACHE_KEY_ALL;
    
    // Check cache first for all requests (unless bypassing)
    if (!bypassCache) {
      const cached = await getCachedData<{ data: DateEntry[]; total: number }>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    // Fetch from API (with ?limit=&offset= when given)
    const response = await apiFetch(withPagination("/dates", limit, offset));

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
    const response = await apiFetch(`/dates/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch date: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Cache the result with 30 minute TTL
    await setCachedData(cacheKey, data, 30 * 60 * 1000);
    
    return data;
  },

  async create(dateEntry: CreateDateEntryDto): Promise<DateEntry> {
    const response = await apiFetch(`/dates`, {
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
    const response = await apiFetch(`/dates/${id}`, {
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
    const response = await apiFetch(`/dates/${id}`, {
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

  /**
   * Upload an image given as a data URL ("data:<mime>;base64,<data>").
   * Returns the stored image URL.
   */
  async uploadImage(image: string): Promise<string> {
    const uploadResponse = await apiFetch("/dates/upload-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image }),
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(
        `Failed to upload image: ${uploadResponse.status} ${errorText}`
      );
    }

    const result = await uploadResponse.json();
    if (!result.url) {
      throw new Error("No URL returned from upload");
    }
    return result.url;
  },
};
