import React, { useEffect, useState } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Image, ImageContentFit } from "expo-image";
import { photoTint } from "../theme";
import { ImageOff } from "./ImageOff";
import { a11yHidden } from "./styles";
import { useReducedEffects } from "./useReducedEffects";

/** A remote URL, a bundled asset (require) or an { uri } object. */
export type PhotoSource = string | number | { uri: string };

export type PhotoImageProps = {
  source: PhotoSource;
  /** Amber warmth overlay [DESIGN §4]. Pass tint={false} in the lightbox [7B]. */
  tint?: boolean;
  contentFit?: ImageContentFit;
  style?: StyleProp<ViewStyle>;
  /** Photos inside a labelled pressable are decorative; set a label only for a standalone photo. */
  accessibilityLabel?: string;
  testID?: string;
};

export function toImageSource(source: PhotoSource) {
  return typeof source === "string" ? { uri: source } : source;
}

/**
 * expo-image with the photo tint overlay. On a load error it shows the
 * image-off paper square [2A]. The tint is off under reduced effects.
 */
export function PhotoImage({ source, tint = true, contentFit = "cover", style, accessibilityLabel, testID }: PhotoImageProps) {
  const reduced = useReducedEffects();
  const [failed, setFailed] = useState(false);
  const key = typeof source === "object" ? source.uri : source;

  useEffect(() => setFailed(false), [key]);

  if (failed) return <ImageOff style={[styles.fill, style]} />;

  return (
    <View
      style={[styles.wrap, style]}
      testID={testID}
      accessible={!!accessibilityLabel}
      accessibilityRole={accessibilityLabel ? "image" : undefined}
      accessibilityLabel={accessibilityLabel}
    >
      <Image
        source={toImageSource(source)}
        style={StyleSheet.absoluteFill}
        contentFit={contentFit}
        transition={0}
        onError={() => setFailed(true)}
        accessible={false}
      />
      {tint && !reduced ? (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.tint]} {...a11yHidden} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: "hidden" },
  fill: { aspectRatio: undefined },
  tint: { backgroundColor: photoTint },
});
