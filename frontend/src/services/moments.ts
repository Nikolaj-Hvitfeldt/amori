import { API_BASE_URL } from "./api";

export interface Moment {
  id?: string;
  title: string;
  story_date: string; // ISO date string
  description: string;
  photos?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateMomentDto {
  title: string;
  story_date: string;
  description: string;
  photos?: string[];
}

export interface UpdateMomentDto {
  title?: string;
  story_date?: string;
  description?: string;
  photos?: string[];
}

class MomentsService {
  private baseUrl = `${API_BASE_URL}/moments`;

  async getAllMoments(): Promise<Moment[]> {
    try {
      const response = await fetch(this.baseUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching moments:", error);
      throw error;
    }
  }

  async getMomentById(id: string): Promise<Moment> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
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
      return await response.json();
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
      return await response.json();
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
    } catch (error) {
      console.error("Error deleting moment:", error);
      throw error;
    }
  }
}

export const momentsService = new MomentsService();
