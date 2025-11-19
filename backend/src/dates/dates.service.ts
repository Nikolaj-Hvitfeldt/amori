import { Injectable } from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import { CreateDateEntryDto, UpdateDateEntryDto, DateMood } from "./dates.dto";

export interface DateEntry {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  highlights?: string[];
  mood: DateMood;
  photos?: string[];
  weather?: string;
  favorite_moment?: string;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class DatesService {
  constructor(private readonly supabase: SupabaseService) {}

  async findAll(): Promise<DateEntry[]> {
    const { data, error } = await this.supabase
      .getClient()
      .from("date_entries")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch date entries: ${error.message}`);
    }

    return data || [];
  }

  async findOne(id: string): Promise<DateEntry> {
    const { data, error } = await this.supabase
      .getClient()
      .from("date_entries")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch date entry: ${error.message}`);
    }

    if (!data) {
      throw new Error("Date entry not found");
    }

    return data;
  }

  async create(createDateEntryDto: CreateDateEntryDto): Promise<DateEntry> {
    const { data, error } = await this.supabase
      .getClient()
      .from("date_entries")
      .insert([
        {
          title: createDateEntryDto.title || `${createDateEntryDto.location} - ${new Date(createDateEntryDto.date).toLocaleDateString()}`,
          date: createDateEntryDto.date,
          location: createDateEntryDto.location,
          description: createDateEntryDto.description,
          highlights: createDateEntryDto.highlights || [],
          mood: createDateEntryDto.mood,
          photos: createDateEntryDto.photos || [],
          weather: createDateEntryDto.weather,
          favorite_moment: createDateEntryDto.favorite_moment,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create date entry: ${error.message}`);
    }

    return data;
  }

  async update(
    id: string,
    updateDateEntryDto: UpdateDateEntryDto
  ): Promise<DateEntry> {
    // Build update data, but handle photos specially
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    
    // Only include fields that are actually provided
    if (updateDateEntryDto.title !== undefined) updateData.title = updateDateEntryDto.title;
    if (updateDateEntryDto.date !== undefined) updateData.date = updateDateEntryDto.date;
    if (updateDateEntryDto.location !== undefined) updateData.location = updateDateEntryDto.location;
    if (updateDateEntryDto.description !== undefined) updateData.description = updateDateEntryDto.description;
    if (updateDateEntryDto.mood !== undefined) updateData.mood = updateDateEntryDto.mood;
    if (updateDateEntryDto.highlights !== undefined) updateData.highlights = updateDateEntryDto.highlights;
    if (updateDateEntryDto.weather !== undefined) updateData.weather = updateDateEntryDto.weather;
    if (updateDateEntryDto.favorite_moment !== undefined) updateData.favorite_moment = updateDateEntryDto.favorite_moment;
    
    // Only update photos if explicitly provided (allows clearing with empty array)
    // If photos is not in the DTO, don't touch the existing photos
    if ('photos' in updateDateEntryDto) {
      updateData.photos = updateDateEntryDto.photos || [];
    }

    const { data, error } = await this.supabase
      .getClient()
      .from("date_entries")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update date entry: ${error.message}`);
    }

    if (!data) {
      throw new Error("Date entry not found");
    }

    return data;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase
      .getClient()
      .from("date_entries")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete date entry: ${error.message}`);
    }
  }
}
