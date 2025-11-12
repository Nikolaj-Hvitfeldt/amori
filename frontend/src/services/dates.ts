import {
  DateEntry,
  CreateDateEntryDto,
  UpdateDateEntryDto,
} from "../types/dates";
import { API_BASE_URL } from "./api";

export const datesService = {
  async getAll(): Promise<DateEntry[]> {
    const response = await fetch(`${API_BASE_URL}/dates`);

    if (!response.ok) {
      throw new Error(`Failed to fetch dates: ${response.statusText}`);
    }

    return response.json();
  },

  async getById(id: string): Promise<DateEntry> {
    const response = await fetch(`${API_BASE_URL}/dates/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch date: ${response.statusText}`);
    }

    return response.json();
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

    return response.json();
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

    return response.json();
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
  },
};
