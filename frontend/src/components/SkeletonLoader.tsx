import React, { useEffect } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
  ReduceMotion,
} from "react-native-reanimated";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

interface SkeletonCardProps {
  variant: "moment" | "date" | "milestone";
  style?: ViewStyle;
}

const SHIMMER_DURATION = 1500;

/**
 * Base skeleton element with shimmer animation
 */
export function Skeleton({
  width = "100%",
  height = 20,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, {
        duration: SHIMMER_DURATION,
        easing: Easing.inOut(Easing.ease),
        reduceMotion: ReduceMotion.Never,
      }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(shimmer.value, [0, 1], [-100, 100]);
    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View
      style={[
        {
          width: typeof width === "number" ? width : (width as any),
          height,
          borderRadius,
          backgroundColor: "rgba(255, 255, 255, 0.08)",
          overflow: "hidden",
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            width: "50%",
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

/**
 * Skeleton card matching different entry types
 */
export function SkeletonCard({ variant, style }: SkeletonCardProps) {
  const colors = {
    moment: {
      bg: "rgba(255, 107, 157, 0.1)",
      border: "rgba(255, 107, 157, 0.2)",
    },
    date: {
      bg: "rgba(155, 89, 182, 0.1)",
      border: "rgba(155, 89, 182, 0.2)",
    },
    milestone: {
      bg: "rgba(255, 215, 0, 0.1)",
      border: "rgba(255, 215, 0, 0.2)",
    },
  };

  const color = colors[variant];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: color.bg,
          borderColor: color.border,
        },
        style,
      ]}
    >
      {/* Image placeholder */}
      <Skeleton height={180} borderRadius={12} style={{ marginBottom: 16 }} />

      {/* Title */}
      <Skeleton width="70%" height={24} style={{ marginBottom: 12 }} />

      {/* Date/subtitle */}
      <Skeleton width="40%" height={16} style={{ marginBottom: 16 }} />

      {/* Description lines */}
      <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
      <Skeleton width="90%" height={14} style={{ marginBottom: 8 }} />
      <Skeleton width="60%" height={14} />
    </View>
  );
}

/**
 * Full skeleton list for loading states
 */
export function SkeletonList({
  variant,
  count = 3,
}: {
  variant: "moment" | "date" | "milestone";
  count?: number;
}) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard
          key={`skeleton-${index}`}
          variant={variant}
          style={{ marginBottom: 16 }}
        />
      ))}
    </View>
  );
}

/**
 * Timeline skeleton with alternating card positions
 */
export function TimelineSkeleton({ count = 4 }: { count?: number }) {
  const variants: Array<"moment" | "date" | "milestone"> = [
    "moment",
    "date",
    "milestone",
    "moment",
  ];

  return (
    <View style={styles.timelineContainer}>
      {/* Rope placeholder */}
      <View style={styles.ropePlaceholder} />

      {Array.from({ length: count }).map((_, index) => (
        <View
          key={`timeline-skeleton-${index}`}
          style={[
            styles.timelineCard,
            index % 2 === 0 ? styles.leftCard : styles.rightCard,
          ]}
        >
          <SkeletonCard
            variant={variants[index % variants.length]}
            style={{ marginHorizontal: 0 }}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 20,
  },
  list: {
    paddingVertical: 20,
  },
  timelineContainer: {
    paddingVertical: 20,
    position: "relative",
  },
  ropePlaceholder: {
    position: "absolute",
    left: "50%",
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "rgba(218, 165, 32, 0.2)",
    borderRadius: 2,
    marginLeft: -2,
  },
  timelineCard: {
    width: "48%",
    marginBottom: 20,
  },
  leftCard: {
    alignSelf: "flex-start",
    marginLeft: 10,
  },
  rightCard: {
    alignSelf: "flex-end",
    marginRight: 10,
  },
});

export default Skeleton;

