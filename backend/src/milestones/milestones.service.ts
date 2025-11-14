import { Injectable } from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import { CreateMilestoneDto, UpdateMilestoneDto, MilestoneType } from "./milestones.dto";

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

  async findAll(): Promise<Milestone[]> {
    const { data, error } = await this.supabase
      .getClient()
      .from("milestones")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch milestones: ${error.message}`);
    }

    return data || [];
  }

  async findOne(id: string): Promise<Milestone> {
    const { data, error } = await this.supabase
      .getClient()
      .from("milestones")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch milestone: ${error.message}`);
    }

    if (!data) {
      throw new Error("Milestone not found");
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
      throw new Error(`Failed to create milestone: ${error.message}`);
    }

    return data;
  }

  async update(
    id: string,
    updateMilestoneDto: UpdateMilestoneDto
  ): Promise<Milestone> {
    const { data, error } = await this.supabase
      .getClient()
      .from("milestones")
      .update({
        ...updateMilestoneDto,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update milestone: ${error.message}`);
    }

    if (!data) {
      throw new Error("Milestone not found");
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
      throw new Error(`Failed to delete milestone: ${error.message}`);
    }
  }
}

