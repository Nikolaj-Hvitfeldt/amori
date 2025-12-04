import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Extract bucket name and file path from a Supabase storage URL
 * URL format: https://xxx.supabase.co/storage/v1/object/public/bucket-name/path/to/file.jpg
 */
export function parseStorageUrl(url: string): { bucket: string; path: string } | null {
  if (!url || typeof url !== "string") return null;

  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");

    // Find the index of "public" in the path
    const publicIndex = pathParts.indexOf("public");
    if (publicIndex === -1 || publicIndex >= pathParts.length - 1) {
      return null;
    }

    // Bucket name is right after "public"
    const bucket = pathParts[publicIndex + 1];

    // File path is everything after the bucket name
    const filePath = pathParts.slice(publicIndex + 2).join("/");

    if (!bucket || !filePath) {
      return null;
    }

    return { bucket, path: filePath };
  } catch (error) {
    console.warn("Failed to parse storage URL:", url, error);
    return null;
  }
}

/**
 * Delete files from Supabase storage
 * @param supabase - Supabase client
 * @param photoUrls - Array of photo URLs to delete
 */
export async function deleteStorageFiles(
  supabase: SupabaseClient,
  photoUrls: string[]
): Promise<void> {
  if (!photoUrls || photoUrls.length === 0) return;

  // Group files by bucket
  const filesByBucket: Record<string, string[]> = {};

  for (const url of photoUrls) {
    const parsed = parseStorageUrl(url);
    if (parsed) {
      if (!filesByBucket[parsed.bucket]) {
        filesByBucket[parsed.bucket] = [];
      }
      filesByBucket[parsed.bucket].push(parsed.path);

      // Also add the thumbnail path if it exists
      if (!parsed.path.includes("_thumb.")) {
        const thumbPath = parsed.path.replace(/\.([^.]+)$/, "_thumb.$1");
        filesByBucket[parsed.bucket].push(thumbPath);
      }
    }
  }

  // Delete files from each bucket
  for (const [bucket, paths] of Object.entries(filesByBucket)) {
    try {
      const { error } = await supabase.storage.from(bucket).remove(paths);
      if (error) {
        console.warn(`Failed to delete files from ${bucket}:`, error.message);
      }
    } catch (err) {
      console.warn(`Error deleting files from ${bucket}:`, err);
    }
  }
}

