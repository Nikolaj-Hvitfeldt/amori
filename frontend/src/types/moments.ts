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

