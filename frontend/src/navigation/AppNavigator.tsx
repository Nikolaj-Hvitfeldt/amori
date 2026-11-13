import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import TimelineScreen from "../screens/TimelineScreen";
import DatesScreen from "../screens/DatesScreen";
import PicturesScreen from "../screens/PicturesScreen";
import MomentsScreen from "../screens/MomentsScreen";
import MilestonesScreen from "../screens/MilestonesScreen";
import AnimatedTabBar, { Screen } from "../components/AnimatedTabBar";
import { ScreenBackground, useWebFrame } from "../ui";

/**
 * App shell. The cocoa surface, Dusk vignette and grain run full-bleed here,
 * once, behind every tab [6A]. There is no navigator header: each screen renders
 * its own Header (title and tagline) inside a ScreenColumn, which also clears the
 * top safe-area inset. The tab bar sits at the bottom; from 768px up it is
 * centred at column width.
 */
export default function AppNavigator() {
  const [activeScreen, setActiveScreen] = useState<Screen>("Home");
  const { columnWidth } = useWebFrame();
  const barWidth = columnWidth("list");

  const renderScreen = () => {
    switch (activeScreen) {
      case "Home":
        return <TimelineScreen isFocused={activeScreen === "Home"} />;
      case "Stories":
        return <MomentsScreen isFocused={activeScreen === "Stories"} />;
      case "Dates":
        return <DatesScreen isFocused={activeScreen === "Dates"} />;
      case "Pictures":
        return <PicturesScreen isFocused={activeScreen === "Pictures"} />;
      case "Milestones":
        return <MilestonesScreen isFocused={activeScreen === "Milestones"} />;
      default:
        return <TimelineScreen isFocused={activeScreen === "Home"} />;
    }
  };

  return (
    <ScreenBackground>
      <View style={styles.content}>{renderScreen()}</View>
      <View style={[styles.bar, barWidth !== undefined && { maxWidth: barWidth }]}>
        <AnimatedTabBar activeScreen={activeScreen} onTabPress={setActiveScreen} />
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  bar: { width: "100%", alignSelf: "center" },
});
