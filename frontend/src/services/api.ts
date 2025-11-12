import { JournalEntry, CreateJournalEntry } from "../types/journal";

// Use your computer's IP address for Expo to access the backend
// Change this to your computer's IP or use localhost when using web/simulator
const API_URL = "http://192.168.0.92:3000";
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
