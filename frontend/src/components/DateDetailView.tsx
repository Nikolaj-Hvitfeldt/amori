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
import { DateEntry, DateMood } from "../types/dates";
// Using View with opacity for gradient effect (can upgrade to expo-linear-gradient later)

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

interface DateDetailViewProps {
  dateEntry: DateEntry;
  onClose: () => void;
  onEdit: () => void;
}

const MOOD_OPTIONS: { value: DateMood; label: string; icon: string }[] = [
  { value: "magical", label: "Magical", icon: "✨" },
  { value: "romantic", label: "Romantic", icon: "💕" },
  { value: "adventurous", label: "Adventurous", icon: "🌟" },
  { value: "cozy", label: "Cozy", icon: "🕯️" },
  { value: "spontaneous", label: "Spontaneous", icon: "🎈" },
  { value: "dreamy", label: "Dreamy", icon: "🌙" },
];

// Time-based color themes
const TIME_THEMES: Record<TimeOfDay, { gradient: string[]; text: string }> = {
  morning: {
    gradient: ["#FFE5B4", "#FFD89B", "#FFC65D"],
    text: "#8B4513",
  },
  afternoon: {
    gradient: ["#87CEEB", "#B0E0E6", "#E0F6FF"],
    text: "#1E3A5F",
  },
  evening: {
    gradient: ["#FFB6C1", "#FFA07A", "#FF8C69"],
    text: "#8B0000",
  },
  night: {
    gradient: ["#1a1a2e", "#16213e", "#0f172a"],
    text: "#e5d3ff",
  },
};

// Mood-based accent colors
const MOOD_COLORS: Record<DateMood, string> = {
  magical: "#DDA0DD",
  romantic: "#FFB6C1",
  adventurous: "#FFD700",
  cozy: "#DEB887",
  spontaneous: "#FF69B4",
  dreamy: "#B0C4DE",
};

export default function DateDetailView({
  dateEntry,
  onClose,
  onEdit,
}: DateDetailViewProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Determine time of day from date (simplified - you can enhance this)
  const getTimeOfDay = (dateString: string): TimeOfDay => {
    const hour = new Date(dateString).getHours();
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 21) return "evening";
    return "night";
  };

  const timeOfDay = getTimeOfDay(dateEntry.date);
  const theme = TIME_THEMES[timeOfDay];
  const moodInfo = MOOD_OPTIONS.find((m) => m.value === dateEntry.mood) || MOOD_OPTIONS[1];
  const moodColor = MOOD_COLORS[dateEntry.mood];

  // Support both photos array and single image_url for backward compatibility
  const photos = 
    (dateEntry.photos && dateEntry.photos.length > 0)
      ? dateEntry.photos
      : dateEntry.image_url
      ? [dateEntry.image_url]
      : [];

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const formatDate = (dateString: string): string => {
    // European format: dd-mm-yyyy
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
      {/* Photo Carousel */}
      {photos.length > 0 && (
        <View style={styles.photoContainer}>
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
            {photos.map((photo, index) => (
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
              {photos.map((_, index) => (
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

          {/* Header Overlay */}
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
        </View>
      )}

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
          {/* Mood Badge */}
          <View style={[styles.moodBadge, { backgroundColor: moodColor + "40" }]}>
            <Text style={styles.moodIcon}>{moodInfo.icon}</Text>
            <Text style={[styles.moodLabel, { color: moodColor }]}>
              {moodInfo.label}
            </Text>
          </View>

          {/* Title and Date Header */}
          <View style={styles.dateHeader}>
            <Text style={[styles.dateText, { color: theme.text }]}>
              {dateEntry.title || formatDate(dateEntry.date)}
            </Text>
            <Text style={[styles.daysAgoText, { color: theme.text + "80" }]}>
              {formatDate(dateEntry.date)} • {getDaysAgo(dateEntry.date)}
            </Text>
          </View>

          {/* Location */}
          <View style={styles.locationContainer}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={[styles.locationText, { color: theme.text }]}>
              {dateEntry.location}
            </Text>
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={[styles.descriptionText, { color: theme.text }]}>
              {dateEntry.description}
            </Text>
          </View>

          {/* Highlights */}
          {dateEntry.highlights && dateEntry.highlights.length > 0 && (
            <View style={styles.highlightsContainer}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                ✨ Highlights
              </Text>
              {dateEntry.highlights.map((highlight, index) => (
                <View key={index} style={styles.highlightItem}>
                  <Text style={styles.highlightBullet}>•</Text>
                  <Text style={[styles.highlightText, { color: theme.text }]}>
                    {highlight}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Favorite Moment */}
          {dateEntry.favorite_moment && (
            <View style={[styles.favoriteMomentContainer, { borderLeftColor: moodColor }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                💫 Favorite Moment
              </Text>
              <Text style={[styles.favoriteMomentText, { color: theme.text }]}>
                "{dateEntry.favorite_moment}"
              </Text>
            </View>
          )}

          {/* Weather */}
          {dateEntry.weather && (
            <View style={styles.weatherContainer}>
              <Text style={styles.weatherIcon}>🌤️</Text>
              <Text style={[styles.weatherText, { color: theme.text }]}>
                {dateEntry.weather}
              </Text>
            </View>
          )}

          {/* Spacer */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>

      {/* Gradient Background Overlay - Using View with opacity */}
      {timeOfDay !== "night" && (
        <View
          style={[
            styles.gradientOverlay,
            { backgroundColor: theme.gradient[0] + "30" },
          ]}
          pointerEvents="none"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
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
    zIndex: 10,
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
    backgroundColor: "#0f172a",
    paddingTop: 30,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  moodBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  moodIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  moodLabel: {
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
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  locationIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  locationText: {
    fontSize: 18,
    fontWeight: "500",
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  descriptionText: {
    fontSize: 17,
    lineHeight: 26,
    letterSpacing: 0.3,
  },
  highlightsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  highlightItem: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "flex-start",
  },
  highlightBullet: {
    fontSize: 18,
    marginRight: 12,
    color: "#a78bfa",
  },
  highlightText: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
  favoriteMomentContainer: {
    backgroundColor: "rgba(167, 139, 250, 0.1)",
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    marginBottom: 24,
  },
  favoriteMomentText: {
    fontSize: 17,
    fontStyle: "italic",
    lineHeight: 26,
    letterSpacing: 0.3,
  },
  weatherContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  weatherIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  weatherText: {
    fontSize: 16,
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
});

