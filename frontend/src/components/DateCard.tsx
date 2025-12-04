import React, { memo, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import PressableCard from "./PressableCard";
import { DateEntry } from "../types/dates";
import RotatingPhotoBackground from "./RotatingPhotoBackground";
import DecorativeAccent from "./common/DecorativeAccent";
import { filterValidPhotos } from "../utils/imageUtils";
import { getBoxShadow, getTextShadow } from "../utils/shadows";
import { formatDateUS } from "../utils/dateUtils";
import { getMoodInfo, MOOD_COLORS } from "../utils/moodUtils";
import {
  CARD_MARGIN_HORIZONTAL,
  CARD_MARGIN_BOTTOM,
  CARD_PADDING,
  CARD_BORDER_RADIUS,
} from "../constants/spacing";

interface DateCardProps {
  dateEntry: DateEntry;
  onPress: () => void;
  variant?: "timeline" | "screen";
}

function DateCard({
  dateEntry,
  onPress,
  variant = "timeline",
}: DateCardProps) {
  const moodInfo = useMemo(() => getMoodInfo(dateEntry.mood), [dateEntry.mood]);
  const dateMoodColor = useMemo(() => MOOD_COLORS[dateEntry.mood], [dateEntry.mood]);
  const allDatePhotos = useMemo(
    () =>
      dateEntry.photos && dateEntry.photos.length > 0
        ? dateEntry.photos
        : dateEntry.image_url
        ? [dateEntry.image_url]
        : [],
    [dateEntry.photos, dateEntry.image_url]
  );
  const datePhotos = useMemo(
    () => filterValidPhotos(allDatePhotos),
    [allDatePhotos]
  );

  // Adjust styling based on variant
  const cardStyle = useMemo(
    () =>
      variant === "screen"
        ? {
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
          }
        : styles.card,
    [variant]
  );

  const hasPhotos = datePhotos.length > 0;

  return (
    <PressableCard
      onPress={onPress}
      style={[
        cardStyle,
        styles.cardBase,
        getBoxShadow(dateMoodColor, { width: 0, height: 4 }, 0.3, 12),
      ]}
    >
        {/* Decorative calendar accent */}
        <DecorativeAccent color={dateMoodColor} size="default" opacity={0.5} />

      {/* Rotating Photo Background */}
      {hasPhotos && (
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
                  hasPhotos ? styles.titleWithPhotos : styles.titleWithoutPhotos,
                  getTextShadow("rgba(0, 0, 0, 0.75)", { width: 0, height: 1 }, 3),
                ]}
              >
                {dateEntry.title || "Our Special Date"}
              </Text>
              {variant === "timeline" && <Text style={styles.icon}>📅</Text>}
            </View>
            <Text
              style={[
                styles.date,
                hasPhotos ? styles.dateWithPhotos : styles.dateWithoutPhotos,
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
                  hasPhotos ? styles.labelWithPhotos : styles.labelWithoutPhotos,
                  getTextShadow("rgba(0, 0, 0, 0.75)", { width: 0, height: 1 }, 3),
                ]}
              >
                {moodInfo.label}
              </Text>
            </View>
          </View>
        </View>

        {dateEntry.location && (
          <Text
            style={[
              styles.location,
              hasPhotos ? styles.locationWithPhotos : styles.locationWithoutPhotos,
              getTextShadow("rgba(0, 0, 0, 0.75)", { width: 0, height: 1 }, 3),
            ]}
          >
            📍 {dateEntry.location}
          </Text>
        )}
      </View>
    </PressableCard>
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
  cardBase: {
    backgroundColor: "#0f172a",
    borderColor: "#374151",
  },
  titleWithPhotos: {
    color: "#ffffff",
  },
  titleWithoutPhotos: {
    color: "#e5d3ff",
  },
  dateWithPhotos: {
    color: "#f3f4f6",
  },
  dateWithoutPhotos: {
    color: "#9ca3af",
  },
  labelWithPhotos: {
    color: "#ffffff",
  },
  labelWithoutPhotos: {
    color: "#a78bfa",
  },
  locationWithPhotos: {
    color: "#ffffff",
  },
  locationWithoutPhotos: {
    color: "#d1d5db",
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

export default memo(DateCard);

