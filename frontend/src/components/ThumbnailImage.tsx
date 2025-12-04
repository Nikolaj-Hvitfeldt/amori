import React, { useState, useCallback } from "react";
import { Image, ImageProps, ImageSource } from "expo-image";
import { getThumbnailUrl } from "../utils/imageUtils";

interface ThumbnailImageProps extends Omit<ImageProps, "source"> {
  /**
   * The full-size image URL. Will attempt to load thumbnail first,
   * then fall back to this URL if thumbnail fails.
   */
  source: string;
  /**
   * If true, skip thumbnail and load full image directly.
   * Useful for detail views where you want full resolution.
   */
  skipThumbnail?: boolean;
}

/**
 * Image component that automatically tries to load thumbnail first,
 * with fallback to full-size image if thumbnail doesn't exist.
 */
export default function ThumbnailImage({
  source,
  skipThumbnail = false,
  ...props
}: ThumbnailImageProps) {
  const [useFallback, setUseFallback] = useState(false);

  const handleError = useCallback(() => {
    if (!useFallback && !skipThumbnail) {
      // Thumbnail failed, try full-size image
      setUseFallback(true);
    }
  }, [useFallback, skipThumbnail]);

  // Determine which URL to use
  const imageUrl = skipThumbnail || useFallback 
    ? source 
    : getThumbnailUrl(source);

  return (
    <Image
      {...props}
      source={imageUrl}
      onError={handleError}
    />
  );
}

