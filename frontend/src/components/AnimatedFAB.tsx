import React, { useEffect } from "react";
import { StyleSheet, Pressable, Platform, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  interpolate,
  ReduceMotion,
} from "react-native-reanimated";

interface AnimatedFABProps {
  children: React.ReactNode;
  onPress: () => void;
  style?: ViewStyle;
  color?: string;
  size?: number;
  /** Delay before entrance animation (ms) */
  entranceDelay?: number;
}

const springConfig = {
  damping: 12,
  stiffness: 150,
  mass: 0.8,
  reduceMotion: ReduceMotion.Never,
};

const pressSpringConfig = {
  damping: 15,
  stiffness: 400,
  reduceMotion: ReduceMotion.Never,
};

/**
 * Animated Floating Action Button with:
 * - Bounce entrance animation
 * - Scale + rotate on press
 * - Spring physics
 */
export default function AnimatedFAB({
  children,
  onPress,
  style,
  color = "#FF6B9D",
  size = 64,
  entranceDelay = 300,
}: AnimatedFABProps) {
  const scale = useSharedValue(0);
  const pressScale = useSharedValue(1);
  const rotation = useSharedValue(0);

  // Entrance animation - bounce in
  useEffect(() => {
    scale.value = withDelay(
      entranceDelay,
      withSpring(1, {
        ...springConfig,
        damping: 10, // More bounce for entrance
        stiffness: 120,
      })
    );
  }, []);

  const handlePressIn = () => {
    pressScale.value = withSpring(0.9, pressSpringConfig);
    rotation.value = withSpring(15, pressSpringConfig);
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, pressSpringConfig);
    rotation.value = withSpring(0, pressSpringConfig);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value * pressScale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: interpolate(scale.value, [0, 0.5, 1], [0, 0.8, 1]),
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.fab,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
          Platform.OS === "web" ? styles.fabWeb : styles.fabNative,
          style,
          animatedStyle,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 30,
    right: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  fabNative: {
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabWeb: {
    // @ts-ignore - boxShadow is valid for web
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.3)",
  },
});

