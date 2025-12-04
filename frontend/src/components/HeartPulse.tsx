import React, { useEffect } from "react";
import { Animated, StyleSheet } from "react-native";

interface PulsingHeartProps {
  size?: number;
  style?: any;
}

/**
 * Simple pulsing heart using React Native's Animated API
 */
export function PulsingHeart({ size = 32, style }: PulsingHeartProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Create looping pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 300,
          useNativeDriver: false, // Required for web
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.delay(600), // Pause between heartbeats
      ])
    );

    pulse.start();

    return () => pulse.stop();
  }, []);

  return (
    <Animated.Text
      style={[
        styles.heart,
        { fontSize: size, transform: [{ scale: scaleAnim }] },
        style,
      ]}
    >
      💕
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  heart: {
    textAlign: "center",
  },
});

export default PulsingHeart;
