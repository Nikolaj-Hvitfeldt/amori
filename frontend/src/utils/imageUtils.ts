/**
 * Image utility functions for handling thumbnails and full-size images
 */

/**
 * Get thumbnail URL from full image URL
 * Thumbnails are stored with _thumb suffix in the filename
 * @param fullUrl - Full-size image URL
 * @returns Thumbnail URL or original URL if thumbnail doesn't exist
 */
export function getThumbnailUrl(fullUrl: string): string {
  if (!fullUrl) return fullUrl;
  
  // Check if URL already contains _thumb (already a thumbnail)
  if (fullUrl.includes('_thumb.')) {
    return fullUrl;
  }
  
  // Replace filename with thumbnail version
  // Pattern: .../filename.jpg -> .../filename_thumb.jpg
  try {
    const url = new URL(fullUrl);
    const pathParts = url.pathname.split('/');
    const filename = pathParts[pathParts.length - 1];
    
    // Only process if filename has extension
    if (filename.includes('.')) {
      const [name, ext] = filename.split('.');
      const thumbnailFilename = `${name}_thumb.${ext}`;
      pathParts[pathParts.length - 1] = thumbnailFilename;
      url.pathname = pathParts.join('/');
      return url.toString();
    }
  } catch (error) {
    // If URL parsing fails, return original (fallback to full image)
    console.warn('Failed to parse URL for thumbnail, using full image:', error);
  }
  
  // Fallback: return full URL if thumbnail conversion fails
  return fullUrl;
}

/**
 * Check if a URL is a thumbnail
 * @param url - Image URL to check
 * @returns True if URL is a thumbnail
 */
export function isThumbnail(url: string): boolean {
  return url.includes('_thumb.');
}

/**
 * Get full-size URL from thumbnail URL
 * @param thumbnailUrl - Thumbnail URL
 * @returns Full-size URL
 */
export function getFullSizeUrl(thumbnailUrl: string): string {
  if (!thumbnailUrl) return thumbnailUrl;
  
  if (!isThumbnail(thumbnailUrl)) {
    return thumbnailUrl; // Already full-size
  }
  
  // Remove _thumb from filename
  try {
    const url = new URL(thumbnailUrl);
    const pathParts = url.pathname.split('/');
    const filename = pathParts[pathParts.length - 1];
    
    if (filename.includes('_thumb.')) {
      const fullFilename = filename.replace('_thumb.', '.');
      pathParts[pathParts.length - 1] = fullFilename;
      url.pathname = pathParts.join('/');
      return url.toString();
    }
  } catch (error) {
    console.warn('Failed to parse thumbnail URL:', error);
  }
  
  return thumbnailUrl;
}

