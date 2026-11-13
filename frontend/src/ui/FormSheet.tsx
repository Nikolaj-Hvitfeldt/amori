import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { X } from "lucide-react-native";
import { color, gutter, radius, space } from "../theme";
import { Button, SaveState } from "./Button";
import { Sheet } from "./Sheet";
import { Text } from "./Text";
import { ICON_STROKE, iconSize } from "./icons";

export type FormSheetProps = {
  visible: boolean;
  /** Serif title on one line, e.g. "New date". */
  title: string;
  /** ✕, backdrop, Android back and Esc. The screen decides whether to ask "Discard this …?". */
  onRequestClose: () => void;
  onSave: () => void;
  /** Passed straight to the Save button: Save / Saving… / Saved / Retry. */
  saveState?: SaveState;
  /** Inline message above the fields, e.g. when a save failed [2A]. */
  error?: string | null;
  children: React.ReactNode;
  testID?: string;
};

/**
 * Form sheet anatomy [7A]: a top bar with ✕ (44px), the serif title and an amber
 * Save pill, then a scrollable body. The bar sits above the scroll view inside a
 * KeyboardAvoidingView, so Save stays reachable with the keyboard open.
 */
export function FormSheet({
  visible,
  title,
  onRequestClose,
  onSave,
  saveState = "idle",
  error,
  children,
  testID,
}: FormSheetProps) {
  return (
    <Sheet visible={visible} onRequestClose={onRequestClose} accessibilityLabel={title} testID={testID}>
      <View style={styles.bar}>
        <Button
          variant="icon"
          accessibilityLabel="Close"
          icon={<X size={iconSize.lg} color={color.text} strokeWidth={ICON_STROKE} />}
          onPress={onRequestClose}
        />
        <Text variant="title" numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        <Button variant="primary" saveState={saveState} onPress={onSave} />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {error ? (
          <View style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
            <Text variant="body">{error}</Text>
          </View>
        ) : null}
        {children}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    paddingHorizontal: space.sm,
    paddingVertical: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: color.hairline,
  },
  title: { flex: 1 },
  scroll: { flexGrow: 0 },
  body: { padding: gutter, paddingBottom: space.xxxl, gap: space.xl },
  error: {
    borderWidth: 1,
    borderColor: color.outline,
    borderRadius: radius.field,
    padding: space.md,
  },
});
