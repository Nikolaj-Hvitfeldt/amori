export type DateMood =
  | "magical"
  | "romantic"
  | "adventurous"
  | "cozy"
  | "spontaneous"
  | "dreamy";

export interface DateEntry {
  id: string;
  date: string;
  location: string;
  description: string;
  mood: DateMood;
  highlights: string[];
  weather?: string;
  favorite_moment?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDateEntryDto {
  date: string;
  location: string;
  description: string;
  mood: DateMood;
  highlights?: string[];
  weather?: string;
  favorite_moment?: string;
  image_url?: string;
}

export interface UpdateDateEntryDto {
  date?: string;
  location?: string;
  description?: string;
  mood?: DateMood;
  highlights?: string[];
  weather?: string;
  favorite_moment?: string;
  image_url?: string;
}
