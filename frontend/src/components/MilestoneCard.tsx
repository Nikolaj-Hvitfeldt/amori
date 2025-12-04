import React, { useState, memo, useMemo, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from "react-native";
import { Image } from "expo-image";
import { Milestone } from "../types/milestones";
import { MILESTONE_CONFIG } from "../constants/milestoneConfig";
import DecorativeAccent from "./common/DecorativeAccent";
import { filterValidPhotos } from "../utils/imageUtils";
import { getBoxShadow, getTextShadow } from "../utils/shadows";
import { formatDateUS, calculateDaysSince } from "../utils/dateUtils";
import {
  CARD_MARGIN_HORIZONTAL,
  CARD_MARGIN_BOTTOM,
  CARD_PADDING_LARGE,
  CARD_BORDER_RADIUS_LARGE,
} from "../constants/spacing";

interface MilestoneCardProps {
  milestone: Milestone;
  onPress: () => void;
  onLongPress?: () => void;
  variant?: "timeline" | "screen";
}

function MilestoneCard({
  milestone,
  onPress,
  onLongPress,
  variant = "timeline",
}: MilestoneCardProps) {
  const config = useMemo(
    () => MILESTONE_CONFIG[milestone.milestone_type],
    [milestone.milestone_type]
  );
  const daysSince = useMemo(
    () => calculateDaysSince(milestone.date),
    [milestone.date]
  );
  const milestonePhotos = useMemo(
    () => filterValidPhotos(milestone.photos || []),
    [milestone.photos]
  );
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // Adjust styling based on variant
  const cardStyle = useMemo(
    () =>
      variant === "screen"
        ? {
            borderRadius: 24,
            padding: 24,
            marginBottom: 20,
          }
        : styles.card,
    [variant]
  );

  const handleImageError = useCallback(
    (photo: string) => {
      setFailedImages((prev) => new Set(prev).add(photo));
    },
    []
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      style={[
        cardStyle,
        styles.cardBase,
        getBoxShadow("#ffd700", { width: 0, height: 4 }, 0.3, 12),
      ]}
    >
        {/* Decorative star accent */}
        <DecorativeAccent color={config.color} size="default" opacity={0.5} />

      <View style={styles.content}>
        <View style={styles.header}>
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: config.color + "25",
                borderColor: config.color + "50",
              },
            ]}
          >
            <Text style={styles.icon}>{config.icon}</Text>
          </View>
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.title,
                getTextShadow("#000", { width: 0, height: 1 }, 2),
              ]}
            >
              {milestone.title}
            </Text>
            <View style={styles.labelRow}>
              <Text style={styles.labelIcon}>{config.icon}</Text>
              <Text style={[styles.label, { color: config.color }]}>
                {config.label}
              </Text>
            </View>
            <Text style={styles.date}>
              {formatDateUS(milestone.date)} • {daysSince} days ago
            </Text>
          </View>
        </View>

        {milestone.description && (
          <Text style={styles.description}>{milestone.description}</Text>
        )}

        {/* Photos */}
        {(() => {
          const validDisplayPhotos = milestonePhotos.filter(
            (photo) => !failedImages.has(photo)
          );
          return validDisplayPhotos.length > 0 ? (
            <View
              onStartShouldSetResponder={(evt) => {
                // Only capture horizontal scroll gestures
                if (Platform.OS === "web") {
                  return false; // Let browser handle it on web
                }
                return true;
              }}
              onMoveShouldSetResponder={(evt) => {
                // Only capture if it's a horizontal movement
                if (Platform.OS === "web") {
                  return false; // Let browser handle it on web
                }
                const { dx, dy } = evt.nativeEvent;
                return Math.abs(dx) > Math.abs(dy); // Horizontal scroll
              }}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.photosContainer}
                contentContainerStyle={styles.photosContent}
                nestedScrollEnabled={true}
              >
                {validDisplayPhotos.map((photo, photoIndex) => (
                  <Image
                    key={photoIndex}
                    source={photo}
                    style={[
                      styles.photo,
                      {
                        borderColor: config.color + "60",
                      },
                    ]}
                    contentFit="cover"
                    cachePolicy="disk"
                    transition={150}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null;
        })()}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: CARD_BORDER_RADIUS_LARGE,
    padding: CARD_PADDING_LARGE,
    marginBottom: CARD_MARGIN_BOTTOM,
    marginHorizontal: CARD_MARGIN_HORIZONTAL,
    overflow: "hidden",
    position: "relative",
    zIndex: 2,
    borderWidth: 1,
    elevation: 5,
  },
  cardBase: {
    backgroundColor: "#2d1810",
    borderColor: "#ffd70040",
  },
  content: {
    position: "relative",
    zIndex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    borderWidth: 2,
  },
  icon: {
    fontSize: 36,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#ffd700",
    marginBottom: 6,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  labelIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  date: {
    fontSize: 12,
    color: "#8b7355",
    fontStyle: "italic",
  },
  description: {
    fontSize: 15,
    color: "#d4a574",
    lineHeight: 22,
    marginBottom: 16,
  },
  photosContainer: {
    marginTop: 8,
  },
  photosContent: {
    gap: 10,
    paddingRight: 20,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: "#1a0f00",
  },
});

export default memo(MilestoneCard);

