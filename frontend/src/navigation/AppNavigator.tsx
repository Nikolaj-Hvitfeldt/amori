import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import TimelineScreen from "../screens/TimelineScreen";
import DatesScreen from "../screens/DatesScreen";
import PicturesScreen from "../screens/PicturesScreen";
import MomentsScreen from "../screens/MomentsScreen";
import MilestonesScreen from "../screens/MilestonesScreen";

type Screen = "Home" | "Stories" | "Dates" | "Pictures" | "Milestones";

export default function AppNavigator() {
  const [activeScreen, setActiveScreen] = useState<Screen>("Home");

  const renderScreen = () => {
    switch (activeScreen) {
      case "Home":
        return <TimelineScreen />;
      case "Stories":
        return <MomentsScreen />;
      case "Dates":
        return <DatesScreen />;
      case "Pictures":
        return <PicturesScreen />;
      case "Milestones":
        return <MilestonesScreen />;
      default:
        return <TimelineScreen />;
    }
  };

  const getTabIcon = (screen: Screen) => {
    switch (screen) {
      case "Home":
        return "🏠";
      case "Stories":
        return "💕";
      case "Dates":
        return "📅";
      case "Pictures":
        return "📸";
      case "Milestones":
        return "⭐";
      default:
        return "🏠";
    }
  };

  const getTabTitle = (screen: Screen) => {
    switch (screen) {
      case "Home":
        return "Timeline";
      case "Stories":
        return "Moments";
      case "Dates":
        return "Dates";
      case "Pictures":
        return "Memories";
      case "Milestones":
        return "Milestones";
      default:
        return "Timeline";
    }
  };

  const containerStyle = {
    flex: 1,
    backgroundColor: "#FFF5F7",
    paddingTop: 50,
  };

  const headerStyle = {
    backgroundColor: "#4A3545",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#6B4D64",
  };

  const headerTitleStyle = {
    fontSize: 20,
    fontWeight: "600" as const,
    color: "#F8E8F0",
    textAlign: "center" as const,
    letterSpacing: 1,
  };

  const contentStyle = {
    flex: 1,
  };

  const tabBarStyle = {
    flexDirection: "row" as const,
    backgroundColor: "#FFF",
    borderTopColor: "#FEC7D7",
    borderTopWidth: 1,
    paddingBottom: 5,
    paddingTop: 5,
    height: 60,
  };

  const tabStyle = {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  };

  const tabIconStyle = {
    fontSize: 20,
    marginBottom: 2,
  };

  const tabLabelStyle = {
    fontSize: 12,
    color: "#999",
  };

  const activeTabLabelStyle = {
    fontSize: 12,
    color: "#FF6B9D",
    fontWeight: "600" as const,
  };

  return (
    <View style={containerStyle}>
      {/* Header */}
      <View
        style={
          activeScreen === "Dates"
            ? {
                backgroundColor: "#16213e",
                paddingVertical: 15,
                paddingHorizontal: 20,
                borderBottomWidth: 1,
                borderBottomColor: "#374151",
              }
            : activeScreen === "Milestones"
            ? {
                backgroundColor: "#2d1810",
                paddingVertical: 15,
                paddingHorizontal: 20,
                borderBottomWidth: 1,
                borderBottomColor: "#ffd70030",
              }
            : activeScreen === "Stories"
            ? {
                backgroundColor: "#FF6B9D",
                paddingVertical: 15,
                paddingHorizontal: 20,
                borderBottomWidth: 1,
                borderBottomColor: "#FEC7D7",
              }
            : activeScreen === "Pictures"
            ? {
                backgroundColor: "#3D2820",
                paddingVertical: 15,
                paddingHorizontal: 20,
                borderBottomWidth: 1,
                borderBottomColor: "#5D4037",
              }
            : headerStyle
        }
      >
        <Text
          style={
            activeScreen === "Dates"
              ? {
                  fontSize: 20,
                  fontWeight: "600" as const,
                  color: "#e5d3ff",
                  textAlign: "center" as const,
                  letterSpacing: 1,
                }
              : activeScreen === "Milestones"
              ? {
                  fontSize: 20,
                  fontWeight: "600" as const,
                  color: "#ffd700",
                  textAlign: "center" as const,
                  letterSpacing: 1,
                }
              : activeScreen === "Stories"
              ? {
                  fontSize: 20,
                  fontWeight: "600" as const,
                  color: "#FFF",
                  textAlign: "center" as const,
                  letterSpacing: 1,
                }
              : activeScreen === "Pictures"
              ? {
                  fontSize: 20,
                  fontWeight: "600" as const,
                  color: "#D4A574",
                  textAlign: "center" as const,
                  letterSpacing: 1,
                }
              : headerTitleStyle
          }
        >
          {activeScreen === "Home" && "Our Story"}
          {activeScreen === "Stories" && "Moments"}
          {activeScreen === "Dates" && "Dates"}
          {activeScreen === "Milestones" && "Milestones"}
          {activeScreen === "Pictures" && "Memory Wall"}
        </Text>
      </View>

      {/* Content */}
      <View style={contentStyle}>{renderScreen()}</View>

      {/* Bottom Tab Bar */}
      <View style={tabBarStyle}>
        {(
          ["Home", "Stories", "Dates", "Milestones", "Pictures"] as Screen[]
        ).map((screen) => (
          <TouchableOpacity
            key={screen}
            style={tabStyle}
            onPress={() => setActiveScreen(screen)}
          >
            <Text style={tabIconStyle}>{getTabIcon(screen)}</Text>
            <Text
              style={
                activeScreen === screen ? activeTabLabelStyle : tabLabelStyle
              }
            >
              {getTabTitle(screen)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
