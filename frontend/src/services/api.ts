import { Platform } from "react-native";
import { JournalEntry, CreateJournalEntry } from "../types/journal";

// Use localhost for web, current hotspot IP for mobile
const API_URL =
  Platform.OS === "web"
    ? "http://localhost:3000" // Web browser
    : "http://172.20.10.3:3000"; // Mobile: hotspot IP

console.log("Platform:", Platform.OS, "API URL:", API_URL);
export const API_BASE_URL = API_URL;

export const journalService = {
  async getAll(): Promise<JournalEntry[]> {
    const response = await fetch(`${API_URL}/journal`);
    return response.json();
  },

  async getById(id: string): Promise<JournalEntry> {
    const response = await fetch(`${API_URL}/journal/${id}`);
    return response.json();
  },

  async getByType(type: string): Promise<JournalEntry[]> {
    const response = await fetch(`${API_URL}/journal?type=${type}`);
    return response.json();
  },

  async create(entry: CreateJournalEntry): Promise<JournalEntry> {
    const response = await fetch(`${API_URL}/journal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(entry),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", response.status, errorText);
      throw new Error(
        `Failed to create entry: ${response.status} - ${errorText}`
      );
    }

    return response.json();
  },

  async update(
    id: string,
    entry: Partial<CreateJournalEntry>
  ): Promise<JournalEntry> {
    const response = await fetch(`${API_URL}/journal/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(entry),
    });
    return response.json();
  },

  async delete(id: string): Promise<void> {
    await fetch(`${API_URL}/journal/${id}`, {
      method: "DELETE",
    });
  },
};
