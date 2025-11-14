import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsArray,
  IsEnum,
} from "class-validator";

export type MilestoneType =
  | "met"
  | "first_date"
  | "official"
  | "moved_in"
  | "engagement"
  | "wedding"
  | "kid"
  | "custom";

export class CreateMilestoneDto {
  @IsEnum([
    "met",
    "first_date",
    "official",
    "moved_in",
    "engagement",
    "wedding",
    "kid",
    "custom",
  ])
  milestone_type: MilestoneType;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsDateString()
  date: string; // ISO date string

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];
}

export class UpdateMilestoneDto {
  @IsOptional()
  @IsEnum([
    "met",
    "first_date",
    "official",
    "moved_in",
    "engagement",
    "wedding",
    "kid",
    "custom",
  ])
  milestone_type?: MilestoneType;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];
}

