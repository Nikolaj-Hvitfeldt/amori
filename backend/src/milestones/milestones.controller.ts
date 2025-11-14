import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { MilestonesService } from "./milestones.service";
import { CreateMilestoneDto, UpdateMilestoneDto } from "./milestones.dto";
import { SupabaseService } from "../supabase/supabase.service";

@Controller("milestones")
export class MilestonesController {
  constructor(
    private readonly milestonesService: MilestonesService,
    private readonly supabase: SupabaseService
  ) {}

  @Post()
  async create(@Body() createMilestoneDto: CreateMilestoneDto) {
    try {
      return await this.milestonesService.create(createMilestoneDto);
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to create milestone",
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get()
  async findAll() {
    try {
      return await this.milestonesService.findAll();
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to fetch milestones",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    try {
      return await this.milestonesService.findOne(id);
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to fetch milestone",
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() updateMilestoneDto: UpdateMilestoneDto
  ) {
    try {
      return await this.milestonesService.update(id, updateMilestoneDto);
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to update milestone",
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    try {
      await this.milestonesService.remove(id);
      return { message: "Milestone deleted successfully" };
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to delete milestone",
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post("upload-image")
  async uploadImage(@Body() body: { image: string }) {
    try {
      const { image } = body;
      if (!image) {
        throw new HttpException("Image is required", HttpStatus.BAD_REQUEST);
      }

      // Extract base64 data and mime type
      const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new HttpException("Invalid image format", HttpStatus.BAD_REQUEST);
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, "base64");

      // Determine file extension
      const extension = mimeType.split("/")[1] || "jpg";
      const fileName = `milestone-photos/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

      // Upload to Supabase Storage
      const supabase = this.supabase.getClient();
      
      // Check if bucket exists, create if it doesn't
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some((bucket) => bucket.name === "milestone-photos");
      
      if (!bucketExists) {
        // Create the bucket if it doesn't exist
        const { error: createError } = await supabase.storage.createBucket(
          "milestone-photos",
          {
            public: true,
            fileSizeLimit: 5242880, // 5MB
            allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
          }
        );
        
        if (createError) {
          console.error("Failed to create bucket:", createError);
          throw new HttpException(
            `Failed to create storage bucket: ${createError.message}. Please create 'milestone-photos' bucket in Supabase Storage manually.`,
            HttpStatus.INTERNAL_SERVER_ERROR
          );
        }
      }
      
      const { data, error } = await supabase.storage
        .from("milestone-photos")
        .upload(fileName, buffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (error) {
        console.error("Supabase storage error:", error);
        throw new HttpException(
          `Failed to upload image: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("milestone-photos").getPublicUrl(fileName);

      return { url: publicUrl };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || "Failed to upload image",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

