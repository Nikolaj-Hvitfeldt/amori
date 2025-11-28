import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Moment } from "../../types/moments";
import RotatingPhotoBackground from "../RotatingPhotoBackground";
import { getThumbnailUrl, filterValidPhotos } from "../../utils/imageUtils";
import { getBoxShadow, getTextShadow } from "../../utils/shadows";
import { formatDateUS } from "../../utils/dateUtils";
import {
  MOMENT_COLOR,
  MOMENT_BG,
  MOMENT_TEXT,
} from "../../constants/theme";
import {
  CARD_MARGIN_HORIZONTAL,
  CARD_MARGIN_BOTTOM,
  CARD_PADDING,
  CARD_BORDER_RADIUS_LARGE,
  ACCENT_CIRCLE_SIZE_LARGE,
  ACCENT_CIRCLE_OFFSET_LARGE,
} from "../../constants/spacing";

interface TimelineMomentCardProps {
  moment: Moment;
  onPress: () => void;
}

export default function TimelineMomentCard({
  moment,
  onPress,
}: TimelineMomentCardProps) {
  const momentPhotos = filterValidPhotos(moment.photos || []);
  const thumbnailPhotos = momentPhotos.map((photo) => getThumbnailUrl(photo));

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.card,
        {
          backgroundColor: MOMENT_BG,
          borderColor: MOMENT_COLOR + "40",
          ...getBoxShadow(MOMENT_COLOR, { width: 0, height: 6 }, 0.5, 16),
        },
      ]}
    >
      {/* Decorative heart accent */}
      <View
        style={[
          styles.accentCircle,
          {
            backgroundColor: MOMENT_COLOR + "15",
          },
        ]}
      />

      {/* Rotating Photo Background */}
      {momentPhotos.length > 0 && (
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
                  {
                    color: momentPhotos.length > 0 ? "#ffffff" : MOMENT_TEXT,
                  },
                  getTextShadow("rgba(0, 0, 0, 0.75)", { width: 0, height: 1 }, 3),
                ]}
              >
                {moment.title}
              </Text>
              <Text style={styles.icon}>💕</Text>
            </View>
            <Text
              style={[
                styles.date,
                {
                  color:
                    momentPhotos.length > 0 ? "#f3f4f6" : MOMENT_TEXT + "80",
                },
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
                  {
                    color: momentPhotos.length > 0 ? "#ffffff" : MOMENT_COLOR,
                  },
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
            {
              color: momentPhotos.length > 0 ? "#ffffff" : MOMENT_TEXT + "CC",
            },
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
  accentCircle: {
    position: "absolute",
    top: ACCENT_CIRCLE_OFFSET_LARGE,
    right: ACCENT_CIRCLE_OFFSET_LARGE,
    width: ACCENT_CIRCLE_SIZE_LARGE,
    height: ACCENT_CIRCLE_SIZE_LARGE,
    borderRadius: ACCENT_CIRCLE_SIZE_LARGE / 2,
    opacity: 0.6,
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

