import { API_BASE_URL } from "./api";
import { Moment, CreateMomentDto, UpdateMomentDto } from "../types/moments";

// Re-export types for backward compatibility
export type { Moment, CreateMomentDto, UpdateMomentDto };

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
