import React, { useEffect } from "react";
import { ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  interpolate,
  ReduceMotion,
} from "react-native-reanimated";

interface AnimatedCardProps {
  children: React.ReactNode;
  index: number;
  style?: ViewStyle;
  /** Delay between each card animation in ms (default: 80) */
  staggerDelay?: number;
  /** Animation duration in ms (default: 400) */
  duration?: number;
  /** Animation type: 'fade-slide' | 'fade-scale' | 'spring' (default: 'fade-slide') */
  animationType?: "fade-slide" | "fade-scale" | "spring";
}

/**
 * Animated wrapper for cards with staggered entrance animations
 * Wrap your card components with this to add smooth entrance effects
 */
export default function AnimatedCard({
  children,
  index,
  style,
  staggerDelay = 80,
  duration = 400,
  animationType = "fade-slide",
}: AnimatedCardProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    // Cap the delay so cards don't wait too long (max 8 cards worth of delay)
    const cappedIndex = Math.min(index, 8);
    const delay = cappedIndex * staggerDelay;

    if (animationType === "spring") {
      progress.value = withDelay(
        delay,
        withSpring(1, {
          damping: 12,
          stiffness: 100,
          mass: 0.8,
          reduceMotion: ReduceMotion.Never, // Override system reduced motion setting
        })
      );
    } else {
      progress.value = withDelay(
        delay,
        withTiming(1, {
          duration,
          easing: Easing.out(Easing.cubic),
          reduceMotion: ReduceMotion.Never, // Override system reduced motion setting
        })
      );
    }
  }, [index, staggerDelay, duration, animationType]);

  const animatedStyle = useAnimatedStyle(() => {
    if (animationType === "fade-scale") {
      return {
        opacity: progress.value,
        transform: [
          {
            scale: interpolate(progress.value, [0, 1], [0.9, 1]),
          },
        ],
      };
    }

    if (animationType === "spring") {
      return {
        opacity: progress.value,
        transform: [
          {
            translateY: interpolate(progress.value, [0, 1], [30, 0]),
          },
          {
            scale: interpolate(progress.value, [0, 1], [0.95, 1]),
          },
        ],
      };
    }

    // Default: fade-slide
    return {
      opacity: progress.value,
      transform: [
        {
          translateY: interpolate(progress.value, [0, 1], [20, 0]),
        },
      ],
    };
  });

  return (
    <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
  );
}

/**
 * Hook to create press animation for cards
 * Returns animated style and press handlers
 */
export function useCardPressAnimation() {
  const scale = useSharedValue(1);

  const onPressIn = () => {
    scale.value = withSpring(0.97, {
      damping: 15,
      stiffness: 300,
      reduceMotion: ReduceMotion.Never,
    });
  };

  const onPressOut = () => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
      reduceMotion: ReduceMotion.Never,
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { animatedStyle, onPressIn, onPressOut };
}

