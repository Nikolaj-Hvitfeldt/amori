import React from "react";
import { TouchableOpacity, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  ReduceMotion,
} from "react-native-reanimated";

interface PressableCardProps {
  children: React.ReactNode;
  onPress: () => void;
  style?: ViewStyle;
}

const springConfig = {
  damping: 15,
  stiffness: 400,
  reduceMotion: ReduceMotion.Never,
};

/**
 * Animated pressable wrapper that adds scale feedback on press
 * Styles are applied to the animated view to preserve layout (including overflow/borderRadius)
 */
export default function PressableCard({
  children,
  onPress,
  style,
}: PressableCardProps) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, springConfig);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      delayLongPress={400}
    >
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </TouchableOpacity>
  );
}
