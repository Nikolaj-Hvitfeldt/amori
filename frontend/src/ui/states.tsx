/**
 * State pieces [2A, T4]: Skeleton, EmptySlip, ErrorSlip, SavedCopyNote, UploadRing.
 * (ImageOff lives in its own file because PhotoImage uses it.)
 */
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, LayoutChangeEvent, Platform, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Svg, { Circle } from "react-native-svg";
import type { SectionKey } from "../theme";
import { color, polaroid, radius, space, type } from "../theme";
import { Button } from "./Button";
import { PhotoImage, PhotoSource } from "./PhotoImage";
import { a11yHidden, paperLift } from "./styles";
import { Text } from "./Text";
import { useReducedEffects } from "./useReducedEffects";

/* ---------------------------------------------------------------- Skeleton */

/** One shimmer sweep. Not a motion token: a loading indicator, off under reduced effects. */
const SHIMMER_MS = 1400;

export type SkeletonProps = {
  /** Number of skeleton prints. Default 3. */
  count?: number;
  /** Show a photo block on alternate prints. Default true. */
  withPhotos?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Loading [2A]: paper-shaped skeleton prints, dim cream on cocoa. The shimmer is
 * the only repeating motion in the app, approved by 2A, and is off under reduced effects.
 */
export function Skeleton({ count = 3, withPhotos = true, style }: SkeletonProps) {
  const reduced = useReducedEffects();
  const [width, setWidth] = useState(0);
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced || width === 0) return;
    const anim = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: SHIMMER_MS,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== "web",
      })
    );
    anim.start();
    return () => anim.stop();
  }, [reduced, width, sweep]);

  const translateX = sweep.interpolate({ inputRange: [0, 1], outputRange: [-width, width] });

  return (
    <View
      style={[styles.skeletonList, style]}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      accessibilityState={{ busy: true }}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      testID="skeleton"
    >
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.skeletonPrint} {...a11yHidden}>
          {withPhotos && i % 2 === 0 ? <View style={styles.skeletonPhoto} /> : null}
          <View style={[styles.skeletonLine, styles.skeletonTitle]} />
          <View style={[styles.skeletonLine, styles.skeletonDate]} />
          {!reduced && width > 0 ? (
            <Animated.View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, styles.shimmer, { transform: [{ translateX }] }]}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}

/* --------------------------------------------------------------- EmptySlip */

/** Approved empty-state copy [2A]. */
export const EMPTY_COPY: Record<Exclude<SectionKey, "wall">, { message: string; action: string }> & {
  wall: { message: string; action?: string };
} = {
  story: { message: "Your story starts here", action: "Add your first moment" },
  moments: { message: "No moments yet. The next one goes here.", action: "Add a moment" },
  dates: { message: "No dates yet. The next one goes here.", action: "Add a date" },
  milestones: { message: "No milestones yet. The next one goes here.", action: "Add a milestone" },
  wall: { message: "Photos you add to any entry land here." },
};

export type EmptySlipProps = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Empty [2A]: one blank taped paper slip with copy and an Add button. */
export function EmptySlip({ message, actionLabel, onAction, style }: EmptySlipProps) {
  return (
    <View style={[styles.slip, paperLift, style]} testID="empty-slip">
      <View pointerEvents="none" style={styles.tape} {...a11yHidden} />
      <Text variant="title" tone="ink" style={styles.center}>
        {message}
      </Text>
      {actionLabel && onAction ? (
        <Button variant="primary" label={actionLabel} onPress={onAction} style={styles.centerSelf} />
      ) : null}
    </View>
  );
}

/* --------------------------------------------------------------- ErrorSlip */

export type ErrorSlipProps = {
  /** What couldn't be reached, e.g. "your story", "your dates". */
  what: string;
  onRetry: () => void;
  /** Also show "Showing your saved copy" under the slip. */
  showingSavedCopy?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Error [2A]: a paper slip in ink, "Couldn't reach … Check your connection." with Try again. */
export function ErrorSlip({ what, onRetry, showingSavedCopy, style }: ErrorSlipProps) {
  return (
    <View style={style}>
      <View style={[styles.slip, paperLift]} accessibilityRole="alert" testID="error-slip">
        <Text variant="body" tone="ink" style={styles.center}>
          {`Couldn't reach ${what}. Check your connection.`}
        </Text>
        <Button variant="secondary" onPaper label="Try again" onPress={onRetry} style={styles.centerSelf} />
      </View>
      {showingSavedCopy ? <SavedCopyNote style={styles.note} /> : null}
    </View>
  );
}

/* ----------------------------------------------------------- SavedCopyNote */

/** A small note shown when a cached copy is on screen after a failed load [2A]. */
export function SavedCopyNote({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={style} accessibilityLiveRegion="polite">
      <Text variant="caption" tone="muted" style={styles.center}>
        Showing your saved copy
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------- UploadRing */

export type UploadRingProps = {
  photo: PhotoSource;
  /** 0..1. */
  progress: number;
  /** Thumbnail edge in px. Default 72. */
  size?: number;
  style?: StyleProp<ViewStyle>;
};

const RING_STROKE = 3;

/** Upload [2A]: a progress ring over a dimmed thumbnail. */
export function UploadRing({ photo, progress, size = space.xxxl + space.xl, style }: UploadRingProps) {
  const p = Math.max(0, Math.min(1, progress));
  const r = size / 2 - space.md;
  const circumference = 2 * Math.PI * r;
  const pct = Math.round(p * 100);
  return (
    <View
      style={[styles.thumb, { width: size, height: size }, style]}
      accessibilityRole="progressbar"
      accessibilityLabel="Uploading photo"
      accessibilityValue={{ min: 0, max: 100, now: pct, text: `${pct}%` }}
      testID="upload-ring"
    >
      <PhotoImage source={photo} tint={false} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, styles.scrim]} />
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color.outline} strokeWidth={RING_STROKE} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color.accent}
          strokeWidth={RING_STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - p)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
    </View>
  );
}

/* ------------------------------------------------------------------ styles */

const styles = StyleSheet.create({
  skeletonList: { gap: space.xl },
  skeletonPrint: {
    backgroundColor: color.outline,
    borderRadius: radius.print,
    padding: space.md,
    gap: space.sm,
    overflow: "hidden",
  },
  skeletonPhoto: { aspectRatio: 4 / 3, backgroundColor: color.hairline, borderRadius: radius.print },
  skeletonLine: { height: type.body.fontSize, backgroundColor: color.hairline, borderRadius: radius.print },
  skeletonTitle: { width: "70%" },
  skeletonDate: { width: "40%" },
  shimmer: { backgroundColor: color.hairline, width: "50%" },
  slip: {
    backgroundColor: color.paper,
    borderRadius: radius.print,
    paddingHorizontal: space.xl,
    paddingTop: space.xxl,
    paddingBottom: space.xl,
    gap: space.lg,
  },
  tape: {
    position: "absolute",
    top: -polaroid.tape.height / 2,
    left: "50%",
    marginLeft: -polaroid.tape.width / 2,
    width: polaroid.tape.width,
    height: polaroid.tape.height,
    backgroundColor: color.tape,
  },
  center: { textAlign: "center" },
  centerSelf: { alignSelf: "center" },
  note: { marginTop: space.md },
  thumb: { borderRadius: radius.print, overflow: "hidden" },
  scrim: { backgroundColor: color.scrim },
});
