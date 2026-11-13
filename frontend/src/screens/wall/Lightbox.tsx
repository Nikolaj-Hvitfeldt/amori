import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { X } from "lucide-react-native";
import { color, easing, gutter, hitTarget, motion, space } from "../../theme";
import { Button, ICON_STROKE, iconSize, PhotoImage, Text, formatLongDate } from "../../ui";
import type { PhotoSource } from "../../ui";

export type LightboxEntryType = "moment" | "date" | "milestone";

export type LightboxPhoto = {
  url: PhotoSource;
  title: string;
  date: string;
  type: LightboxEntryType;
};

export type LightboxProps = {
  photo: LightboxPhoto | null;
  onClose: () => void;
  /** "Open date / moment / milestone": opens the entry's detail view. */
  onOpenEntry: () => void;
};

const OPEN_LABEL: Record<LightboxEntryType, string> = {
  date: "Open date",
  moment: "Open moment",
  milestone: "Open milestone",
};

/** How far a downward swipe must travel before it closes the lightbox. */
const SWIPE_CLOSE_DISTANCE = space.xxxl * 2;
/** The photo area leaves room for the caption below it. */
const PHOTO_MAX_HEIGHT_RATIO = 0.6;

const useNative = Platform.OS !== "web";

/**
 * Wall lightbox [7B, T8]: near-black backdrop, the photo in full true colour
 * (no tint, grain or vignette), then the title, italic date and an "Open …"
 * text button. Closes on the 44px ✕, Esc (web, via Modal onRequestClose),
 * a backdrop tap or a swipe down (allowed addition #7). No left/right paging.
 */
export function Lightbox({ photo, onClose, onOpenEntry }: LightboxProps) {
  const { width, height } = useWindowDimensions();
  const dragY = useRef(new Animated.Value(0)).current;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (photo) dragY.setValue(0);
  }, [photo, dragY]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => g.dy > space.md && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_, g) => dragY.setValue(Math.max(0, g.dy)),
        onPanResponderRelease: (_, g) => {
          if (g.dy > SWIPE_CLOSE_DISTANCE) {
            onCloseRef.current();
            return;
          }
          Animated.timing(dragY, {
            toValue: 0,
            duration: motion.contentFade,
            easing: Easing.bezier(...easing.out),
            useNativeDriver: useNative,
          }).start();
        },
        onPanResponderTerminate: () => dragY.setValue(0),
      }),
    [dragY]
  );

  const photoWidth = width - gutter * 2;
  const photoHeight = Math.min(photoWidth, height * PHOTO_MAX_HEIGHT_RATIO);

  return (
    <Modal
      visible={photo !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View
        style={styles.backdrop}
        accessibilityViewIsModal
        aria-modal
        role="dialog"
        accessibilityLabel="Photo"
        {...pan.panHandlers}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessible={false}
          focusable={false}
          importantForAccessibility="no"
          testID="lightbox-backdrop"
        />
        {photo ? (
          <Animated.View
            style={[styles.content, { transform: [{ translateY: dragY }] }]}
          >
            <PhotoImage
              source={photo.url}
              tint={false}
              contentFit="contain"
              accessibilityLabel={`Photo from ${photo.title}, ${formatLongDate(photo.date)}`}
              style={{ width: photoWidth, height: photoHeight }}
              testID="lightbox-photo"
            />
            <View style={styles.caption}>
              <Text variant="title" style={styles.center} numberOfLines={2}>
                {photo.title}
              </Text>
              <Text variant="date" tone="muted" style={styles.center}>
                {formatLongDate(photo.date)}
              </Text>
              <Button
                variant="text"
                label={OPEN_LABEL[photo.type]}
                onPress={onOpenEntry}
                style={styles.centerSelf}
                testID="lightbox-open"
              />
            </View>
          </Animated.View>
        ) : null}
        <Button
          variant="icon"
          accessibilityLabel="Close photo"
          icon={<X size={iconSize.lg} color={color.text} strokeWidth={ICON_STROKE} />}
          onPress={onClose}
          style={styles.close}
          testID="lightbox-close"
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: color.lightboxBackdrop,
    justifyContent: "center",
    alignItems: "center",
  },
  content: { alignItems: "center", paddingHorizontal: gutter },
  caption: { marginTop: space.lg, gap: space.xs, alignItems: "center", maxWidth: "100%" },
  center: { textAlign: "center" },
  centerSelf: { alignSelf: "center", marginTop: space.sm },
  close: {
    position: "absolute",
    top: space.lg,
    left: space.sm,
    width: hitTarget,
    height: hitTarget,
  },
});
