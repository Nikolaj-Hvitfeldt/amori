import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { ImageOff as ImageOffIcon } from "lucide-react-native";
import { color, radius } from "../theme";
import { ICON_STROKE, iconSize } from "./icons";

/** Partial state [2A]: a paper square with a faint image-off icon, for a photo that won't load. */
export function ImageOff({ style, testID }: { style?: StyleProp<ViewStyle>; testID?: string }) {
  return (
    <View
      style={[styles.box, style]}
      accessibilityRole="image"
      accessibilityLabel="Photo couldn't load"
      testID={testID ?? "image-off"}
    >
      <ImageOffIcon size={iconSize.lg} color={color.inkMuted} strokeWidth={ICON_STROKE} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: color.paper,
    borderRadius: radius.print,
    alignItems: "center",
    justifyContent: "center",
    aspectRatio: 1,
  },
});
