import React from "react";
import { StyleProp, StyleSheet, useWindowDimensions, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { webFrame } from "../theme";

export type FrameKind = "list" | "wall";

/**
 * The web frame [6A]. At webFrame.breakpoint (768) and wider, lists and forms
 * sit in a centred 560px column and the Wall in an 840px column with 3 columns.
 * Narrower windows use the full width (Wall: 2 columns).
 */
export function useWebFrame() {
  const { width } = useWindowDimensions();
  const wide = width >= webFrame.breakpoint;
  return {
    wide,
    /** Column width for a frame kind, or undefined when the window is narrow. */
    columnWidth: (kind: FrameKind = "list"): number | undefined =>
      wide ? (kind === "wall" ? webFrame.wallColumn : webFrame.column) : undefined,
    wallColumns: wide ? webFrame.wallColumns : 2,
  };
}

export type ScreenColumnProps = {
  /** "list" (default): 560px from 768px up. "wall": 840px. */
  kind?: FrameKind;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * A tab screen's content area inside the app shell. The shell (AppNavigator)
 * draws the cocoa surface, vignette and grain full-bleed once; this column is
 * transparent, clears the top safe-area inset and, on wide windows, centres the
 * content at column width [6A]. Absolutely positioned children (the "+" button)
 * anchor to the column.
 */
export function ScreenColumn({ kind = "list", children, style, testID }: ScreenColumnProps) {
  const insets = useSafeAreaInsets();
  const { columnWidth } = useWebFrame();
  const max = columnWidth(kind);
  return (
    <View
      testID={testID}
      style={[styles.root, { paddingTop: insets.top }, max !== undefined && { maxWidth: max }, style]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, width: "100%", alignSelf: "center" },
});
