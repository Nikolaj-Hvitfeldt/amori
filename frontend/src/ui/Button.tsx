import React from "react";
import { GestureResponderEvent, Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { color, fontFamily, hitTarget, radius, space, type } from "../theme";
import { Text } from "./Text";
import { useFocusRing } from "./useFocusRing";

export type SaveState = "idle" | "saving" | "saved" | "error";

export const SAVE_LABELS: Record<SaveState, string> = {
  idle: "Save",
  saving: "Saving…",
  saved: "Saved",
  error: "Retry",
};

type Common = {
  onPress?: (e: GestureResponderEvent) => void;
  disabled?: boolean;
  /** On a paper surface: secondary/text buttons switch to ink. */
  onPaper?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityHint?: string;
};

type LabelledButton = Common & {
  variant?: "primary" | "secondary" | "text";
  /** Visible label. Ignored when `saveState` is set. */
  label?: string;
  /** Renders Save / Saving… / Saved / Retry. Display only: the screen owns the isSaving guard. */
  saveState?: SaveState;
  /** Optional leading icon element. */
  icon?: React.ReactNode;
  accessibilityLabel?: string;
};

type IconButton = Common & {
  variant: "icon";
  icon: React.ReactNode;
  /** Required: an icon button has no visible text. */
  accessibilityLabel: string;
};

export type ButtonProps = LabelledButton | IconButton;

/**
 * Buttons [7A]: primary (amber pill, onAccent text), secondary (outline),
 * text, and icon (44px). Every variant has a 44×44 minimum hit area.
 *
 * The save state is visual only (Allowed addition #4): Button never blocks a
 * press itself; the screen's isSaving flag does.
 */
export function Button(props: ButtonProps) {
  const { onPress, disabled, onPaper, style, testID, accessibilityHint } = props;
  const { onFocus, onBlur, ringStyle } = useFocusRing();

  if (props.variant === "icon") {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={props.accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: !!disabled }}
        disabled={disabled}
        onPress={onPress}
        onFocus={onFocus}
        onBlur={onBlur}
        testID={testID}
        style={({ pressed }) => [styles.icon, pressed && styles.pressed, disabled && styles.disabled, ringStyle, style]}
      >
        {props.icon}
      </Pressable>
    );
  }

  const variant = props.variant ?? "primary";
  const saveState = props.saveState;
  const label = saveState ? SAVE_LABELS[saveState] : props.label ?? "";
  const textColor =
    variant === "primary" ? color.onAccent : onPaper ? color.ink : color.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, busy: saveState === "saving" }}
      accessibilityLiveRegion={saveState ? "polite" : undefined}
      disabled={disabled}
      onPress={onPress}
      onFocus={onFocus}
      onBlur={onBlur}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" && styles.primary,
        variant === "secondary" && [styles.secondary, onPaper && styles.secondaryOnPaper],
        variant === "text" && styles.text,
        pressed && styles.pressed,
        disabled && styles.disabled,
        ringStyle,
        style,
      ]}
    >
      {props.icon ? <View style={styles.leading}>{props.icon}</View> : null}
      <Text variant="body" style={[styles.label, { color: textColor }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const PRESSED_OPACITY = 0.8;
const DISABLED_OPACITY = 0.5;

const styles = StyleSheet.create({
  base: {
    minHeight: hitTarget,
    minWidth: hitTarget,
    paddingHorizontal: space.xl,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  primary: { backgroundColor: color.accent },
  secondary: { borderWidth: 1, borderColor: color.outline },
  secondaryOnPaper: { borderColor: color.inkMuted },
  text: { paddingHorizontal: space.md },
  icon: {
    width: hitTarget,
    height: hitTarget,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  leading: { marginRight: space.sm },
  label: { fontFamily: fontFamily.sansSemiBold, lineHeight: type.body.lineHeight },
  pressed: { opacity: PRESSED_OPACITY },
  disabled: { opacity: DISABLED_OPACITY },
});
