import React from "react";
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { color, radius, space } from "../theme";
import { formatLongDate } from "./format";
import { PhotoImage, PhotoSource } from "./PhotoImage";
import { paperLift } from "./styles";
import { Text } from "./Text";
import { useFocusRing } from "./useFocusRing";

export type EntryType = "moment" | "date" | "milestone";

export const ENTRY_TYPE_LABEL: Record<EntryType, string> = {
  moment: "Moment",
  date: "Date",
  milestone: "Milestone",
};

/** "Date, Pasta night, 24 October 2026" [6B]. */
export function entryAccessibilityLabel(type: EntryType, title: string, date: string): string {
  return `${ENTRY_TYPE_LABEL[type]}, ${title}, ${formatLongDate(date)}`;
}

export type PaperPrintProps = {
  type: EntryType;
  title: string;
  /** Calendar date, "YYYY-MM-DD". */
  date: string;
  coverPhoto?: PhotoSource | null;
  /** A MoodTag / MilestoneTypeTag (pass onPaper). */
  chip?: React.ReactNode;
  body?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** Cover photo aspect (width / height). Not in theme yet (reported as a token gap). */
const COVER_ASPECT = 4 / 3;
const BODY_LINES = 3;

/**
 * A list entry [4A]: a paper print with the cover photo ABOVE the text (never
 * text over a photo), a 2-line title, an italic date, an optional chip and body.
 * One pressable with one combined label.
 */
export function PaperPrint({ type, title, date, coverPhoto, chip, body, onPress, style, testID }: PaperPrintProps) {
  const { onFocus, onBlur, ringStyle } = useFocusRing();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={entryAccessibilityLabel(type, title, date)}
      onPress={onPress}
      disabled={!onPress}
      onFocus={onFocus}
      onBlur={onBlur}
      testID={testID}
      style={({ pressed }) => [styles.print, paperLift, pressed && styles.pressed, ringStyle, style]}
    >
      {coverPhoto ? (
        <View style={styles.photoFrame}>
          <PhotoImage source={coverPhoto} style={styles.photo} testID={testID ? `${testID}-photo` : "print-photo"} />
        </View>
      ) : null}
      <View style={styles.text}>
        <Text variant="title" tone="ink" numberOfLines={2} accessibilityRole="none">
          {title}
        </Text>
        <Text variant="date" tone="inkMuted">
          {formatLongDate(date)}
        </Text>
        {chip ? <View style={styles.chip}>{chip}</View> : null}
        {body ? (
          <Text variant="body" tone="ink" numberOfLines={BODY_LINES}>
            {body}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const PRESSED_OPACITY = 0.92;

const styles = StyleSheet.create({
  print: {
    backgroundColor: color.paper,
    borderRadius: radius.print,
    padding: space.sm,
  },
  pressed: { opacity: PRESSED_OPACITY },
  photoFrame: { borderRadius: radius.print, overflow: "hidden" },
  photo: { width: "100%", aspectRatio: COVER_ASPECT },
  text: { paddingHorizontal: space.sm, paddingTop: space.md, paddingBottom: space.sm, gap: space.xs },
  chip: { marginTop: space.xs, marginBottom: space.xs },
});
