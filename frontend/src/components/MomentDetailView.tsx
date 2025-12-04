import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { Moment } from "../types/moments";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface MomentDetailViewProps {
  moment: Moment;
  onClose: () => void;
  onEdit: () => void;
  allowEdit?: boolean;
}

// Pink/romantic theme
const MOMENT_COLOR = "#FF6B9D";
const MOMENT_GRADIENT = ["#FF6B9D", "#FF8E9D", "#FFB3C1"];
const MOMENT_BG = "#1a0f1a";
const MOMENT_TEXT = "#ffd1e0";

export default function MomentDetailView({
  moment,
  onClose,
  onEdit,
  allowEdit = true,
}: MomentDetailViewProps) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [carouselWidth, setCarouselWidth] = useState(SCREEN_WIDTH);

  // Filter out invalid/blob URLs
  const filterValidPhotos = (photoUrls: string[]): string[] => {
    return photoUrls.filter(
      (url) =>
        url &&
        typeof url === "string" &&
        (url.startsWith("http://") || url.startsWith("https://"))
    );
  };

  const photos = filterValidPhotos(moment.photos || []);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, []);

  const formatDate = (dateString: string): string => {
    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) return "";
    
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const calculateDaysSince = (dateString: string): number => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const getDaysAgo = (dateString: string) => {
    const diffDays = calculateDaysSince(dateString);
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? "month" : "months"} ago`;
    }
    const years = Math.floor(diffDays / 365);
    return `${years} ${years === 1 ? "year" : "years"} ago`;
  };

  return (
    <View style={styles.container}>
      {/* Header Overlay - Always visible */}
      <View style={styles.headerOverlay}>
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeButton}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        {allowEdit && (
          <TouchableOpacity
            onPress={onEdit}
            style={styles.editButton}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Photo Carousel or Default Placeholder */}
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
              {photos.map((photo: string, index: number) => (
                <Image
                  key={index}
                  source={photo}
                  style={[styles.photo, { width: carouselWidth }]}
                  contentFit="cover"
                  cachePolicy="disk"
                  transition={200}
                />
              ))}
            </Animated.ScrollView>

            {/* Photo Indicators */}
            {photos.length > 1 && (
              <View style={styles.photoIndicators}>
                {photos.map((_: string, index: number) => {
                  const inputRange = [
                    (index - 1) * carouselWidth,
                    index * carouselWidth,
                    (index + 1) * carouselWidth,
                  ];
                  const scale = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.7, 1.4, 0.7],
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
                          backgroundColor: MOMENT_COLOR,
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
          <View style={styles.defaultPhotoContainer}>
            {/* Gradient layers for depth */}
            <View style={[styles.gradientLayer, { backgroundColor: MOMENT_GRADIENT[0] + "40" }]} />
            <View style={[styles.gradientLayer, { backgroundColor: MOMENT_GRADIENT[1] + "30" }]} />
            <View style={[styles.gradientLayer, { backgroundColor: MOMENT_GRADIENT[2] + "20" }]} />
            <View style={styles.defaultPhotoContent}>
              <Text style={styles.defaultPhotoIcon}>💕</Text>
              <Text style={styles.defaultPhotoText}>No photos yet</Text>
            </View>
          </View>
        )}
      </View>

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim },
        ]}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Heart Badge */}
          <View
            style={[
              styles.heartBadge,
              { borderColor: MOMENT_COLOR + "60", backgroundColor: MOMENT_COLOR + "15" },
            ]}
          >
            <Text style={styles.heartIcon}>💕</Text>
            <Text style={[styles.heartLabel, { color: MOMENT_COLOR }]}>
              Special Moment
            </Text>
          </View>

          <Text style={[styles.titleText, { color: MOMENT_TEXT }]}>{moment.title}</Text>
          <Text style={[styles.subtitleText, { color: MOMENT_TEXT + "aa" }]}>
            {formatDate(moment.story_date)} • {getDaysAgo(moment.story_date)}
          </Text>

          <View style={styles.metaGrid}>
            <View style={[styles.metaCard, { borderColor: MOMENT_COLOR + "60" }]}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={[styles.metaValue, { color: MOMENT_TEXT }]}>
                {formatDate(moment.story_date)}
              </Text>
            </View>
            <View style={[styles.metaCard, { borderColor: MOMENT_COLOR + "60" }]}>
              <Text style={styles.metaLabel}>Days since</Text>
              <Text style={[styles.metaValue, { color: MOMENT_TEXT }]}>
                {calculateDaysSince(moment.story_date)}
              </Text>
            </View>
          </View>

          <View style={[styles.sectionCard, styles.descriptionCard]}>
            <Text style={[styles.sectionTitle, { color: MOMENT_TEXT }]}>💖 Story</Text>
            <Text style={[styles.sectionBody, { color: MOMENT_TEXT + "dd" }]}>
              {moment.description || "No description for this moment yet."}
            </Text>
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </Animated.View>

      {/* Gradient Background Overlay */}
      <View
        style={[
          styles.gradientOverlay,
          { backgroundColor: MOMENT_GRADIENT[0] + "20" },
          { pointerEvents: "none" },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MOMENT_BG,
  },
  photoContainer: {
    height: SCREEN_HEIGHT * 0.5,
    position: "relative",
    paddingBottom: 24,
  },
  photo: {
    width: SCREEN_WIDTH,
    height: "100%",
  },
  photoIndicators: {
    position: "absolute",
    bottom: 54,
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
  headerOverlay: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    zIndex: 100,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  editButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    marginTop: -40,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: MOMENT_BG,
    paddingTop: 30,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  heartBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 18,
  },
  heartIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  heartLabel: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  titleText: {
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  subtitleText: {
    fontSize: 15,
    marginBottom: 20,
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  metaCard: {
    width: "48%",
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginBottom: 12,
  },
  metaLabel: {
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#ffb0c8",
    marginBottom: 8,
  },
  metaValue: {
    fontSize: 18,
    fontWeight: "600",
  },
  sectionCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(26,15,26,0.95)",
    padding: 22,
    marginBottom: 18,
  },
  descriptionCard: {
    borderColor: MOMENT_COLOR + "30",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  sectionBody: {
    fontSize: 16,
    lineHeight: 24,
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.3,
    opacity: 0.3,
    pointerEvents: "none",
  },
  defaultPhotoContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
    position: "relative",
    overflow: "hidden",
  },
  gradientLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  defaultPhotoContent: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  defaultPhotoIcon: {
    fontSize: 80,
    marginBottom: 16,
    opacity: 0.7,
  },
  defaultPhotoText: {
    fontSize: 18,
    color: MOMENT_TEXT + "DD",
    fontWeight: "500",
    letterSpacing: 1,
  },
});

