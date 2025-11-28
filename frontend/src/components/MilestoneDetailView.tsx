import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
} from "react-native";
import { Milestone } from "../types/milestones";
import { getMilestoneConfig } from "../constants/milestoneConfig";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface MilestoneDetailViewProps {
  milestone: Milestone;
  onClose: () => void;
  onEdit: () => void;
  allowEdit?: boolean;
}

const GOLD = "#ffd700";
const NIGHT = "#120a05";

const filterValidPhotos = (photoUrls: string[]): string[] => {
  if (!photoUrls || !Array.isArray(photoUrls)) {
    return [];
  }
  return photoUrls.filter(
    (url) =>
      url &&
      typeof url === "string" &&
      (url.startsWith("http://") || url.startsWith("https://"))
  );
};

const formatDate = (dateString: string): string => {
  const dateObj = new Date(dateString);
  if (isNaN(dateObj.getTime())) return "";
  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();
  return `${day}-${month}-${year}`;
};

const calculateDaysSince = (dateString: string): number => {
  const milestoneDate = new Date(dateString);
  const today = new Date();
  const diffTime = today.getTime() - milestoneDate.getTime();
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
};

export default function MilestoneDetailView({
  milestone,
  onClose,
  onEdit,
  allowEdit = true,
}: MilestoneDetailViewProps) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [carouselWidth, setCarouselWidth] = useState(SCREEN_WIDTH);

  const config = getMilestoneConfig(milestone.milestone_type);
  const photos = filterValidPhotos(milestone.photos || []);
  const daysSince = calculateDaysSince(milestone.date);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [fadeAnim]);

  return (
    <View style={styles.container}>
      {/* Header Overlay */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>✕</Text>
        </TouchableOpacity>
        {allowEdit && (
          <TouchableOpacity onPress={onEdit} style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Photo Carousel */}
      <View style={styles.photoContainer}>
        {photos.length > 0 ? (
          <>
            <Animated.ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: false }
              )}
              scrollEventThrottle={16}
              onLayout={(event) => {
                const width = event.nativeEvent.layout.width;
                if (width && width !== carouselWidth) {
                  setCarouselWidth(width);
                }
              }}
            >
              {photos.map((photo, index) => (
                <Image
                  key={`${photo}-${index}`}
                  source={{ uri: photo }}
                  style={[styles.photo, { width: carouselWidth }]}
                  resizeMode="cover"
                  onError={(error) => {
                    console.warn("Failed to load milestone image:", photo, error);
                  }}
                />
              ))}
            </Animated.ScrollView>
            {photos.length > 1 && (
              <View style={styles.photoIndicators}>
                {photos.map((_, index) => {
                  const inputRange = [
                    (index - 1) * carouselWidth,
                    index * carouselWidth,
                    (index + 1) * carouselWidth,
                  ];
                  const scale = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.7, 1.35, 0.7],
                    extrapolate: "clamp",
                  });
                  const opacity = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.3, 1, 0.3],
                    extrapolate: "clamp",
                  });
                  return (
                    <Animated.View
                      key={`indicator-${index}`}
                      style={[
                        styles.indicator,
                        {
                          backgroundColor: config.color,
                          opacity,
                          transform: [{ scale }],
                        },
                      ]}
                    />
                  );
                })}
              </View>
            )}
          </>
        ) : (
          <View style={styles.placeholder}>
            <View style={styles.placeholderGlow} />
            <View style={styles.placeholderGlowSecondary} />
            <Text style={styles.placeholderIcon}>{config.icon}</Text>
            <Text style={styles.placeholderText}>No photos yet</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.badge}>
            <Text style={styles.badgeIcon}>{config.icon}</Text>
            <Text style={[styles.badgeLabel, { color: config.color }]}>
              {config.label}
            </Text>
          </View>

          <Text style={styles.title}>{milestone.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaValue}>{formatDate(milestone.date)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Days since</Text>
              <Text style={styles.metaValue}>{daysSince}</Text>
            </View>
          </View>

          {milestone.description ? (
            <View style={styles.descriptionCard}>
              <Text style={styles.descriptionText}>
                {milestone.description}
              </Text>
            </View>
          ) : (
            <View style={styles.descriptionCard}>
              <Text style={[styles.descriptionText, { opacity: 0.6 }]}>
                No description added yet.
              </Text>
            </View>
          )}

          {photos.length > 0 && (
            <View style={{ marginTop: 24 }}>
              <Text style={styles.sectionHeading}>Gallery</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingVertical: 12 }}
              >
                {photos.map((photo, index) => (
                  <Image
                    key={`thumb-${photo}-${index}`}
                    source={{ uri: photo }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NIGHT,
  },
  header: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 20,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: GOLD + "55",
  },
  headerButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  editButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: GOLD,
  },
  editButtonText: {
    color: NIGHT,
    fontSize: 16,
    fontWeight: "600",
  },
  photoContainer: {
    height: SCREEN_HEIGHT * 0.5,
    position: "relative",
    paddingBottom: 24,
    backgroundColor: "#1f120a",
  },
  photo: {
    width: SCREEN_WIDTH,
    height: "100%",
  },
  photoIndicators: {
    position: "absolute",
    bottom: 46,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderGlow: {
    position: "absolute",
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    borderRadius: SCREEN_WIDTH * 0.35,
    backgroundColor: GOLD + "20",
  },
  placeholderGlowSecondary: {
    position: "absolute",
    width: SCREEN_WIDTH * 0.5,
    height: SCREEN_WIDTH * 0.5,
    borderRadius: SCREEN_WIDTH * 0.25,
    backgroundColor: GOLD + "10",
  },
  placeholderIcon: {
    fontSize: 70,
    color: GOLD,
  },
  placeholderText: {
    marginTop: 12,
    color: "#fcefb4",
    fontSize: 16,
    fontStyle: "italic",
  },
  content: {
    flex: 1,
    marginTop: -32,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#1d1109",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,215,0,0.12)",
    borderWidth: 1,
    borderColor: GOLD + "40",
    marginBottom: 16,
  },
  badgeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  badgeLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  title: {
    fontSize: 30,
    color: GOLD,
    fontWeight: "700",
    marginBottom: 16,
    lineHeight: 36,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  metaItem: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#2a160e",
    borderWidth: 1,
    borderColor: GOLD + "25",
  },
  metaLabel: {
    color: "#d4a574",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  metaValue: {
    color: "#fff4c1",
    fontSize: 18,
    fontWeight: "600",
  },
  descriptionCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GOLD + "30",
    backgroundColor: "#231209",
    padding: 20,
  },
  descriptionText: {
    color: "#f5d3a6",
    fontSize: 16,
    lineHeight: 24,
  },
  sectionHeading: {
    color: GOLD,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  thumbnail: {
    width: 120,
    height: 120,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GOLD + "40",
    backgroundColor: "#120a05",
  },
});

