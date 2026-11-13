import React, { useEffect, useRef } from "react";
import { Animated, Easing, Platform, Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { color, easing, motion, polaroid, radius } from "../theme";
import { formatLongDate } from "./format";
import { PhotoImage, PhotoSource } from "./PhotoImage";
import { a11yHidden, paperLift } from "./styles";
import { Text } from "./Text";
import { useFocusRing } from "./useFocusRing";
import { useReducedEffects } from "./useReducedEffects";

/** FNV-1a 32-bit hash: deterministic, no Math.random. */
export function hashString(value: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Tilt in degrees, seeded from the entry id, within ±polaroid.maxTiltDeg, to 0.1°. */
export function polaroidTilt(id: string): number {
  const unit = hashString(id) / 0xffffffff; // 0..1
  const deg = (unit * 2 - 1) * polaroid.maxTiltDeg;
  return Math.round(deg * 10) / 10;
}

/** Photos that have already "developed" this session [5C]. Module-level on purpose. */
const developed = new Set<string>();

/** For tests: forget which photos have developed. */
export function resetDevelopedPhotos(): void {
  developed.clear();
}

/** How washed-out the print starts before developing. Not in theme yet (reported as a token gap). */
const DEVELOP_WASH = 0.6;

export type PolaroidProps = {
  /** Entry id: seeds the tilt. */
  id: string;
  title: string;
  /** Calendar date, "YYYY-MM-DD". */
  date: string;
  photo: PhotoSource;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

function photoKey(photo: PhotoSource): string {
  return typeof photo === "object" ? photo.uri : String(photo);
}

/**
 * Polaroid [5A, 5C, 6B]: 8px paper frame, 28px italic date caption, tape and a
 * seeded tilt. The first time a photo appears in a session it "develops" from a
 * washed-out warm print to its resting tone over 600ms (off under reduced effects).
 * A button labelled "Photo from <title>, <date>".
 */
export function Polaroid({ id, title, date, photo, onPress, style, testID }: PolaroidProps) {
  const reduced = useReducedEffects();
  const { onFocus, onBlur, ringStyle } = useFocusRing();
  const key = photoKey(photo);
  const shouldDevelop = !reduced && !developed.has(key);
  const wash = useRef(new Animated.Value(shouldDevelop ? DEVELOP_WASH : 0)).current;
  const tilt = polaroidTilt(id);

  useEffect(() => {
    if (developed.has(key) || reduced) {
      developed.add(key);
      wash.setValue(0);
      return;
    }
    developed.add(key);
    wash.setValue(DEVELOP_WASH);
    Animated.timing(wash, {
      toValue: 0,
      duration: motion.develop,
      easing: Easing.bezier(...easing.out),
      useNativeDriver: Platform.OS !== "web",
    }).start();
    // Runs once per photo; `reduced` flipping later doesn't replay it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const formatted = formatLongDate(date);
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : "image"}
      accessibilityLabel={`Photo from ${title}, ${formatted}`}
      onPress={onPress}
      disabled={!onPress}
      onFocus={onFocus}
      onBlur={onBlur}
      testID={testID}
      style={[styles.frame, paperLift, { transform: [{ rotate: `${tilt}deg` }] }, ringStyle, style]}
    >
      <View style={styles.photoBox}>
        <PhotoImage source={photo} style={StyleSheet.absoluteFill} />
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.wash, { opacity: wash }]}
          {...a11yHidden}
        />
      </View>
      <View style={styles.caption}>
        <Text variant="date" tone="inkMuted" numberOfLines={1}>
          {formatted}
        </Text>
      </View>
      <View pointerEvents="none" style={styles.tape} {...a11yHidden} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: color.paper,
    borderRadius: radius.print,
    paddingTop: polaroid.frame,
    paddingHorizontal: polaroid.frame,
  },
  photoBox: { width: "100%", aspectRatio: 1, overflow: "hidden" },
  wash: { backgroundColor: color.paper },
  caption: { height: polaroid.caption, alignItems: "center", justifyContent: "center" },
  tape: {
    position: "absolute",
    top: -polaroid.tape.height / 2,
    left: "50%",
    marginLeft: -polaroid.tape.width / 2,
    width: polaroid.tape.width,
    height: polaroid.tape.height,
    backgroundColor: color.tape,
  },
});
