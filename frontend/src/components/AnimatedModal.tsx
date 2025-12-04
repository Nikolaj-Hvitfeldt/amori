import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  StyleSheet,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  ReduceMotion,
} from "react-native-reanimated";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const springConfig = {
  damping: 20,
  stiffness: 200,
  mass: 0.5,
  reduceMotion: ReduceMotion.Never,
};

interface SlideInViewProps {
  visible: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  style?: any;
}

/**
 * Animated wrapper for modal content with spring slide-in/out
 * Handles delayed closing to allow exit animation to complete
 */
export function SlideInView({
  visible,
  onClose,
  children,
  style,
}: SlideInViewProps) {
  const [shouldRender, setShouldRender] = useState(visible);
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Show immediately and animate in
      setShouldRender(true);
      translateY.value = withSpring(0, springConfig);
      scale.value = withSpring(1, springConfig);
      opacity.value = withTiming(1, { duration: 200, reduceMotion: ReduceMotion.Never });
    } else if (shouldRender) {
      // Animate out, then hide
      translateY.value = withSpring(SCREEN_HEIGHT * 0.5, {
        ...springConfig,
        damping: 25,
      });
      scale.value = withSpring(0.9, springConfig);
      opacity.value = withTiming(0, { duration: 150, reduceMotion: ReduceMotion.Never }, (finished) => {
        if (finished) {
          runOnJS(setShouldRender)(false);
        }
      });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  if (!shouldRender) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

/**
 * Complete animated modal with backdrop and slide animation
 */
interface AnimatedModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function AnimatedModal({
  visible,
  onClose,
  children,
}: AnimatedModalProps) {
  const [modalVisible, setModalVisible] = useState(visible);
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      translateY.value = withSpring(0, springConfig);
      backdropOpacity.value = withTiming(1, { duration: 200, reduceMotion: ReduceMotion.Never });
    } else if (modalVisible) {
      // Animate out first
      translateY.value = withSpring(SCREEN_HEIGHT, {
        ...springConfig,
        damping: 25,
      });
      backdropOpacity.value = withTiming(0, { duration: 200, reduceMotion: ReduceMotion.Never }, (finished) => {
        if (finished) {
          runOnJS(setModalVisible)(false);
        }
      });
    }
  }, [visible]);

  const animatedContentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        <Animated.View
          style={[styles.backdrop, animatedBackdropStyle]}
        />
        <Animated.View style={[styles.content, animatedContentStyle]}>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  content: {
    flex: 1,
  },
});
