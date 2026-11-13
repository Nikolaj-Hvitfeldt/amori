import React, { forwardRef, useState } from "react";
import { Platform, StyleProp, StyleSheet, TextInput, TextInputProps, View, ViewStyle } from "react-native";
import { CircleAlert } from "lucide-react-native";
import { color, field, focus, radius, space, type } from "../theme";
import { Text } from "./Text";
import { ICON_STROKE, iconSize } from "./icons";

export type InputProps = Omit<TextInputProps, "style"> & {
  /** Always shown above the field, never placeholder-only [7A]. */
  label: string;
  /** Inline error under the field. */
  error?: string | null;
  multiline?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

/** Multiline fields start at this many field heights. */
const MULTILINE_ROWS = 2;

/**
 * Text field [7A]: label above, 52px on surfaceRaised, 2px amber outline when focused.
 */
export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, multiline, containerStyle, onFocus, onBlur, ...rest },
  ref
) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.container, containerStyle]}>
      <Text variant="caption" tone="muted" uppercase style={styles.label} nativeID={rest.nativeID ? `${rest.nativeID}-label` : undefined}>
        {label}
      </Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        aria-invalid={error ? true : undefined}
        placeholderTextColor={color.textMuted}
        selectionColor={color.accent}
        cursorColor={color.accent}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.field,
          multiline && styles.multiline,
          focused && styles.focused,
          Platform.OS === "web" && styles.webNoOutline,
        ]}
        {...rest}
      />
      {error ? (
        <View style={styles.errorRow} accessibilityLiveRegion="polite" accessibilityRole="alert">
          <CircleAlert size={iconSize.sm} color={color.text} strokeWidth={ICON_STROKE} />
          <Text variant="caption" tone="text" style={styles.errorText}>
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { alignSelf: "stretch" },
  label: { marginBottom: space.sm },
  field: {
    minHeight: field.height,
    backgroundColor: color.surfaceRaised,
    borderRadius: radius.field,
    borderWidth: focus.width,
    borderColor: "transparent",
    paddingHorizontal: space.lg,
    color: color.text,
    fontFamily: type.body.fontFamily,
    fontSize: type.body.fontSize,
  },
  multiline: {
    minHeight: field.height * MULTILINE_ROWS,
    paddingTop: space.md,
    paddingBottom: space.md,
    lineHeight: type.body.lineHeight,
  },
  focused: { borderColor: color.accent },
  webNoOutline: { outlineWidth: 0 },
  errorRow: { flexDirection: "row", alignItems: "center", marginTop: space.sm, gap: space.sm },
  errorText: { flexShrink: 1 },
});
