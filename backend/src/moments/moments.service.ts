import { Injectable } from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import { CreateMomentDto, UpdateMomentDto } from "./moments.dto";
import { NotFoundException } from "../common/exceptions";
import {
  findAllWithPagination,
  findOneById,
  handleSupabaseError,
} from "../utils/supabase-helpers";
import { deleteStorageFiles } from "../utils/storage-utils";

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
    return findAllWithPagination<Moment>(
      this.supabase.getClient(),
      "moments",
      {
        limit,
        offset,
        orderBy: "story_date",
        ascending: false,
      }
    );
  }

  async findOne(id: string): Promise<Moment> {
    return findOneById<Moment>(
      this.supabase.getClient(),
      "moments",
      id,
      "Moment"
    );
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
      handleSupabaseError(error, "create", "moment");
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
      handleSupabaseError(error, "update", "moment");
    }

    if (!data) {
      throw new NotFoundException("Moment not found");
    }

    return data;
  }

  async remove(id: string): Promise<void> {
    // First, fetch the moment to get its photos
    const { data: moment } = await this.supabase
      .getClient()
      .from("moments")
      .select("photos")
      .eq("id", id)
      .single();

    // Delete photos from storage if they exist
    if (moment?.photos && moment.photos.length > 0) {
      await deleteStorageFiles(this.supabase.getClient(), moment.photos);
    }

    // Delete the database record
    const { error } = await this.supabase
      .getClient()
      .from("moments")
      .delete()
      .eq("id", id);

    if (error) {
      handleSupabaseError(error, "delete", "moment");
    }
  }
}
