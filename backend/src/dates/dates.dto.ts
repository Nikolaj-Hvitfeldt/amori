import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsArray,
  IsEnum,
} from "class-validator";

export type DateMood =
  | "magical"
  | "romantic"
  | "adventurous"
  | "cozy"
  | "spontaneous"
  | "dreamy";

export class CreateDateEntryDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsDateString()
  date: string; // ISO date string

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  highlights?: string[];

  @IsEnum([
    "magical",
    "romantic",
    "adventurous",
    "cozy",
    "spontaneous",
    "dreamy",
  ])
  mood: DateMood;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @IsOptional()
  @IsString()
  weather?: string;

  @IsOptional()
  @IsString()
  favorite_moment?: string;
}

export class UpdateDateEntryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  location?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  highlights?: string[];

  @IsOptional()
  @IsEnum([
    "magical",
    "romantic",
    "adventurous",
    "cozy",
    "spontaneous",
    "dreamy",
  ])
  mood?: DateMood;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @IsOptional()
  @IsString()
  weather?: string;

  @IsOptional()
  @IsString()
  favorite_moment?: string;
}
