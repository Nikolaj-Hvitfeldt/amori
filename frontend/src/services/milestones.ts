import {
  Milestone,
  CreateMilestoneDto,
  UpdateMilestoneDto,
} from "../types/milestones";
import { API_BASE_URL } from "./api";

export const milestonesService = {
  async getAll(): Promise<Milestone[]> {
    const response = await fetch(`${API_BASE_URL}/milestones`);

    if (!response.ok) {
      throw new Error(`Failed to fetch milestones: ${response.statusText}`);
    }

    return response.json();
  },

  async getById(id: string): Promise<Milestone> {
    const response = await fetch(`${API_BASE_URL}/milestones/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch milestone: ${response.statusText}`);
    }

    return response.json();
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

    return response.json();
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

    return response.json();
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
  },
};

