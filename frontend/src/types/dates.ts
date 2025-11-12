export type DateMood =
  | "magical"
  | "romantic"
  | "adventurous"
  | "cozy"
  | "spontaneous"
  | "dreamy";

export interface DateEntry {
  id: string;
  title?: string;
  date: string;
  location: string;
  description: string;
  mood: DateMood;
  highlights: string[];
  weather?: string;
  favorite_moment?: string;
  image_url?: string;
  photos?: string[]; // Array of photo URLs
  created_at: string;
  updated_at: string;
}

export interface CreateDateEntryDto {
  title?: string;
  date: string;
  location: string;
  description: string;
  mood: DateMood;
  highlights?: string[];
  weather?: string;
  favorite_moment?: string;
  photos?: string[]; // Array of photo URLs
  image_url?: string; // Legacy field for backward compatibility
}

export interface UpdateDateEntryDto {
  title?: string;
  date?: string;
  location?: string;
  description?: string;
  mood?: DateMood;
  highlights?: string[];
  weather?: string;
  favorite_moment?: string;
  photos?: string[]; // Array of photo URLs
  image_url?: string; // Legacy field for backward compatibility
}
