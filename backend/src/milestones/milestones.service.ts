import { Injectable } from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import { CreateMilestoneDto, UpdateMilestoneDto, MilestoneType } from "./milestones.dto";
import { PAGINATION_DEFAULTS } from "../constants/app.constants";
import {
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from "../common/exceptions";

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

@Injectable()
export class MilestonesService {
  constructor(private readonly supabase: SupabaseService) {}

  async findAll(limit?: number, offset?: number): Promise<{ data: Milestone[]; total: number }> {
    const client = this.supabase.getClient();
    
    // Get total count
    const { count, error: countError } = await client
      .from("milestones")
      .select("*", { count: "exact", head: true });

    if (countError) {
      throw new InternalServerErrorException(
        `Failed to count milestones: ${countError.message}`
      );
    }

    // Build query
    let query = client
      .from("milestones")
      .select("*")
      .order("date", { ascending: false });

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
      throw new InternalServerErrorException(
        `Failed to fetch milestones: ${error.message}`
      );
    }

    return {
      data: data || [],
      total: count || 0,
    };
  }

  async findOne(id: string): Promise<Milestone> {
    const { data, error } = await this.supabase
      .getClient()
      .from("milestones")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to fetch milestone: ${error.message}`
      );
    }

    if (!data) {
      throw new NotFoundException("Milestone not found");
    }

    return data;
  }

  async create(createMilestoneDto: CreateMilestoneDto): Promise<Milestone> {
    const { data, error } = await this.supabase
      .getClient()
      .from("milestones")
      .insert([
        {
          milestone_type: createMilestoneDto.milestone_type,
          title: createMilestoneDto.title,
          date: createMilestoneDto.date,
          description: createMilestoneDto.description,
          photos: createMilestoneDto.photos || [],
        },
      ])
      .select()
      .single();

    if (error) {
      throw new BadRequestException(
        `Failed to create milestone: ${error.message}`
      );
    }

    return data;
  }

  async update(
    id: string,
    updateMilestoneDto: UpdateMilestoneDto
  ): Promise<Milestone> {
    // Explicitly handle photos array - if it's provided (even if empty), update it
    const updateData: any = {
      ...updateMilestoneDto,
      updated_at: new Date().toISOString(),
    };
    
    // If photos is explicitly provided (including empty array), ensure it's set
    if ('photos' in updateMilestoneDto) {
      updateData.photos = updateMilestoneDto.photos || [];
    }

    const { data, error } = await this.supabase
      .getClient()
      .from("milestones")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(
        `Failed to update milestone: ${error.message}`
      );
    }

    if (!data) {
      throw new NotFoundException("Milestone not found");
    }

    return data;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase
      .getClient()
      .from("milestones")
      .delete()
      .eq("id", id);

    if (error) {
      throw new BadRequestException(
        `Failed to delete milestone: ${error.message}`
      );
    }
  }
}

