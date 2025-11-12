import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsArray,
} from "class-validator";

export class CreateMomentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsDateString()
  story_date: string; // ISO date string

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];
}

export class UpdateMomentDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsDateString()
  story_date?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];
}
