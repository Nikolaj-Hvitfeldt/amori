import React, { useEffect, useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { BookOpen, Calendar, Flag, Heart, Image as ImageIcon, LucideIcon } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { color, easing, hitTarget, motion, radius, space } from "../theme";
import { haptics, ICON_STROKE, iconSize, Text, useReducedEffects, useWebFrame } from "../ui";

/** Internal screen keys. They are routing ids, not labels, and stay unchanged. */
type Screen = "Home" | "Stories" | "Dates" | "Milestones" | "Pictures";

const TABS: Screen[] = ["Home", "Stories", "Dates", "Milestones", "Pictures"];

/** Tab names [1B, T11] and Lucide icons [5B]. */
const TAB_CONFIG: Record<Screen, { Icon: LucideIcon; label: string }> = {
  Home: { Icon: BookOpen, label: "Story" },
  Stories: { Icon: Heart, label: "Moments" },
  Dates: { Icon: Calendar, label: "Dates" },
  Milestones: { Icon: Flag, label: "Milestones" },
  Pictures: { Icon: ImageIcon, label: "Wall" },
};

/** The indicator is this share of a tab's width. */
const INDICATOR_RATIO = 0.5;
const INDICATOR_HEIGHT = 2;

interface AnimatedTabBarProps {
  activeScreen: Screen;
  onTabPress: (screen: Screen) => void;
}

/**
 * Bottom tab bar on surfaceChrome [6B, 5C]: a tablist of five tabs, Lucide
 * icons in textMuted (inactive) / accent (active), and an amber indicator that
 * slides 220ms ease-out (no spring; instant under reduced effects). Clears the
 * bottom safe-area inset. From 768px up it sits at column width with rounded
 * top corners [6A].
 */
export default function AnimatedTabBar({ activeScreen, onTabPress }: AnimatedTabBarProps) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedEffects();
  const { wide } = useWebFrame();
  const [barWidth, setBarWidth] = useState(0);
  const tabWidth = barWidth / TABS.length;
  const indicatorX = useSharedValue(0);

  useEffect(() => {
    const x = TABS.indexOf(activeScreen) * tabWidth;
    indicatorX.value = withTiming(x, {
      duration: reduced || tabWidth === 0 ? 0 : motion.tabIndicator,
      easing: Easing.bezier(...easing.out),
    });
  }, [activeScreen, tabWidth, reduced, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  const onLayout = (e: LayoutChangeEvent) => setBarWidth(e.nativeEvent.layout.width);

  return (
    <View
      accessibilityRole="tablist"
      onLayout={onLayout}
      style={[styles.container, { paddingBottom: insets.bottom }, wide && styles.wide]}
    >
      {tabWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.indicator, { width: tabWidth }, indicatorStyle]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <View style={styles.indicatorInner} />
        </Animated.View>
      ) : null}

      {TABS.map((screen) => {
        const isActive = activeScreen === screen;
        const { Icon, label } = TAB_CONFIG[screen];
        const tint = isActive ? color.accent : color.textMuted;
        return (
          <Pressable
            key={screen}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: isActive }}
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
            onPress={() => {
              if (!isActive) haptics.navigate();
              onTabPress(screen);
            }}
          >
            <Icon size={iconSize.lg} color={tint} strokeWidth={ICON_STROKE} />
            <Text variant="tabLabel" style={{ color: tint }} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: color.surfaceChrome,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.hairline,
  },
  wide: {
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    overflow: "hidden",
  },
  indicator: {
    position: "absolute",
    top: 0,
    left: 0,
    height: INDICATOR_HEIGHT,
    alignItems: "center",
  },
  indicatorInner: {
    width: `${INDICATOR_RATIO * 100}%`,
    height: INDICATOR_HEIGHT,
    borderRadius: radius.pill,
    backgroundColor: color.accent,
  },
  tab: {
    flex: 1,
    minHeight: hitTarget,
    alignItems: "center",
    justifyContent: "center",
    gap: space.xs,
    paddingTop: space.sm,
    paddingBottom: space.sm,
  },
  pressed: { opacity: 0.7 },
});

export type { Screen };
export { TABS };
