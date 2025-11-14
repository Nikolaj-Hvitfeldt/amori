import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import HomeScreen from "../screens/HomeScreen";
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
        return <HomeScreen />;
      case "Stories":
        return <MomentsScreen />;
      case "Dates":
        return <DatesScreen />;
      case "Pictures":
        return <PicturesScreen />;
      case "Milestones":
        return <MilestonesScreen />;
      default:
        return <HomeScreen />;
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
        return "Pictures";
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
    backgroundColor: "#FF6B9D",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#FEC7D7",
  };

  const headerTitleStyle = {
    fontSize: 20,
    fontWeight: "600" as const,
    color: "#FFF",
    textAlign: "center" as const,
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
            : headerStyle
        }
      >
        <Text
          style={
            activeScreen === "Dates"
              ? {
                  fontSize: 20,
                  fontWeight: "300" as const,
                  color: "#e5d3ff",
                  textAlign: "center" as const,
                  letterSpacing: 1,
                }
              : activeScreen === "Milestones"
              ? {
                  fontSize: 20,
                  fontWeight: "300" as const,
                  color: "#ffd700",
                  textAlign: "center" as const,
                  letterSpacing: 1,
                }
              : headerTitleStyle
          }
        >
          {activeScreen === "Home" && "Our Timeline"}
          {activeScreen === "Stories" && "Moments"}
          {activeScreen === "Dates" && "Treasured Dates"}
          {activeScreen === "Milestones" && "Milestones"}
          {activeScreen === "Pictures" && "Memories"}
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
