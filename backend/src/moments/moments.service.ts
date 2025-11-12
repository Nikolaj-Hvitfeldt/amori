import { Injectable } from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import { CreateMomentDto, UpdateMomentDto } from "./moments.dto";

export interface Moment {
  id: string;
  title: string;
  story_date: string;
  description: string;
  photos?: string[];
  created_at: string;
  updated_at: string;
}

@Injectable()
export class MomentsService {
  constructor(private readonly supabase: SupabaseService) {}

  async findAll(): Promise<Moment[]> {
    const { data, error } = await this.supabase
      .getClient()
      .from("love_stories")
      .select("*")
      .order("story_date", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch moments: ${error.message}`);
    }

    return data || [];
  }

  async findOne(id: string): Promise<Moment> {
    const { data, error } = await this.supabase
      .getClient()
      .from("love_stories")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch moment: ${error.message}`);
    }

    if (!data) {
      throw new Error("Moment not found");
    }

    return data;
  }

  async create(createMomentDto: CreateMomentDto): Promise<Moment> {
    const { data, error } = await this.supabase
      .getClient()
      .from("love_stories")
      .insert([
        {
          title: createMomentDto.title,
          story_date: createMomentDto.story_date,
          description: createMomentDto.description,
          photos: createMomentDto.photos || [],
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create moment: ${error.message}`);
    }

    return data;
  }

  async update(id: string, updateMomentDto: UpdateMomentDto): Promise<Moment> {
    const { data, error } = await this.supabase
      .getClient()
      .from("love_stories")
      .update({
        ...updateMomentDto,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update moment: ${error.message}`);
    }

    if (!data) {
      throw new Error("Moment not found");
    }

    return data;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase
      .getClient()
      .from("love_stories")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete moment: ${error.message}`);
    }
  }
}
