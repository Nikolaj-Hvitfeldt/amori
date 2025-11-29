import { Injectable } from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import { CreateMilestoneDto, UpdateMilestoneDto, MilestoneType } from "./milestones.dto";
import {
  NotFoundException,
  BadRequestException,
} from "../common/exceptions";
import {
  findAllWithPagination,
  findOneById,
  handleSupabaseError,
} from "../utils/supabase-helpers";

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
    return findAllWithPagination<Milestone>(
      this.supabase.getClient(),
      "milestones",
      {
        limit,
        offset,
        orderBy: "date",
        ascending: false,
      }
    );
  }

  async findOne(id: string): Promise<Milestone> {
    return findOneById<Milestone>(
      this.supabase.getClient(),
      "milestones",
      id,
      "Milestone"
    );
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
      handleSupabaseError(error, "create", "milestone");
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
      handleSupabaseError(error, "update", "milestone");
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
      handleSupabaseError(error, "delete", "milestone");
    }
  }
}

