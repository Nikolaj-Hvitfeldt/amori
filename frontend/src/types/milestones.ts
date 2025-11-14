export type MilestoneType =
  | "met"
  | "first_date"
  | "official"
  | "moved_in"
  | "engagement"
  | "wedding"
  | "kid"
  | "custom";

export interface Milestone {
  id: string;
  milestone_type: MilestoneType;
  title: string;
  date: string;
  description?: string;
  photos?: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateMilestoneDto {
  milestone_type: MilestoneType;
  title: string;
  date: string;
  description?: string;
  photos?: string[];
}

export interface UpdateMilestoneDto {
  milestone_type?: MilestoneType;
  title?: string;
  date?: string;
  description?: string;
  photos?: string[];
}
