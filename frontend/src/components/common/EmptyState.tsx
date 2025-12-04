import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { TEXT_PRIMARY, TEXT_SECONDARY } from "../../constants/theme";

interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  backgroundColor?: string;
}

export default function EmptyState({
  icon = "📭",
  title,
  message,
  backgroundColor,
}: EmptyStateProps) {
  return (
    <View
      style={[
        styles.container,
        backgroundColor && { backgroundColor },
      ]}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: TEXT_PRIMARY,
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: TEXT_SECONDARY,
    textAlign: "center",
    lineHeight: 24,
  },
});

