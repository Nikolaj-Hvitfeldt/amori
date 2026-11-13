import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { TEXT_PRIMARY, TEXT_SECONDARY, WHITE, GRAY_LIGHT } from "../../constants/theme";

interface ErrorStateProps {
  /** What failed to load, e.g. "your story", "your moments". */
  subject: string;
  onRetry: () => void;
  backgroundColor?: string;
}

/**
 * Full error state for a list that failed to load and has nothing to show.
 * Shown instead of the empty state, so a network failure never looks like
 * "you have no entries" [2A].
 */
export default function ErrorState({ subject, onRetry, backgroundColor }: ErrorStateProps) {
  return (
    <View style={[styles.container, backgroundColor ? { backgroundColor } : null]}>
      <View style={styles.slip} accessibilityRole="alert">
        <Text style={styles.message}>
          {`Couldn't reach ${subject}. Check your connection.`}
        </Text>
        <TouchableOpacity
          onPress={onRetry}
          style={styles.button}
          accessibilityRole="button"
          accessibilityLabel="Try again"
        >
          <Text style={styles.buttonText}>Try again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface SavedCopyNoticeProps {
  onRetry: () => void;
}

/**
 * Small notice shown above a list when a refresh failed but the last
 * successfully loaded copy is still on screen [2A].
 */
export function SavedCopyNotice({ onRetry }: SavedCopyNoticeProps) {
  return (
    <View style={styles.notice} accessibilityRole="alert">
      <Text style={styles.noticeText}>Showing your saved copy</Text>
      <TouchableOpacity
        onPress={onRetry}
        style={styles.noticeButton}
        accessibilityRole="button"
        accessibilityLabel="Try again"
      >
        <Text style={styles.noticeButtonText}>Try again</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  slip: {
    backgroundColor: GRAY_LIGHT,
    borderRadius: 3,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    maxWidth: 360,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    color: TEXT_PRIMARY,
    textAlign: "center",
    marginBottom: 16,
  },
  button: {
    minHeight: 44,
    minWidth: 120,
    paddingHorizontal: 20,
    borderRadius: 22,
    backgroundColor: TEXT_PRIMARY,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: "600",
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    alignSelf: "center",
    width: "92%",
    maxWidth: 560,
    marginBottom: 12,
    paddingLeft: 16,
    paddingRight: 4,
    borderRadius: 12,
    backgroundColor: GRAY_LIGHT,
  },
  noticeText: {
    fontSize: 14,
    color: TEXT_SECONDARY,
  },
  noticeButton: {
    minHeight: 44,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  noticeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT_PRIMARY,
  },
});
