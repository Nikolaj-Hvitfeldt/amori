import React from "react";
import { View, Text } from "react-native";

export default function StoriesScreen() {
  const containerStyle = {
    flex: 1,
    backgroundColor: "#FFF5F7",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    padding: 20,
  };

  const headerTextStyle = {
    fontSize: 28,
    fontWeight: "bold" as const,
    color: "#FF6B9D",
    textAlign: "center" as const,
    marginVertical: 20,
  };

  const testTextStyle = {
    fontSize: 16,
    color: "#666",
  };

  return (
    <View style={containerStyle}>
      <Text style={headerTextStyle}>Love Stories 💕</Text>
      <Text style={testTextStyle}>Stories screen working!</Text>
    </View>
  );
}
