import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { TEXT_SECONDARY } from "../../constants/theme";

interface LoadingMoreProps {
  message?: string;
  color?: string;
}

export default function LoadingMore({
  message = "Loading more...",
  color,
}: LoadingMoreProps) {
  return (
    <View style={styles.container}>
      {color ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Text style={styles.text}>{message}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    fontStyle: "italic",
  },
});

