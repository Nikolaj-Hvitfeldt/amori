import { JournalEntry, CreateJournalEntry } from '../types/journal';

const API_URL = 'http://localhost:3000';

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
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });
    return response.json();
  },

  async update(id: string, entry: Partial<CreateJournalEntry>): Promise<JournalEntry> {
    const response = await fetch(`${API_URL}/journal/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });
    return response.json();
  },

  async delete(id: string): Promise<void> {
    await fetch(`${API_URL}/journal/${id}`, {
      method: 'DELETE',
    });
  },
};
