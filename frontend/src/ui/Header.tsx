import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { gutter, radius, section as sectionColors, SectionKey, space } from "../theme";
import { a11yHidden } from "./styles";
import { Text } from "./Text";

export type HeaderProps = {
  /** "Our story", "Moments", "Dates", "Milestones", "Memory wall" [1B]. */
  title: string;
  /** Italic tagline under the title (Story). */
  tagline?: string;
  /** Which section this screen is; sets the small accent mark. */
  section: SectionKey;
  /** Optional trailing control (e.g. a ⋯ menu Button). */
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Accent mark size. Not in theme yet (reported as a token gap). */
const MARK = space.sm;

/**
 * Section-aware screen header: an upright serif title in `text` (never amber
 * accent words [4C]), an optional italic tagline, and a small mark in the
 * section's accent. The Wall has no accent, so it shows no mark.
 */
export function Header({ title, tagline, section, right, style }: HeaderProps) {
  return (
    <View style={[styles.root, style]}>
      <View style={styles.text}>
        <Text variant="display">{title}</Text>
        {tagline ? (
          <View style={styles.taglineRow}>
            {section !== "wall" ? (
              <View style={[styles.mark, { backgroundColor: sectionColors[section].onSurface }]} {...a11yHidden} />
            ) : null}
            <Text variant="date" tone="muted">
              {tagline}
            </Text>
          </View>
        ) : section !== "wall" ? (
          <View style={[styles.mark, styles.markAlone, { backgroundColor: sectionColors[section].onSurface }]} {...a11yHidden} />
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
  taglineRow: { flexDirection: "row", alignItems: "center", gap: space.sm },
  mark: { width: MARK, height: MARK, borderRadius: radius.pill },
  markAlone: { marginTop: space.xs },
});
