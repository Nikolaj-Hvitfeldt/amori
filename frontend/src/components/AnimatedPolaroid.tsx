import React, { useMemo, useRef } from "react";
import { StyleSheet, Pressable, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  ReduceMotion,
  interpolate,
} from "react-native-reanimated";

interface AnimatedPolaroidProps {
  children: React.ReactNode;
  width: number;
  initialRotation?: number;
  initialOffsetX?: number;
  initialOffsetY?: number;
  onTap?: () => void;
  onLongPress?: () => void;
}

const springConfig = {
  damping: 15,
  stiffness: 200,
  reduceMotion: ReduceMotion.Never,
};

export default function AnimatedPolaroid({
  children,
  width,
  initialRotation = 0,
  initialOffsetX = 0,
  initialOffsetY = 0,
  onTap,
  onLongPress,
}: AnimatedPolaroidProps) {
  // Random wobble offset for this polaroid
  const wobbleOffset = useMemo(() => (Math.random() - 0.5) * 3, []);
  
  // Track if long press was triggered
  const longPressTriggered = useRef(false);

  // Animation values
  const scale = useSharedValue(1);
  const rotation = useSharedValue(initialRotation);
  const isPressed = useSharedValue(0);

  const handlePressIn = () => {
    longPressTriggered.current = false;
    scale.value = withSpring(1.05, springConfig);
    rotation.value = withSpring(initialRotation + wobbleOffset, springConfig);
    isPressed.value = 1;
  };

  const handlePressOut = () => {
    // Spring back animation
    scale.value = withSpring(1, springConfig);
    rotation.value = withSpring(initialRotation, springConfig);
    isPressed.value = 0;
    
    // Open full view on release ONLY if it was a long press
    if (onTap && longPressTriggered.current) {
      onTap();
    }
  };
  
  const handleLongPress = () => {
    // Mark that long press happened (view opens on release)
    longPressTriggered.current = true;
  };
  
  const handlePress = () => {
    // Immediate tap - open full view right away
    if (onTap) {
      onTap();
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    const shadowOp = interpolate(isPressed.value, [0, 1], [0.25, 0.4]);
    const zIndexValue = interpolate(isPressed.value, [0, 1], [1, 50]);

    return {
      transform: [
        { translateX: initialOffsetX },
        { translateY: initialOffsetY },
        { rotate: `${rotation.value}deg` },
        { scale: scale.value },
      ],
      zIndex: zIndexValue,
      shadowOpacity: shadowOp,
    };
  });

  // Prevent right-click context menu on web
  const webProps = Platform.OS === "web" ? {
    onContextMenu: (e: any) => e.preventDefault(),
  } : {};

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      delayLongPress={500}
      style={{ width }}
      {...webProps}
    >
      <Animated.View style={[styles.container, { width }, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
});
