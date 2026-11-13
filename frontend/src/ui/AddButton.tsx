import React from "react";
import { Pressable, StyleProp, StyleSheet, ViewStyle } from "react-native";
import { Plus } from "lucide-react-native";
import { color, gutter, hitTarget, radius, space } from "../theme";
import { ICON_STROKE, iconSize } from "./icons";
import { paperLift } from "./styles";
import { useFocusRing } from "./useFocusRing";

export type AddButtonProps = {
  onPress: () => void;
  /** e.g. "Add a date". */
  accessibilityLabel: string;
  /** Override the default bottom-right placement (e.g. to sit above the tab bar). */
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** Diameter: one hit target plus a step. */
const SIZE = hitTarget + space.md;

/** The "+" button, bottom-right, with paperLift [1A, 4B]. */
export function AddButton({ onPress, accessibilityLabel, style, testID }: AddButtonProps) {
  const { onFocus, onBlur, ringStyle } = useFocusRing();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onFocus={onFocus}
      onBlur={onBlur}
      testID={testID}
      style={({ pressed }) => [styles.button, paperLift, pressed && styles.pressed, ringStyle, style]}
    >
      <Plus size={iconSize.lg} color={color.onAccent} strokeWidth={ICON_STROKE} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    right: gutter,
    bottom: gutter,
    width: SIZE,
    height: SIZE,
    borderRadius: radius.pill,
    backgroundColor: color.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.85 },
});
