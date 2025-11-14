import React, { useEffect, useRef, useState } from "react";
import { View, Image, Animated, StyleSheet, Dimensions, Platform } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface RotatingPhotoBackgroundProps {
  photos: string[];
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
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (validPhotos.length <= 1) return;

    const timer = setInterval(() => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1500,
        useNativeDriver: Platform.OS !== "web",
      }).start(() => {
        // Change photo
        setCurrentIndex((prev) => (prev + 1) % validPhotos.length);
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: Platform.OS !== "web",
        }).start();
      });
    }, interval);

    return () => clearInterval(timer);
  }, [validPhotos.length, interval]);

  if (validPhotos.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <Animated.Image
        source={{ uri: validPhotos[currentIndex] }}
        style={[styles.image, { opacity: fadeAnim }]}
        resizeMode="cover"
        onError={(error) => {
          console.warn("Failed to load rotating background image:", validPhotos[currentIndex], error);
          // Try to skip to next photo if current one fails
          if (validPhotos.length > 1) {
            setCurrentIndex((prev) => (prev + 1) % validPhotos.length);
          }
        }}
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

