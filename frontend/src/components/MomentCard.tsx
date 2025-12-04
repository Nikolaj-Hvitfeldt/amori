import React, { memo, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Moment } from "../types/moments";
import RotatingPhotoBackground from "./RotatingPhotoBackground";
import DecorativeAccent from "./common/DecorativeAccent";
import { getThumbnailUrl, filterValidPhotos } from "../utils/imageUtils";
import { getBoxShadow, getTextShadow } from "../utils/shadows";
import { formatDateUS } from "../utils/dateUtils";
import {
  MOMENT_COLOR,
  MOMENT_BG,
  MOMENT_TEXT,
} from "../constants/theme";
import {
  CARD_MARGIN_HORIZONTAL,
  CARD_MARGIN_BOTTOM,
  CARD_PADDING,
  CARD_BORDER_RADIUS_LARGE,
} from "../constants/spacing";

interface MomentCardProps {
  moment: Moment;
  onPress: () => void;
  onLongPress?: () => void;
  variant?: "timeline" | "screen";
}

function MomentCard({
  moment,
  onPress,
  onLongPress,
  variant = "timeline",
}: MomentCardProps) {
  const momentPhotos = useMemo(
    () => filterValidPhotos(moment.photos || []),
    [moment.photos]
  );
  const thumbnailPhotos = useMemo(
    () => momentPhotos.map((photo) => getThumbnailUrl(photo)),
    [momentPhotos]
  );

  // Adjust styling based on variant
  const cardStyle = useMemo(
    () =>
      variant === "screen"
        ? {
            borderRadius: 24,
            padding: 20,
            marginBottom: 20,
            marginHorizontal: 20,
          }
        : styles.card,
    [variant]
  );

  const hasPhotos = momentPhotos.length > 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      style={[
        cardStyle,
        styles.cardBase,
        getBoxShadow(MOMENT_COLOR, { width: 0, height: 6 }, 0.5, 16),
      ]}
    >
      {/* Decorative heart accent */}
      <DecorativeAccent color={MOMENT_COLOR} size="large" opacity={0.6} />

      {/* Rotating Photo Background */}
      {hasPhotos && (
        <RotatingPhotoBackground
          photos={thumbnailPhotos}
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
                {moment.title}
              </Text>
              {variant === "timeline" && <Text style={styles.icon}>💕</Text>}
            </View>
            <Text
              style={[
                styles.date,
                hasPhotos ? styles.dateWithPhotos : styles.dateWithoutPhotos,
                getTextShadow("rgba(0, 0, 0, 0.75)", { width: 0, height: 1 }, 3),
              ]}
            >
              {formatDateUS(moment.story_date)}
            </Text>
            <View style={styles.labelRow}>
              <Text style={styles.labelIcon}>💕</Text>
              <Text
                style={[
                  styles.label,
                  hasPhotos ? styles.labelWithPhotos : styles.labelWithoutPhotos,
                  getTextShadow("rgba(0, 0, 0, 0.75)", { width: 0, height: 1 }, 3),
                ]}
              >
                Special Moment
              </Text>
            </View>
          </View>
        </View>

        <Text
          style={[
            styles.description,
            hasPhotos ? styles.descriptionWithPhotos : styles.descriptionWithoutPhotos,
            getTextShadow("rgba(0, 0, 0, 0.75)", { width: 0, height: 1 }, 3),
          ]}
          numberOfLines={2}
        >
          {moment.description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: CARD_BORDER_RADIUS_LARGE,
    padding: CARD_PADDING,
    marginBottom: CARD_MARGIN_BOTTOM,
    marginHorizontal: CARD_MARGIN_HORIZONTAL,
    minHeight: 180,
    overflow: "hidden",
    position: "relative",
    borderWidth: 2,
    elevation: 10,
    zIndex: 2,
  },
  cardBase: {
    backgroundColor: MOMENT_BG,
    borderColor: MOMENT_COLOR + "40",
  },
  titleWithPhotos: {
    color: "#ffffff",
  },
  titleWithoutPhotos: {
    color: MOMENT_TEXT,
  },
  dateWithPhotos: {
    color: "#f3f4f6",
  },
  dateWithoutPhotos: {
    color: MOMENT_TEXT + "80",
  },
  labelWithPhotos: {
    color: "#ffffff",
  },
  labelWithoutPhotos: {
    color: MOMENT_COLOR,
  },
  descriptionWithPhotos: {
    color: "#ffffff",
  },
  descriptionWithoutPhotos: {
    color: MOMENT_TEXT + "CC",
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
  description: {
    fontSize: 16,
    marginTop: 8,
    fontWeight: "500",
  },
});

export default memo(MomentCard);

