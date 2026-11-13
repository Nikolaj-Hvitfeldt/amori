import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { Check, X } from "lucide-react-native";
import { color, field, gutter, space } from "../theme";
import { Button } from "./Button";
import { Sheet } from "./Sheet";
import { Text } from "./Text";
import { ICON_STROKE, iconSize } from "./icons";
import { useFocusRing } from "./useFocusRing";
import { select as hapticSelect } from "./haptics";

export type SelectOption<T extends string> = { value: T; label: string; icon?: LucideIcon };

export type SelectSheetProps<T extends string> = {
  visible: boolean;
  title: string;
  options: ReadonlyArray<SelectOption<T>>;
  value?: T | null;
  onSelect: (value: T) => void;
  onRequestClose: () => void;
  testID?: string;
};

/** Bottom sheet listing options (built on React Native's Modal, no extra dependency). */
export function SelectSheet<T extends string>({
  visible,
  title,
  options,
  value,
  onSelect,
  onRequestClose,
  testID,
}: SelectSheetProps<T>) {
  return (
    <Sheet visible={visible} onRequestClose={onRequestClose} accessibilityLabel={title} testID={testID}>
      <View style={styles.bar}>
        <Text variant="title" numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        <Button
          variant="icon"
          accessibilityLabel="Close"
          icon={<X size={iconSize.lg} color={color.text} strokeWidth={ICON_STROKE} />}
          onPress={onRequestClose}
        />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.list} accessibilityRole="radiogroup">
        {options.map((o) => (
          <Row
            key={o.value}
            option={o}
            selected={o.value === value}
            onPress={() => {
              hapticSelect();
              onSelect(o.value);
            }}
          />
        ))}
      </ScrollView>
    </Sheet>
  );
}

function Row<T extends string>({
  option,
  selected,
  onPress,
}: {
  option: SelectOption<T>;
  selected: boolean;
  onPress: () => void;
}) {
  const { onFocus, onBlur, ringStyle } = useFocusRing();
  const Icon = option.icon;
  const fg = selected ? color.accent : color.text;
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={option.label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      onFocus={onFocus}
      onBlur={onBlur}
      style={({ pressed }) => [styles.row, pressed && styles.pressed, ringStyle]}
    >
      {Icon ? <Icon size={iconSize.md} color={fg} strokeWidth={ICON_STROKE} /> : null}
      <Text variant="body" style={[styles.rowLabel, { color: fg }]}>
        {option.label}
      </Text>
      {selected ? <Check size={iconSize.md} color={color.accent} strokeWidth={ICON_STROKE} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: gutter,
    paddingRight: space.sm,
    paddingVertical: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: color.hairline,
  },
  title: { flex: 1 },
  scroll: { flexGrow: 0 },
  list: { paddingVertical: space.sm, paddingBottom: space.xl },
  row: {
    minHeight: field.height,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingHorizontal: gutter,
  },
  pressed: { backgroundColor: color.surfaceRaised },
  rowLabel: { flex: 1 },
});
