/**
 * Storage-related constants
 */

// Maximum file size (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Bucket names
export const BUCKET_NAMES = {
  MOMENTS: "moments-photos",
  DATES: "date-photos",
  MILESTONES: "milestone-photos",
} as const;

// Allowed MIME types for image uploads
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

// Bucket configuration
export const BUCKET_CONFIG = {
  public: true,
  fileSizeLimit: 10485760, // 10MB (increased from 5MB)
  allowedMimeTypes: ALLOWED_MIME_TYPES,
} as const;

