/**
 * Image processing constants
 */

// Compression settings
export const COMPRESSION_SETTINGS = {
  // Initial compression (high quality)
  INITIAL: {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 85,
  },
  // Aggressive compression (medium quality)
  AGGRESSIVE: {
    maxWidth: 1280,
    maxHeight: 1280,
    quality: 75,
  },
  // Maximum compression (lower quality)
  MAXIMUM: {
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 65,
  },
} as const;

// Thumbnail settings
export const THUMBNAIL_SETTINGS = {
  size: 300,
  quality: 75,
} as const;

// File extension (always JPEG after compression)
export const IMAGE_EXTENSION = "jpg" as const;

