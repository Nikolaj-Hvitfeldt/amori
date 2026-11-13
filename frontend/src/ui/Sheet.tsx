import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  useWindowDimensions,
  ViewStyle,
} from "react-native";
import { color, easing, motion, radius, space, webFrame } from "../theme";
import { useReducedEffects } from "./useReducedEffects";

export type SheetProps = {
  visible: boolean;
  /** ✕, backdrop tap, Android back and web Esc all call this. The screen decides what happens. */
  onRequestClose: () => void;
  children: React.ReactNode;
  accessibilityLabel?: string;
  /**
   * "auto" (default) sizes to its content, up to 92% of the screen: forms, menus.
   * "tall" is always 92% tall, so a flex:1 child (a detail view with its own
   * ScrollView) has room to lay out. Moments, Dates and Milestones open their
   * detail views in a tall sheet.
   */
  size?: "auto" | "tall";
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** How dark the backdrop gets over the screen. Not in theme yet (reported as a token gap). */
const BACKDROP_OPACITY = 0.7;
/** Sheets leave this much of the screen visible above them. */
const MAX_HEIGHT = "92%";

const useNative = Platform.OS !== "web";

/**
 * Raised dark sheet on the shared Modal [7A, 6A]. Opens 260ms ease-out, closes
 * 220ms ease-in; instant under reduced effects. At 768px+ it is a centred 560px panel.
 *
 * On web, react-native-web's Modal traps focus, closes on Esc (via onRequestClose)
 * and returns focus to the element that had it before opening.
 */
export function Sheet({ visible, onRequestClose, children, accessibilityLabel, size = "auto", style, testID }: SheetProps) {
  const reduced = useReducedEffects();
  const { width, height } = useWindowDimensions();
  const wide = width >= webFrame.breakpoint;
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(progress, {
        toValue: 1,
        duration: reduced ? 0 : motion.sheetOpen,
        easing: Easing.bezier(...easing.out),
        useNativeDriver: useNative,
      }).start();
    } else {
      Animated.timing(progress, {
        toValue: 0,
        duration: reduced ? 0 : motion.sheetClose,
        easing: Easing.bezier(...easing.in),
        useNativeDriver: useNative,
      }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, reduced, progress]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [wide ? space.xxxl : height, 0],
  });

  return (
    <Modal
      transparent
      visible={mounted}
      animationType="none"
      onRequestClose={onRequestClose}
      statusBarTranslucent
    >
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: Animated.multiply(progress, BACKDROP_OPACITY) }]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onRequestClose}
          accessible={false}
          focusable={false}
          importantForAccessibility="no"
        />
      </Animated.View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : Platform.OS === "android" ? "height" : undefined}
        style={[styles.frame, wide && styles.frameWide]}
        pointerEvents="box-none"
      >
        <Animated.View
          accessibilityViewIsModal
          aria-modal
          role="dialog"
          accessibilityLabel={accessibilityLabel}
          testID={testID}
          style={[
            styles.sheet,
            wide && styles.sheetWide,
            size === "tall" && styles.sheetTall,
            { opacity: wide || reduced ? progress : 1, transform: [{ translateY }] },
            style,
          ]}
        >
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: color.sheetBackdrop },
  frame: { flex: 1, justifyContent: "flex-end" },
  frameWide: { justifyContent: "center", alignItems: "center", padding: space.xl },
  sheet: {
    backgroundColor: color.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    maxHeight: MAX_HEIGHT,
    width: "100%",
    overflow: "hidden",
  },
  sheetWide: { maxWidth: webFrame.column, borderRadius: radius.sheet },
  sheetTall: { height: MAX_HEIGHT },
});
