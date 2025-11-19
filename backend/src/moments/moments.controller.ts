import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { MomentsService } from "./moments.service";
import { CreateMomentDto, UpdateMomentDto } from "./moments.dto";
import { SupabaseService } from "../supabase/supabase.service";

@Controller("moments")
export class MomentsController {
  constructor(
    private readonly momentsService: MomentsService,
    private readonly supabase: SupabaseService
  ) {}

  @Post()
  async create(@Body() createMomentDto: CreateMomentDto) {
    try {
      return await this.momentsService.create(createMomentDto);
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to create moment",
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get()
  async findAll(@Query("limit") limit?: string, @Query("offset") offset?: string) {
    try {
      const limitNum = limit ? parseInt(limit, 10) : undefined;
      const offsetNum = offset ? parseInt(offset, 10) : undefined;
      return await this.momentsService.findAll(limitNum, offsetNum);
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to fetch moments",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    try {
      return await this.momentsService.findOne(id);
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to fetch moment",
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() updateMomentDto: UpdateMomentDto
  ) {
    try {
      return await this.momentsService.update(id, updateMomentDto);
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to update moment",
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    try {
      await this.momentsService.remove(id);
      return { message: "Moment deleted successfully" };
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to delete moment",
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
      let buffer = Buffer.from(base64Data, "base64");

      // Compress image before upload (max 1920x1920, quality 85)
      let compressedBuffer: Buffer = buffer;
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      try {
        const { compressImage } = await import("../utils/image-compression");
        compressedBuffer = await compressImage(buffer, 1920, 1920, 85);

        // If still too large, compress more aggressively
        if (compressedBuffer.length > MAX_FILE_SIZE) {
          console.warn(
            `Image still too large (${(
              compressedBuffer.length /
              1024 /
              1024
            ).toFixed(2)}MB), compressing more aggressively...`
          );
          // Try smaller dimensions and lower quality
          compressedBuffer = await compressImage(buffer, 1280, 1280, 75);

          // If still too large, compress even more
          if (compressedBuffer.length > MAX_FILE_SIZE) {
            console.warn(
              `Image still too large (${(
                compressedBuffer.length /
                1024 /
                1024
              ).toFixed(2)}MB), using maximum compression...`
            );
            compressedBuffer = await compressImage(buffer, 1024, 1024, 65);
          }
        }

        // Final check - if still too large, throw error
        if (compressedBuffer.length > MAX_FILE_SIZE) {
          throw new HttpException(
            `Image is too large even after compression (${(
              compressedBuffer.length /
              1024 /
              1024
            ).toFixed(2)}MB). Please use a smaller image.`,
            HttpStatus.BAD_REQUEST
          );
        }
      } catch (compressionError) {
        if (compressionError instanceof HttpException) {
          throw compressionError;
        }
        console.warn("Image compression failed, using original:", compressionError);
        // Check if original is too large
        if (buffer.length > MAX_FILE_SIZE) {
          throw new HttpException(
            `Image is too large (${(buffer.length / 1024 / 1024).toFixed(
              2
            )}MB) and compression failed. Please use a smaller image.`,
            HttpStatus.BAD_REQUEST
          );
        }
        // Continue with original buffer if compression fails but size is OK
      }

      // Determine file extension (always use jpg after compression)
      const extension = "jpg";
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const fileName = `moments-photos/${timestamp}-${randomId}.${extension}`;
      const thumbnailFileName = `moments-photos/${timestamp}-${randomId}_thumb.${extension}`;

      // Generate thumbnail (300x300px, quality 75)
      let thumbnailBuffer: Buffer | null = null;
      try {
        const { generateThumbnail } = await import("../utils/image-compression");
        thumbnailBuffer = await generateThumbnail(compressedBuffer, 300, 75);
      } catch (thumbnailError) {
        console.warn("Thumbnail generation failed:", thumbnailError);
        // Continue without thumbnail if generation fails
      }

      // Upload to Supabase Storage
      const supabase = this.supabase.getClient();

      // Check if bucket exists, create if it doesn't
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(
        (bucket) => bucket.name === "moments-photos"
      );

      if (!bucketExists) {
        // Create the bucket if it doesn't exist
        const { error: createError } = await supabase.storage.createBucket(
          "moments-photos",
          {
            public: true,
            fileSizeLimit: 10485760, // 10MB (increased from 5MB)
            allowedMimeTypes: [
              "image/jpeg",
              "image/png",
              "image/gif",
              "image/webp",
            ],
          }
        );

        if (createError) {
          console.error("Failed to create bucket:", createError);
          throw new HttpException(
            `Failed to create storage bucket: ${createError.message}. Please create 'moments-photos' bucket in Supabase Storage manually.`,
            HttpStatus.INTERNAL_SERVER_ERROR
          );
        }
      }

      // Upload full-size image
      const { data, error } = await supabase.storage
        .from("moments-photos")
        .upload(fileName, compressedBuffer, {
          contentType: "image/jpeg", // Always JPEG after compression
          upsert: false,
        });

      if (error) {
        console.error("Supabase storage error:", error);
        throw new HttpException(
          `Failed to upload image: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      // Upload thumbnail if generated
      let thumbnailUrl: string | null = null;
      if (thumbnailBuffer) {
        const { data: thumbData, error: thumbError } = await supabase.storage
          .from("moments-photos")
          .upload(thumbnailFileName, thumbnailBuffer, {
            contentType: "image/jpeg",
            upsert: false,
          });

        if (!thumbError && thumbData) {
          const {
            data: { publicUrl },
          } = supabase.storage
            .from("moments-photos")
            .getPublicUrl(thumbnailFileName);
          thumbnailUrl = publicUrl;
        } else {
          console.warn("Failed to upload thumbnail:", thumbError);
        }
      }

      // Get public URL for full-size image
      const {
        data: { publicUrl },
      } = supabase.storage.from("moments-photos").getPublicUrl(fileName);

      return {
        url: publicUrl,
        thumbnailUrl: thumbnailUrl || publicUrl, // Fallback to full URL if thumbnail fails
      };
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
