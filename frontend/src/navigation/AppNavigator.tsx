import React, { useState } from "react";
import { View, Text } from "react-native";
import TimelineScreen from "../screens/TimelineScreen";
import DatesScreen from "../screens/DatesScreen";
import PicturesScreen from "../screens/PicturesScreen";
import MomentsScreen from "../screens/MomentsScreen";
import MilestonesScreen from "../screens/MilestonesScreen";
import AnimatedTabBar, { Screen } from "../components/AnimatedTabBar";

export default function AppNavigator() {
  const [activeScreen, setActiveScreen] = useState<Screen>("Home");

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

  const getHeaderStyle = () => {
    switch (activeScreen) {
      case "Dates":
        return {
          backgroundColor: "#16213e",
          borderBottomColor: "#374151",
        };
      case "Milestones":
        return {
          backgroundColor: "#2d1810",
          borderBottomColor: "#ffd70030",
        };
      case "Stories":
        return {
          backgroundColor: "#FF6B9D",
          borderBottomColor: "#FEC7D7",
        };
      case "Pictures":
        return {
          backgroundColor: "#3D2820",
          borderBottomColor: "#5D4037",
        };
      default:
        return {
          backgroundColor: "#4A3545",
          borderBottomColor: "#6B4D64",
        };
    }
  };

  const getHeaderTextStyle = () => {
    switch (activeScreen) {
      case "Dates":
        return { color: "#e5d3ff" };
      case "Milestones":
        return { color: "#ffd700" };
      case "Stories":
        return { color: "#FFF" };
      case "Pictures":
        return { color: "#D4A574" };
      default:
        return { color: "#F8E8F0" };
    }
  };

  const getHeaderTitle = () => {
    switch (activeScreen) {
      case "Home":
        return "Our Story";
      case "Stories":
        return "Moments";
      case "Dates":
        return "Dates";
      case "Milestones":
        return "Milestones";
      case "Pictures":
        return "Memory Wall";
      default:
        return "Our Story";
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, getHeaderStyle()]}>
        <Text style={[styles.headerText, getHeaderTextStyle()]}>
          {getHeaderTitle()}
        </Text>
      </View>

      {/* Content */}
      <View style={styles.content}>{renderScreen()}</View>

      {/* Animated Bottom Tab Bar */}
      <AnimatedTabBar
        activeScreen={activeScreen}
        onTabPress={setActiveScreen}
      />
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: "#FFF5F7",
  },
  header: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "600" as const,
    textAlign: "center" as const,
    letterSpacing: 1,
  },
  content: {
    flex: 1,
  },
};
