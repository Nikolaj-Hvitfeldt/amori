import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { PRIMARY_PINK, TEXT_SECONDARY } from "../../constants/theme";

interface LoadingStateProps {
  message?: string;
  color?: string;
  backgroundColor?: string;
}

export default function LoadingState({
  message = "Loading...",
  color = PRIMARY_PINK,
  backgroundColor,
}: LoadingStateProps) {
  return (
    <View
      style={[
        styles.container,
        backgroundColor && { backgroundColor },
      ]}
    >
      <ActivityIndicator size="large" color={color} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: TEXT_SECONDARY,
  },
});

