import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import ThumbnailImage from "./ThumbnailImage";

interface RotatingPhotoBackgroundProps {
  photos: string[]; // Full-size URLs (ThumbnailImage handles thumbnail loading)
  interval?: number; // Time in ms between photo changes
  style?: any;
}

export default function RotatingPhotoBackground({
  photos,
  interval = 3000,
  style,
}: RotatingPhotoBackgroundProps) {
  // Filter out invalid/blob URLs
  const validPhotos = photos.filter((url) => {
    return url && typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://"));
  });

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (validPhotos.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % validPhotos.length);
    }, interval);

    return () => clearInterval(timer);
  }, [validPhotos.length, interval]);

  if (validPhotos.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <ThumbnailImage
        source={validPhotos[currentIndex]}
        style={styles.image}
        contentFit="cover"
        cachePolicy="disk"
        transition={1500} // Built-in crossfade transition
      />
      {/* Dark overlay for better text readability */}
      <View style={styles.overlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
    borderRadius: 16,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
});
