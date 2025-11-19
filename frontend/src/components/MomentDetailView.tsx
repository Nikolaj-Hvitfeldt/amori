import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  Platform,
  StyleSheet,
} from "react-native";
import { Moment } from "../types/moments";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface MomentDetailViewProps {
  moment: Moment;
  onClose: () => void;
  onEdit: () => void;
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
}: MomentDetailViewProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const photos = moment.photos || [];

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

  const getDaysAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
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
        <TouchableOpacity
          onPress={onEdit}
          style={styles.editButton}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
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
              onMomentumScrollEnd={(event) => {
                const index = Math.round(
                  event.nativeEvent.contentOffset.x / SCREEN_WIDTH
                );
                setCurrentPhotoIndex(index);
              }}
            >
              {photos.map((photo: string, index: number) => (
                <Image
                  key={index}
                  source={{ uri: photo }}
                  style={styles.photo}
                  resizeMode="cover"
                />
              ))}
            </Animated.ScrollView>

            {/* Photo Indicators */}
            {photos.length > 1 && (
              <View style={styles.photoIndicators}>
                {photos.map((_: string, index: number) => (
                  <View
                    key={index}
                    style={[
                      styles.indicator,
                      index === currentPhotoIndex && styles.activeIndicator,
                    ]}
                  />
                ))}
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
          <View style={[styles.heartBadge, { backgroundColor: MOMENT_COLOR + "40" }]}>
            <Text style={styles.heartIcon}>💕</Text>
            <Text style={[styles.heartLabel, { color: MOMENT_COLOR }]}>
              Special Moment
            </Text>
          </View>

          {/* Title and Date Header */}
          <View style={styles.dateHeader}>
            <Text style={[styles.dateText, { color: MOMENT_TEXT }]}>
              {moment.title}
            </Text>
            <Text style={[styles.daysAgoText, { color: MOMENT_TEXT + "80" }]}>
              {formatDate(moment.story_date)} • {getDaysAgo(moment.story_date)}
            </Text>
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={[styles.descriptionText, { color: MOMENT_TEXT }]}>
              {moment.description}
            </Text>
          </View>

          {/* Spacer */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>

      {/* Gradient Background Overlay */}
      <View
        style={[
          styles.gradientOverlay,
          { backgroundColor: MOMENT_GRADIENT[0] + "20" },
        ]}
        pointerEvents="none"
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
  },
  photo: {
    width: SCREEN_WIDTH,
    height: "100%",
  },
  photoIndicators: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  activeIndicator: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    width: 24,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  heartIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  heartLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  dateHeader: {
    marginBottom: 16,
  },
  dateText: {
    fontSize: 32,
    fontWeight: "300",
    letterSpacing: 1,
    fontFamily: Platform.select({ ios: "Georgia", android: "serif" }),
    marginBottom: 4,
  },
  daysAgoText: {
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 4,
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  descriptionText: {
    fontSize: 17,
    lineHeight: 26,
    letterSpacing: 0.3,
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

