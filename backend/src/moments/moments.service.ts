import { Injectable } from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import { CreateMomentDto, UpdateMomentDto } from "./moments.dto";
import { PAGINATION_DEFAULTS } from "../constants/app.constants";
import {
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from "../common/exceptions";

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

  async findAll(limit?: number, offset?: number): Promise<{ data: Moment[]; total: number }> {
    try {
      console.log("Fetching moments from moments table...");
      const client = this.supabase.getClient();
      
      // Get total count
      const { count, error: countError } = await client
        .from("moments")
        .select("*", { count: "exact", head: true });

      if (countError) {
        throw new InternalServerErrorException(
          `Failed to count moments: ${countError.message}`
        );
      }

      // Build query
      let query = client
        .from("moments")
        .select("*")
        .order("story_date", { ascending: false });

      // Apply pagination if provided
      if (limit !== undefined) {
        query = query.limit(limit);
      }
      if (offset !== undefined) {
        query = query.range(
          offset,
          offset + (limit || PAGINATION_DEFAULTS.DEFAULT_LIMIT) - 1
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error("Supabase error:", error);
        throw new InternalServerErrorException(
          `Failed to fetch moments: ${error.message}`
        );
      }

      console.log(`Successfully fetched ${data?.length || 0} moments`);
      return {
        data: data || [],
        total: count || 0,
      };
    } catch (error) {
      console.error("Error in findAll:", error);
      throw error;
    }
  }

  async findOne(id: string): Promise<Moment> {
    const { data, error } = await this.supabase
      .getClient()
      .from("moments")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to fetch moment: ${error.message}`
      );
    }

    if (!data) {
      throw new NotFoundException("Moment not found");
    }

    return data;
  }

  async create(createMomentDto: CreateMomentDto): Promise<Moment> {
    const { data, error } = await this.supabase
      .getClient()
      .from("moments")
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
      throw new BadRequestException(
        `Failed to create moment: ${error.message}`
      );
    }

    return data;
  }

  async update(id: string, updateMomentDto: UpdateMomentDto): Promise<Moment> {
    // Explicitly handle photos array - if it's provided (even if empty), update it
    const updateData: any = {
      ...updateMomentDto,
      updated_at: new Date().toISOString(),
    };
    
    // If photos is explicitly provided (including empty array), ensure it's set
    if ('photos' in updateMomentDto) {
      updateData.photos = updateMomentDto.photos || [];
    }

    const { data, error } = await this.supabase
      .getClient()
      .from("moments")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(
        `Failed to update moment: ${error.message}`
      );
    }

    if (!data) {
      throw new NotFoundException("Moment not found");
    }

    return data;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase
      .getClient()
      .from("moments")
      .delete()
      .eq("id", id);

    if (error) {
      throw new BadRequestException(
        `Failed to delete moment: ${error.message}`
      );
    }
  }
}
