/**
 * Client-side image compression utilities
 * Compresses images before upload to reduce bandwidth and storage
 */

/**
 * Resize and compress image on client-side
 * @param uri - Image URI (file://, blob:, or data:)
 * @param maxWidth - Maximum width (default: 1920)
 * @param maxHeight - Maximum height (default: 1920)
 * @param quality - Compression quality 0-1 (default: 0.85)
 * @returns Compressed image as base64 data URL
 */
export async function compressImage(
  uri: string,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let width = img.width;
      let height = img.height;

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

      // Create canvas for resizing
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };

    img.onerror = (error) => {
      reject(new Error('Failed to load image: ' + error));
    };

    img.src = uri;
  });
}

/**
 * Compress image for React Native (using ImagePicker quality)
 * For native platforms, we rely on ImagePicker's quality parameter
 * @param uri - Image URI
 * @param quality - Compression quality 0-1 (default: 0.8)
 * @returns Original URI (native platforms handle compression via ImagePicker)
 */
export async function compressImageNative(
  uri: string,
  quality: number = 0.8
): Promise<string> {
  // On native platforms, compression is handled by ImagePicker
  // This function is a placeholder for consistency
  return uri;
}

/**
 * Get image dimensions
 * @param uri - Image URI
 * @returns Image dimensions
 */
export function getImageDimensions(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = reject;
    img.src = uri;
  });
}

