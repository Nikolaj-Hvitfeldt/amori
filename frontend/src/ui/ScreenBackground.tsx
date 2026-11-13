import React from "react";
import { ImageBackground, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { color, grain, vignette } from "../theme";
import { a11yHidden } from "./styles";
import { useReducedEffects } from "./useReducedEffects";

const GRAIN = require("../../assets/ui/grain.png");

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
            <ImageBackground
              source={GRAIN}
              resizeMode="repeat"
              style={StyleSheet.absoluteFill}
              imageStyle={styles.grainImage}
              testID="screen-grain"
            />
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
