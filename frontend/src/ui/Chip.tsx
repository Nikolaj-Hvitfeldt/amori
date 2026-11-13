import React from "react";
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { color, hitTarget, radius, section as sectionColors, SectionKey, space } from "../theme";
import { Text } from "./Text";
import { ICON_STROKE, iconSize } from "./icons";
import { useFocusRing } from "./useFocusRing";
import { select as hapticSelect } from "./haptics";

export type ChipProps = {
  label: string;
  icon?: LucideIcon;
  /** Section colour [5B]: Dates lavender, Milestones sage. */
  section: SectionKey;
  selected?: boolean;
  /** On paper, the unselected chip uses the section's ink variant. */
  onPaper?: boolean;
  /** Without onPress the chip is a static tag. */
  onPress?: () => void;
  /** "radio" for single-choice groups (mood, type); default "button". */
  role?: "button" | "radio" | "checkbox";
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** Visual chip height; the hit area is padded out to 44 with hitSlop. */
const CHIP_HEIGHT = space.xxl;
const SLOP = Math.max(0, (hitTarget - CHIP_HEIGHT) / 2);

/**
 * Icon + word in a section colour. Selected: filled with the section accent and
 * onAccent text. Unselected: an outline in the accent.
 */
export function Chip({ label, icon: Icon, section, selected, onPaper, onPress, role = "button", style, testID }: ChipProps) {
  const { onFocus, onBlur, ringStyle } = useFocusRing();
  const accent = onPaper && !selected ? sectionColors[section].onPaper : sectionColors[section].onSurface;
  const fg = selected ? color.onAccent : accent;
  const body = (
    <>
      {Icon ? <Icon size={iconSize.sm} color={fg} strokeWidth={ICON_STROKE} /> : null}
      <Text variant="caption" style={{ color: fg }} numberOfLines={1}>
        {label}
      </Text>
    </>
  );
  const chipStyle = [
    styles.chip,
    { borderColor: accent },
    selected && { backgroundColor: sectionColors[section].onSurface, borderColor: sectionColors[section].onSurface },
  ];

  if (!onPress) {
    return (
      <View style={[chipStyle, style]} testID={testID} accessibilityLabel={label}>
        {body}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityState={role === "button" ? { selected: !!selected } : { checked: !!selected }}
      hitSlop={{ top: SLOP, bottom: SLOP }}
      onPress={() => {
        hapticSelect();
        onPress();
      }}
      onFocus={onFocus}
      onBlur={onBlur}
      testID={testID}
      style={[chipStyle, ringStyle, style]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: CHIP_HEIGHT,
    paddingHorizontal: space.md,
    borderRadius: radius.field,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: space.xs,
  },
});
