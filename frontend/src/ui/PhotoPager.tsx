import React, { useState } from "react";
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { color, radius, space, webFrame } from "../theme";
import { PhotoImage, PhotoSource } from "./PhotoImage";

export type PhotoPagerProps = {
  photos: PhotoSource[];
  /** The entry's title, used in each photo's label ("Photo from Lantern walk"). */
  title?: string;
  /** Width / height. Default 4:3, matching the list print's cover photo. */
  aspectRatio?: number;
  testID?: string;
};

/** Hero photo aspect (width / height). */
const HERO_ASPECT = 4 / 3;
/** Page dot size. */
const DOT = space.sm;

/**
 * The detail view's photo hero [1A, 4A]: every photo, paged horizontally, with
 * page dots underneath. The dots read "Photo 1 of 2" to assistive tech.
 *
 * - No dots for a single photo; nothing at all for zero photos.
 * - Photos keep the amber warmth tint [DESIGN §4]; only the Wall lightbox turns it off.
 * - Renders straight away at the window width (capped to the web column), then
 *   corrects to the measured width, so the hero never flashes empty.
 */
export function PhotoPager({ photos, title, aspectRatio = HERO_ASPECT, testID }: PhotoPagerProps) {
  const { width: windowWidth } = useWindowDimensions();
  const [width, setWidth] = useState(Math.min(windowWidth, webFrame.column));
  const [rawIndex, setIndex] = useState(0);

  if (photos.length === 0) return null;
  // Clamp: the photo list can shrink while the view stays mounted (e.g. a refetch).
  const index = Math.min(rawIndex, photos.length - 1);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w && w !== width) setWidth(w);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) return;
    const next = Math.max(0, Math.min(photos.length - 1, Math.round(e.nativeEvent.contentOffset.x / width)));
    if (next !== index) setIndex(next);
  };

  const label = (i: number) => {
    const base = photos.length > 1 ? `Photo ${i + 1} of ${photos.length}` : "Photo";
    return title ? `${base} from ${title}` : base;
  };

  return (
    <View style={styles.wrap} onLayout={onLayout} testID={testID}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {photos.map((photo, i) => (
          <PhotoImage
            key={`${typeof photo === "object" ? photo.uri : photo}-${i}`}
            source={photo}
            accessibilityLabel={label(i)}
            style={{ width, aspectRatio }}
          />
        ))}
      </ScrollView>
      {photos.length > 1 ? (
        <View
          style={styles.dots}
          accessible
          accessibilityRole="text"
          accessibilityLabel={`Photo ${index + 1} of ${photos.length}`}
          accessibilityLiveRegion="polite"
          testID={testID ? `${testID}-dots` : undefined}
        >
          {photos.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", overflow: "hidden" },
  dots: { flexDirection: "row", justifyContent: "center", gap: space.sm, paddingTop: space.md },
  dot: { width: DOT, height: DOT, borderRadius: radius.pill, backgroundColor: color.outline },
  dotActive: { backgroundColor: color.accent },
});
