import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Modal, Platform, StyleSheet, View } from "react-native";
import { color, easing, gutter, motion, radius, space, webFrame } from "../theme";
import { Button } from "./Button";
import { Text } from "./Text";
import { useReducedEffects } from "./useReducedEffects";

export type ConfirmDialogProps = {
  visible: boolean;
  /** e.g. "Discard this date?" */
  title: string;
  message?: string;
  /** Default "Discard". */
  confirmLabel?: string;
  /** Default "Keep editing". */
  cancelLabel?: string;
  onConfirm: () => void;
  /** Cancel button, Android back and web Esc. */
  onCancel: () => void;
  testID?: string;
};

/** Backdrop dimming for dialogs. Not in theme yet (reported as a token gap). */
const BACKDROP_OPACITY = 0.7;

/**
 * In-app confirmation [7A], e.g. "Discard this date?" with Keep editing / Discard.
 * A dark panel (never paper [5D]) that fades in over contentFade.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = "Discard",
  cancelLabel = "Keep editing",
  onConfirm,
  onCancel,
  testID,
}: ConfirmDialogProps) {
  const reduced = useReducedEffects();
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) setMounted(true);
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: reduced ? 0 : motion.contentFade,
      easing: visible ? Easing.bezier(...easing.out) : Easing.bezier(...easing.in),
      useNativeDriver: Platform.OS !== "web",
    }).start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
  }, [visible, reduced, progress]);

  return (
    <Modal transparent visible={mounted} animationType="none" onRequestClose={onCancel} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: Animated.multiply(progress, BACKDROP_OPACITY) }]} />
      <View style={styles.frame} pointerEvents="box-none">
        <Animated.View
          accessibilityViewIsModal
          aria-modal
          role="alertdialog"
          accessibilityLabel={title}
          testID={testID}
          style={[styles.panel, { opacity: progress }]}
        >
          <Text variant="title">{title}</Text>
          {message ? (
            <Text variant="body" tone="muted">
              {message}
            </Text>
          ) : null}
          <View style={styles.actions}>
            <Button variant="secondary" label={cancelLabel} onPress={onCancel} />
            <Button variant="primary" label={confirmLabel} onPress={onConfirm} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: color.sheetBackdrop },
  frame: { flex: 1, alignItems: "center", justifyContent: "center", padding: gutter },
  panel: {
    width: "100%",
    maxWidth: webFrame.column,
    backgroundColor: color.surfaceRaised,
    borderRadius: radius.sheet,
    padding: space.xl,
    gap: space.md,
  },
  actions: { flexDirection: "row", justifyContent: "flex-end", flexWrap: "wrap", gap: space.sm, marginTop: space.sm },
});
