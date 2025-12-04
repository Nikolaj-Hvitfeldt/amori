import React, { useEffect } from "react";
import { View, Text } from "react-native";

interface SuccessCheckmarkProps {
  visible: boolean;
  onHide: () => void;
  size?: number;
  color?: string;
  duration?: number;
}

/**
 * Success checkmark overlay - controlled by parent via visible prop
 */
export default function SuccessCheckmark({
  visible,
  onHide,
  size = 100,
  color = "#4CAF50",
  duration = 1800,
}: SuccessCheckmarkProps) {
  
  useEffect(() => {
    if (visible) {
      const timeout = setTimeout(() => {
        onHide();
      }, duration);
      return () => clearTimeout(timeout);
    }
  }, [visible, duration, onHide]);

  if (!visible) return null;

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999999,
      }}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "#FFF",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color, fontSize: size * 0.5, fontWeight: "bold" }}>
          ✓
        </Text>
      </View>
      <Text style={{ color: "#FFF", marginTop: 20, fontSize: 18 }}>
        Saved!
      </Text>
    </View>
  );
}
