import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { gutter, SectionKey, space } from "../theme";
import { Text } from "./Text";

export type HeaderProps = {
  /** "Our story", "Moments", "Dates", "Milestones", "Memory wall" [1B]. */
  title: string;
  /** Italic tagline under the title (Story). */
  tagline?: string;
  /** Which section this screen is (reserved for section-aware chrome; no colour mark: amber discipline [4C]). */
  section: SectionKey;
  /** Optional trailing control (e.g. a ⋯ menu Button). */
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Screen header: an upright serif title in `text` (never amber accent words
 * [4C]) and an optional italic tagline.
 */
export function Header({ title, tagline, right, style }: HeaderProps) {
  return (
    <View style={[styles.root, style]}>
      <View style={styles.text}>
        <Text variant="display">{title}</Text>
        {tagline ? (
          <Text variant="date" tone="muted">
            {tagline}
          </Text>
        ) : null}
      </View>
      {right ? <View>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: gutter,
    paddingTop: space.xl,
    paddingBottom: space.lg,
  },
  text: { flex: 1, gap: space.xs },
});
