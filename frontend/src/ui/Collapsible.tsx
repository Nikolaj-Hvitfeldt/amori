import React, { useState } from "react";
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { color, field, space } from "../theme";
import { Text } from "./Text";
import { ICON_STROKE, iconSize } from "./icons";
import { useFocusRing } from "./useFocusRing";

export type CollapsibleProps = {
  /** Default "More details" [7A]. */
  title?: string;
  /** Muted one-line summary of what's inside, e.g. "Location, highlights, weather". */
  summary?: string;
  /** Controlled open state; omit for uncontrolled. */
  open?: boolean;
  defaultOpen?: boolean;
  onToggle?: (open: boolean) => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** Collapsed "More details" section [7A]. The header exposes aria-expanded. */
export function Collapsible({
  title = "More details",
  summary,
  open,
  defaultOpen = false,
  onToggle,
  children,
  style,
  testID,
}: CollapsibleProps) {
  const [inner, setInner] = useState(defaultOpen);
  const isOpen = open ?? inner;
  const { onFocus, onBlur, ringStyle } = useFocusRing();
  const Chevron = isOpen ? ChevronUp : ChevronDown;

  return (
    <View style={style} testID={testID}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={summary ? `${title}, ${summary}` : title}
        accessibilityState={{ expanded: isOpen }}
        aria-expanded={isOpen}
        onPress={() => {
          const next = !isOpen;
          setInner(next);
          onToggle?.(next);
        }}
        onFocus={onFocus}
        onBlur={onBlur}
        style={[styles.header, ringStyle]}
      >
        <View style={styles.text}>
          <Text variant="heading" accessibilityRole="none">
            {title}
          </Text>
          {summary ? (
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {summary}
            </Text>
          ) : null}
        </View>
        <Chevron size={iconSize.md} color={color.textMuted} strokeWidth={ICON_STROKE} />
      </Pressable>
      {isOpen ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: field.height,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    borderTopWidth: 1,
    borderTopColor: color.hairline,
    paddingTop: space.md,
  },
  text: { flex: 1, gap: space.xs },
  body: { gap: space.xl, paddingTop: space.lg },
});
