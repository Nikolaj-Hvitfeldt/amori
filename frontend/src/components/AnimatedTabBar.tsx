import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
  ReduceMotion,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Screen = "Home" | "Stories" | "Dates" | "Milestones" | "Pictures";

const TABS: Screen[] = ["Home", "Stories", "Dates", "Milestones", "Pictures"];
const TAB_WIDTH = SCREEN_WIDTH / TABS.length;

const springConfig = {
  damping: 15,
  stiffness: 150,
  mass: 0.5,
  reduceMotion: ReduceMotion.Never,
};

interface AnimatedTabBarProps {
  activeScreen: Screen;
  onTabPress: (screen: Screen) => void;
}

const TAB_CONFIG: Record<Screen, { icon: string; label: string; color: string }> = {
  Home: { icon: "🏠", label: "Timeline", color: "#FF6B9D" },
  Stories: { icon: "💕", label: "Moments", color: "#FF6B9D" },
  Dates: { icon: "📅", label: "Dates", color: "#9B59B6" },
  Milestones: { icon: "⭐", label: "Milestones", color: "#FFD700" },
  Pictures: { icon: "📸", label: "Memories", color: "#D4A574" },
};

export default function AnimatedTabBar({
  activeScreen,
  onTabPress,
}: AnimatedTabBarProps) {
  const indicatorPosition = useSharedValue(0);
  const indicatorScale = useSharedValue(1);

  useEffect(() => {
    const index = TABS.indexOf(activeScreen);
    // Bounce effect: scale down slightly then back up
    indicatorScale.value = withSpring(0.8, { ...springConfig, stiffness: 300 });
    setTimeout(() => {
      indicatorScale.value = withSpring(1, springConfig);
    }, 100);
    // Slide to new position
    indicatorPosition.value = withSpring(index * TAB_WIDTH, springConfig);
  }, [activeScreen]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: indicatorPosition.value },
      { scaleX: indicatorScale.value },
    ],
  }));

  return (
    <View style={styles.container}>
      {/* Sliding indicator */}
      <Animated.View style={[styles.indicator, indicatorStyle]}>
        <View
          style={[
            styles.indicatorInner,
            { backgroundColor: TAB_CONFIG[activeScreen].color },
          ]}
        />
      </Animated.View>

      {/* Tabs */}
      {TABS.map((screen, index) => {
        const isActive = activeScreen === screen;
        const config = TAB_CONFIG[screen];

        return (
          <TouchableOpacity
            key={screen}
            style={styles.tab}
            onPress={() => onTabPress(screen)}
            activeOpacity={0.7}
          >
            <AnimatedTabIcon
              icon={config.icon}
              isActive={isActive}
            />
            <Text
              style={[
                styles.label,
                isActive && { color: config.color, fontWeight: "600" },
              ]}
            >
              {config.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/**
 * Animated tab icon with scale effect
 */
function AnimatedTabIcon({
  icon,
  isActive,
}: {
  icon: string;
  isActive: boolean;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isActive) {
      // Pop effect when becoming active
      scale.value = withSpring(1.2, { ...springConfig, stiffness: 400 });
      setTimeout(() => {
        scale.value = withSpring(1, springConfig);
      }, 150);
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.Text style={[styles.icon, animatedStyle]}>
      {icon}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderTopColor: "#FEC7D7",
    borderTopWidth: 1,
    paddingBottom: 5,
    paddingTop: 8,
    height: 65,
    position: "relative",
  },
  indicator: {
    position: "absolute",
    top: 0,
    left: 0,
    width: TAB_WIDTH,
    height: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  indicatorInner: {
    width: TAB_WIDTH * 0.5,
    height: 3,
    borderRadius: 2,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 4,
  },
  icon: {
    fontSize: 22,
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    color: "#999",
  },
});

export { Screen, TABS };


