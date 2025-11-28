import React from "react";
import { View, StyleSheet } from "react-native";
import {
  ACCENT_CIRCLE_SIZE,
  ACCENT_CIRCLE_SIZE_LARGE,
  ACCENT_CIRCLE_OFFSET,
  ACCENT_CIRCLE_OFFSET_LARGE,
} from "../../constants/spacing";

interface DecorativeAccentProps {
  color: string;
  size?: "default" | "large";
  opacity?: number;
}

export default function DecorativeAccent({
  color,
  size = "default",
  opacity = 0.5,
}: DecorativeAccentProps) {
  const circleSize =
    size === "large" ? ACCENT_CIRCLE_SIZE_LARGE : ACCENT_CIRCLE_SIZE;
  const offset = size === "large" ? ACCENT_CIRCLE_OFFSET_LARGE : ACCENT_CIRCLE_OFFSET;

  return (
    <View
      style={[
        styles.circle,
        {
          width: circleSize,
          height: circleSize,
          borderRadius: circleSize / 2,
          backgroundColor: color + "15",
          top: offset,
          right: offset,
          opacity,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  circle: {
    position: "absolute",
  },
});

