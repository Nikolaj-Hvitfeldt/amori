import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Ellipsis } from "lucide-react-native";
import { color, motion, space } from "../theme";
import { Button } from "./Button";
import { Sheet } from "./Sheet";
import { ICON_STROKE, iconSize } from "./icons";

export type ActionMenuItem = {
  label: string;
  /** A Lucide icon component, e.g. Pencil. Drawn at iconSize.md in `text`. */
  icon?: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  onPress: () => void;
  /**
   * Marks a destructive action (Delete). It keeps the same text styling as the
   * other rows: the theme has no destructive colour token, and the caller's own
   * confirmation carries the warning.
   */
  destructive?: boolean;
};

export type ActionMenuProps = {
  actions: ActionMenuItem[];
  /** Read after "More options", e.g. "Edit or delete this date". */
  accessibilityHint?: string;
  /** The sheet's dialog label. Default "Options". */
  menuLabel?: string;
  testID?: string;
};

/**
 * The ⋯ menu [DESIGN §7 Detail view]: a 44px "More options" icon button that opens
 * a bottom Sheet listing the actions, then Cancel.
 *
 * - Esc, the backdrop and Android back close it (Sheet → Modal onRequestClose).
 * - Focus goes back to the trigger on web: react-native-web's Modal restores the
 *   element focused before it opened (best effort).
 * - A chosen action runs once the sheet has finished closing (motion.sheetClose),
 *   so a follow-up native Alert or another sheet can present cleanly.
 */
export function ActionMenu({ actions, accessibilityHint, menuLabel = "Options", testID }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (pending.current) clearTimeout(pending.current);
    },
    []
  );

  const run = (fn: () => void) => {
    setOpen(false);
    if (pending.current) clearTimeout(pending.current);
    // Let the sheet close first, so a native confirmation (Alert) can present.
    pending.current = setTimeout(() => {
      pending.current = null;
      fn();
    }, motion.sheetClose);
  };

  return (
    <>
      <Button
        variant="icon"
        accessibilityLabel="More options"
        accessibilityHint={accessibilityHint}
        icon={<Ellipsis size={iconSize.lg} color={color.text} strokeWidth={ICON_STROKE} />}
        onPress={() => setOpen(true)}
        testID={testID}
      />
      <Sheet visible={open} onRequestClose={() => setOpen(false)} accessibilityLabel={menuLabel}>
        <View style={styles.menu} accessibilityRole="menu">
          {actions.map(({ label, icon: Icon, onPress }) => (
            <Button
              key={label}
              variant="text"
              label={label}
              icon={Icon ? <Icon size={iconSize.md} color={color.text} strokeWidth={ICON_STROKE} /> : undefined}
              onPress={() => run(onPress)}
              style={styles.item}
            />
          ))}
          <Button variant="text" label="Cancel" onPress={() => setOpen(false)} style={styles.item} />
        </View>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  menu: { paddingVertical: space.md, paddingHorizontal: space.sm },
  item: { alignSelf: "stretch", justifyContent: "flex-start" },
});
