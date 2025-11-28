import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { DateEntry } from "../../types/dates";
import RotatingPhotoBackground from "../RotatingPhotoBackground";
import { filterValidPhotos } from "../../utils/imageUtils";
import { getBoxShadow, getTextShadow } from "../../utils/shadows";
import { formatDateUS } from "../../utils/dateUtils";
import { getMoodInfo, MOOD_COLORS } from "../../utils/moodUtils";
import {
  CARD_MARGIN_HORIZONTAL,
  CARD_MARGIN_BOTTOM,
  CARD_PADDING,
  CARD_BORDER_RADIUS,
  ACCENT_CIRCLE_SIZE,
  ACCENT_CIRCLE_OFFSET,
} from "../../constants/spacing";

interface TimelineDateCardProps {
  dateEntry: DateEntry;
  onPress: () => void;
}

export default function TimelineDateCard({
  dateEntry,
  onPress,
}: TimelineDateCardProps) {
  const moodInfo = getMoodInfo(dateEntry.mood);
  const dateMoodColor = MOOD_COLORS[dateEntry.mood];
  const allDatePhotos =
    dateEntry.photos && dateEntry.photos.length > 0
      ? dateEntry.photos
      : dateEntry.image_url
      ? [dateEntry.image_url]
      : [];
  const datePhotos = filterValidPhotos(allDatePhotos);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.card,
        {
          backgroundColor: "#0f172a",
          borderColor: "#374151",
          ...getBoxShadow(dateMoodColor, { width: 0, height: 4 }, 0.3, 12),
        },
      ]}
    >
      {/* Decorative calendar accent */}
      <View
        style={[
          styles.accentCircle,
          {
            backgroundColor: dateMoodColor + "15",
          },
        ]}
      />

      {/* Rotating Photo Background */}
      {datePhotos.length > 0 && (
        <RotatingPhotoBackground
          photos={datePhotos}
          interval={8000}
          style={styles.photoBackground}
        />
      )}

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.title,
                  {
                    color: datePhotos.length > 0 ? "#ffffff" : "#e5d3ff",
                  },
                  getTextShadow("rgba(0, 0, 0, 0.75)", { width: 0, height: 1 }, 3),
                ]}
              >
                {dateEntry.title || "Our Special Date"}
              </Text>
              <Text style={styles.icon}>📅</Text>
            </View>
            <Text
              style={[
                styles.date,
                {
                  color: datePhotos.length > 0 ? "#f3f4f6" : "#9ca3af",
                },
                getTextShadow("rgba(0, 0, 0, 0.75)", { width: 0, height: 1 }, 3),
              ]}
            >
              {formatDateUS(dateEntry.date)}
            </Text>
            <View style={styles.labelRow}>
              <Text style={styles.labelIcon}>{moodInfo.icon}</Text>
              <Text
                style={[
                  styles.label,
                  {
                    color: datePhotos.length > 0 ? "#ffffff" : "#a78bfa",
                  },
                  getTextShadow("rgba(0, 0, 0, 0.75)", { width: 0, height: 1 }, 3),
                ]}
              >
                {moodInfo.label}
              </Text>
            </View>
          </View>
        </View>

        <Text
          style={[
            styles.location,
            {
              color: datePhotos.length > 0 ? "#ffffff" : "#d1d5db",
            },
            getTextShadow("rgba(0, 0, 0, 0.75)", { width: 0, height: 1 }, 3),
          ]}
        >
          📍 {dateEntry.location}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: CARD_BORDER_RADIUS,
    padding: CARD_PADDING,
    marginBottom: CARD_MARGIN_BOTTOM,
    marginHorizontal: CARD_MARGIN_HORIZONTAL,
    overflow: "hidden",
    position: "relative",
    zIndex: 2,
    borderWidth: 1,
    elevation: 5,
  },
  accentCircle: {
    position: "absolute",
    top: ACCENT_CIRCLE_OFFSET,
    right: ACCENT_CIRCLE_OFFSET,
    width: ACCENT_CIRCLE_SIZE,
    height: ACCENT_CIRCLE_SIZE,
    borderRadius: ACCENT_CIRCLE_SIZE / 2,
    opacity: 0.5,
  },
  photoBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  content: {
    position: "relative",
    zIndex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginRight: 8,
  },
  icon: {
    fontSize: 20,
  },
  date: {
    fontSize: 12,
    fontStyle: "italic",
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  labelIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  location: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "500",
  },
});

