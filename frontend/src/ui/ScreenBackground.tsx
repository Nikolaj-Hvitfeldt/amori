import React from "react";
import { ImageBackground, Platform, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { color, grain, vignette } from "../theme";
import { a11yHidden } from "./styles";
import { useReducedEffects } from "./useReducedEffects";

const GRAIN = require("../../assets/ui/grain.png");

/** Web-only grain tile: grayscale fractal noise, the same role as grain.png on native. */
const WEB_GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='${grain.tile}' height='${grain.tile}'>` +
    "<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/>" +
    "<feColorMatrix type='saturate' values='0'/></filter>" +
    "<rect width='100%' height='100%' filter='url(#n)'/></svg>"
)}")`;

export type ScreenBackgroundProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * The cocoa surface plus atmosphere [DESIGN §4]: the Dusk vignette from the top
 * and a tiled film-grain overlay. Both run full-bleed behind the content, ignore
 * touches, are hidden from assistive tech, and switch off under reduced effects.
 */
export function ScreenBackground({ children, style, testID }: ScreenBackgroundProps) {
  const reduced = useReducedEffects();
  return (
    <View style={[styles.root, style]} testID={testID}>
      {!reduced ? (
        <>
          <LinearGradient
            pointerEvents="none"
            colors={vignette.colors}
            locations={vignette.locations}
            style={styles.vignette}
            {...a11yHidden}
          />
          <View pointerEvents="none" style={StyleSheet.absoluteFill} {...a11yHidden}>
            {Platform.OS === "web" ? (
              // react-native-web draws resizeMode="repeat" as a single tile, and has no
              // resolveAssetSource, so on web the same 128px grain tile is an inline SVG
              // noise pattern on a plain DOM div.
              React.createElement("div", {
                "data-testid": "screen-grain",
                style: {
                  position: "absolute",
                  inset: 0,
                  opacity: grain.opacity,
                  backgroundImage: WEB_GRAIN,
                  backgroundRepeat: "repeat",
                  backgroundSize: `${grain.tile}px ${grain.tile}px`,
                },
              })
            ) : (
              <ImageBackground
                source={GRAIN}
                resizeMode="repeat"
                style={StyleSheet.absoluteFill}
                imageStyle={styles.grainImage}
                testID="screen-grain"
              />
            )}
          </View>
        </>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.surface },
  vignette: { position: "absolute", top: 0, left: 0, right: 0, height: vignette.height },
  // The PNG is grain.tile (128) px square; resizeMode="repeat" tiles it at that size.
  grainImage: { opacity: grain.opacity },
});
