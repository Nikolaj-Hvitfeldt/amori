import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import { compressImage, generateThumbnail } from "./image-compression";
import {
  MAX_FILE_SIZE,
  BUCKET_CONFIG,
  ALLOWED_MIME_TYPES,
} from "../constants/storage.constants";
import {
  COMPRESSION_SETTINGS,
  THUMBNAIL_SETTINGS,
  IMAGE_EXTENSION,
} from "../constants/image.constants";

export interface ImageUploadResult {
  url: string;
  thumbnailUrl: string;
}

@Injectable()
export class ImageUploadService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Upload and process an image to Supabase Storage
   * @param imageBase64 - Base64 encoded image string (data:image/...;base64,...)
   * @param bucketName - Name of the Supabase Storage bucket
   * @returns Object with full-size URL and thumbnail URL
   */
  async uploadImage(
    imageBase64: string,
    bucketName: string
  ): Promise<ImageUploadResult> {
    try {
      // Validate input
      if (!imageBase64) {
        throw new HttpException("Image is required", HttpStatus.BAD_REQUEST);
      }

      // Extract base64 data and mime type
      const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new HttpException("Invalid image format", HttpStatus.BAD_REQUEST);
      }

      const mimeType = matches[1];
      const base64Data = matches[2];

      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        throw new HttpException(
          `Unsupported image type: ${mimeType}. Allowed types are: ${ALLOWED_MIME_TYPES.join(
            ", "
          )}`,
          HttpStatus.BAD_REQUEST
        );
      }

      let buffer = Buffer.from(base64Data, "base64");

      // Compress image with progressive compression
      const compressedBuffer = await this.compressImageWithFallback(buffer);

      // Generate thumbnail
      const thumbnailBuffer = await this.generateThumbnailSafe(
        compressedBuffer
      );

      // Ensure bucket exists
      await this.ensureBucketExists(bucketName);

      // Generate file names
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const fileName = `${bucketName}/${timestamp}-${randomId}.${IMAGE_EXTENSION}`;
      const thumbnailFileName = `${bucketName}/${timestamp}-${randomId}_thumb.${IMAGE_EXTENSION}`;

      // Upload full-size image
      const fullImageUrl = await this.uploadToStorage(
        bucketName,
        fileName,
        compressedBuffer
      );

      // Upload thumbnail if generated
      let thumbnailUrl: string | null = null;
      if (thumbnailBuffer) {
        thumbnailUrl = await this.uploadToStorage(
          bucketName,
          thumbnailFileName,
          thumbnailBuffer
        );
      }

      return {
        url: fullImageUrl,
        thumbnailUrl: thumbnailUrl || fullImageUrl, // Fallback to full URL if thumbnail fails
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

  /**
   * Compress image with progressive fallback (3 stages)
   */
  private async compressImageWithFallback(buffer: Buffer): Promise<Buffer> {
    try {
      // Stage 1: Initial compression (high quality)
      let compressedBuffer = await compressImage(
        buffer,
        COMPRESSION_SETTINGS.INITIAL.maxWidth,
        COMPRESSION_SETTINGS.INITIAL.maxHeight,
        COMPRESSION_SETTINGS.INITIAL.quality
      );

      // Stage 2: If still too large, compress more aggressively
      if (compressedBuffer.length > MAX_FILE_SIZE) {
        console.warn(
          `Image still too large (${(
            compressedBuffer.length /
            1024 /
            1024
          ).toFixed(2)}MB), compressing more aggressively...`
        );
        compressedBuffer = await compressImage(
          buffer,
          COMPRESSION_SETTINGS.AGGRESSIVE.maxWidth,
          COMPRESSION_SETTINGS.AGGRESSIVE.maxHeight,
          COMPRESSION_SETTINGS.AGGRESSIVE.quality
        );

        // Stage 3: If still too large, use maximum compression
        if (compressedBuffer.length > MAX_FILE_SIZE) {
          console.warn(
            `Image still too large (${(
              compressedBuffer.length /
              1024 /
              1024
            ).toFixed(2)}MB), using maximum compression...`
          );
          compressedBuffer = await compressImage(
            buffer,
            COMPRESSION_SETTINGS.MAXIMUM.maxWidth,
            COMPRESSION_SETTINGS.MAXIMUM.maxHeight,
            COMPRESSION_SETTINGS.MAXIMUM.quality
          );
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

      return compressedBuffer;
    } catch (compressionError) {
      if (compressionError instanceof HttpException) {
        throw compressionError;
      }
      console.warn(
        "Image compression failed, using original:",
        compressionError
      );
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
      return buffer;
    }
  }

  /**
   * Generate thumbnail safely (catches errors and returns null)
   */
  private async generateThumbnailSafe(buffer: Buffer): Promise<Buffer | null> {
    try {
      return await generateThumbnail(
        buffer,
        THUMBNAIL_SETTINGS.size,
        THUMBNAIL_SETTINGS.quality
      );
    } catch (thumbnailError) {
      console.warn("Thumbnail generation failed:", thumbnailError);
      return null; // Continue without thumbnail if generation fails
    }
  }

  /**
   * Ensure bucket exists, create if it doesn't
   */
  private async ensureBucketExists(bucketName: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((bucket) => bucket.name === bucketName);

    if (!bucketExists) {
      // Create the bucket if it doesn't exist
      const { error: createError } = await supabase.storage.createBucket(
        bucketName,
        BUCKET_CONFIG
      );

      if (createError) {
        console.error("Failed to create bucket:", createError);
        throw new HttpException(
          `Failed to create storage bucket: ${createError.message}. Please create '${bucketName}' bucket in Supabase Storage manually.`,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }

  /**
   * Upload buffer to Supabase Storage and return public URL
   */
  private async uploadToStorage(
    bucketName: string,
    fileName: string,
    buffer: Buffer
  ): Promise<string> {
    const supabase = this.supabaseService.getClient();

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, buffer, {
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

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(fileName);

    return publicUrl;
  }
}
