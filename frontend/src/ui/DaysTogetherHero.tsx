import React, { useMemo } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { gutter, space } from "../theme";
import { daysTogether } from "../utils/daysTogether";
import { Text } from "./Text";

export type DaysTogetherHeroProps = {
  milestones: ReadonlyArray<{ milestone_type: string; date: string }>;
  /** Injected for tests and the gallery. Defaults to now. */
  today?: Date;
  style?: StyleProp<ViewStyle>;
};

/**
 * Days-together hero [3A, T6]: the figure in serif 56 amber plus the italic line.
 * Renders nothing when there is no valid, past met milestone. Read-only.
 * Screen readers hear "N days together" (plus the special-day copy).
 */
export function DaysTogetherHero({ milestones, today, style }: DaysTogetherHeroProps) {
  const result = useMemo(() => daysTogether(milestones, today), [milestones, today]);
  if (!result) return null;
  return (
    <View
      style={[styles.root, style]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={result.accessibilityLabel}
      testID="days-together-hero"
    >
      <Text variant="hero" tone="accent">
        {result.value}
      </Text>
      {result.line ? (
        <Text variant="date" tone="muted" style={styles.line}>
          {result.line}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: space.sm,
    paddingHorizontal: gutter,
    paddingBottom: space.xl,
  },
  line: { flexShrink: 1 },
});
