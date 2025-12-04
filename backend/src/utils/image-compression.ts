import sharp from "sharp";
import {
  COMPRESSION_SETTINGS,
  THUMBNAIL_SETTINGS,
} from "../constants/image.constants";

let heicConvert: any = null;
try {
  heicConvert = require("heic-convert");
} catch (e) {
  // heic-convert not available, will use Sharp fallback
}

/**
 * Compress and resize image on server-side
 * @param buffer - Image buffer
 * @param maxWidth - Maximum width (default: 1920)
 * @param maxHeight - Maximum height (default: 1920)
 * @param quality - JPEG quality 0-100 (default: 85)
 * @returns Compressed image buffer
 */
export async function compressImage(
  buffer: Buffer | Uint8Array,
  maxWidth: number = COMPRESSION_SETTINGS.INITIAL.maxWidth,
  maxHeight: number = COMPRESSION_SETTINGS.INITIAL.maxHeight,
  quality: number = COMPRESSION_SETTINGS.INITIAL.quality
): Promise<Buffer> {
  try {
    let image = sharp(buffer, { failOn: "none" });
    let metadata;

    try {
      metadata = await image.metadata();
    } catch (metadataError) {
      // Try with more permissive settings
      image = sharp(buffer, { failOn: "none", limitInputPixels: false });
      metadata = await image.metadata();
    }

    // If it's HEIC/HEIF, convert to JPEG first
    if (metadata.format === "heic" || metadata.format === "heif") {
      console.log("Detected HEIC/HEIF format, converting to JPEG...");

      // Try using heic-convert if available
      if (heicConvert) {
        try {
          const jpegBuffer = await heicConvert({
            buffer: buffer,
            format: "JPEG",
            quality: 0.9,
          });
          image = sharp(jpegBuffer);
          metadata = await image.metadata();
        } catch (heicError) {
          console.warn(
            "heic-convert failed, trying Sharp fallback...",
            heicError
          );
          // Fall through to Sharp attempt
        }
      }

      // If heic-convert not available or failed, try Sharp
      if (metadata.format === "heic" || metadata.format === "heif") {
        try {
          const jpegBuffer = await sharp(buffer, { failOn: "none" })
            .jpeg({ quality: 90 })
            .toBuffer();
          image = sharp(jpegBuffer);
          metadata = await image.metadata();
        } catch (sharpHeicError) {
          throw new Error(
            "HEIC conversion failed. Please convert HEIC images to JPEG before uploading."
          );
        }
      }
    }

    // Calculate new dimensions while maintaining aspect ratio
    let width = metadata.width || maxWidth;
    let height = metadata.height || maxHeight;

    if (width > maxWidth || height > maxHeight) {
      const aspectRatio = width / height;
      if (width > height) {
        width = maxWidth;
        height = Math.round(maxWidth / aspectRatio);
      } else {
        height = maxHeight;
        width = Math.round(maxHeight * aspectRatio);
      }
    }

    // Resize and compress
    const compressed = await image
      .resize(width, height, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();

    return compressed;
  } catch (error) {
    console.error("Error compressing image:", error);
    // Try fallback with more permissive settings
    try {
      const compressed = await sharp(buffer, {
        failOn: "none",
        limitInputPixels: false,
      })
        .resize(maxWidth, maxHeight, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
      return compressed;
    } catch (fallbackError) {
      throw new Error(
        "Failed to compress image: " +
          (fallbackError instanceof Error
            ? fallbackError.message
            : String(fallbackError))
      );
    }
  }
}

/**
 * Generate thumbnail from image
 * @param buffer - Image buffer
 * @param size - Thumbnail size (default: 300)
 * @param quality - JPEG quality 0-100 (default: 75)
 * @returns Thumbnail buffer
 */
export async function generateThumbnail(
  buffer: Buffer | Uint8Array,
  size: number = THUMBNAIL_SETTINGS.size,
  quality: number = THUMBNAIL_SETTINGS.quality
): Promise<Buffer> {
  try {
    // First, try to detect the format
    let image = sharp(buffer);
    let metadata;

    try {
      metadata = await image.metadata();
    } catch (metadataError) {
      // If metadata fails, try to force format detection
      console.warn("Metadata detection failed, trying format conversion...");
      // Try to convert as HEIC first, then fall back to auto-detect
      try {
        image = sharp(buffer, { failOn: "none" });
        metadata = await image.metadata();
      } catch (heicError) {
        // Last resort: try to process as JPEG
        image = sharp(buffer, { failOn: "none", limitInputPixels: false });
        metadata = await image.metadata();
      }
    }

    // If it's HEIC/HEIF, convert to JPEG first
    if (metadata.format === "heic" || metadata.format === "heif") {
      console.log("Detected HEIC/HEIF format, converting to JPEG...");

      // Try using heic-convert if available
      if (heicConvert) {
        try {
          const jpegBuffer = await heicConvert({
            buffer: buffer,
            format: "JPEG",
            quality: 0.9,
          });
          image = sharp(jpegBuffer);
          metadata = await image.metadata();
        } catch (heicError) {
          console.warn(
            "heic-convert failed, trying Sharp fallback...",
            heicError
          );
          // Fall through to Sharp attempt
        }
      }

      // If heic-convert not available or failed, try Sharp
      if (metadata.format === "heic" || metadata.format === "heif") {
        try {
          const jpegBuffer = await sharp(buffer, { failOn: "none" })
            .jpeg({ quality: 90 })
            .toBuffer();
          image = sharp(jpegBuffer);
          metadata = await image.metadata();
        } catch (sharpHeicError) {
          throw new Error(
            "HEIC conversion failed. Please convert HEIC images to JPEG before uploading."
          );
        }
      }
    }

    // Generate thumbnail
    const thumbnail = await image
      .resize(size, size, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();

    return thumbnail;
  } catch (error) {
    // If all else fails, try a more permissive approach
    console.warn(
      "Standard thumbnail generation failed, trying fallback method...",
      error
    );

    try {
      // Fallback: try with failOn: 'none' and no format restrictions
      const thumbnail = await sharp(buffer, {
        failOn: "none",
        limitInputPixels: false,
      })
        .resize(size, size, {
          fit: "cover",
          position: "center",
        })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();

      return thumbnail;
    } catch (fallbackError) {
      console.error(
        "Error generating thumbnail (all methods failed):",
        fallbackError
      );
      throw new Error(
        "Failed to generate thumbnail: " +
          (fallbackError instanceof Error
            ? fallbackError.message
            : String(fallbackError))
      );
    }
  }
}

/**
 * Get image metadata
 * @param buffer - Image buffer
 * @returns Image metadata
 */
export async function getImageMetadata(buffer: Buffer | Uint8Array) {
  try {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: buffer.length,
    };
  } catch (error) {
    console.error("Error getting image metadata:", error);
    throw new Error("Failed to get image metadata");
  }
}
