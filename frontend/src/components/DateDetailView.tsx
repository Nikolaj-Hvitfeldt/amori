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
import { DateEntry, DateMood } from "../types/dates";
// Using View with opacity for gradient effect (can upgrade to expo-linear-gradient later)

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

interface DateDetailViewProps {
  dateEntry: DateEntry;
  onClose: () => void;
  onEdit: () => void;
  allowEdit?: boolean;
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
  allowEdit = true,
}: DateDetailViewProps) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [carouselWidth, setCarouselWidth] = useState(SCREEN_WIDTH);

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
    // On web, opacity animations work fine without native driver
    // On native, we can use native driver for better performance
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false, // Opacity can be animated without native driver on all platforms
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
            onLayout={(event) => {
              const width = event.nativeEvent.layout.width;
              if (width && width !== carouselWidth) {
                setCarouselWidth(width);
              }
            }}
          >
            {photos.map((photo, index) => (
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
              {photos.map((_, index) => {
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
                        backgroundColor: moodColor,
                        opacity,
                        transform: [{ scale }],
                      },
                    ]}
                  />
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          photos.length === 0 && styles.contentNoPhotos,
          { opacity: fadeAnim },
        ]}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Mood Badge */}
          <View
            style={[
              styles.moodBadge,
              { backgroundColor: moodColor + "25", borderColor: moodColor + "60" },
            ]}
          >
            <Text style={styles.moodIcon}>{moodInfo.icon}</Text>
            <Text style={[styles.moodLabel, { color: moodColor }]}>
              {moodInfo.label}
            </Text>
          </View>

          {/* Title and Meta */}
          <Text style={[styles.titleText, { color: theme.text }]}>
            {dateEntry.title || formatDate(dateEntry.date)}
          </Text>
          <Text style={[styles.subtitleText, { color: theme.text + "99" }]}>
            {formatDate(dateEntry.date)} • {getDaysAgo(dateEntry.date)}
          </Text>

          <View style={styles.metaGrid}>
            <View style={[styles.metaCard, { borderColor: moodColor + "50" }]}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={[styles.metaValue, { color: theme.text }]}>
                {formatDate(dateEntry.date)}
              </Text>
            </View>
            <View style={[styles.metaCard, { borderColor: moodColor + "50" }]}>
              <Text style={styles.metaLabel}>Days since</Text>
              <Text style={[styles.metaValue, { color: theme.text }]}>
                {calculateDaysSince(dateEntry.date)}
              </Text>
            </View>
          </View>

          <View style={styles.metaGrid}>
            <View style={[styles.metaCard, { borderColor: moodColor + "50" }]}>
              <Text style={styles.metaLabel}>Mood</Text>
              <Text style={[styles.metaValue, { color: theme.text }]}>
                {moodInfo.icon} {moodInfo.label}
              </Text>
            </View>
          </View>

          {(dateEntry.location || dateEntry.weather) && (
          <View style={styles.metaGrid}>
            {dateEntry.location && (
              <View style={[styles.metaCard, styles.metaCardWide, { borderColor: moodColor + "40" }]}>
                <Text style={styles.metaLabel}>Location</Text>
                <Text style={[styles.metaValue, { color: theme.text }]}>
                  {dateEntry.location}
                </Text>
              </View>
            )}
            {dateEntry.weather && (
              <View style={[styles.metaCard, styles.metaCardCompact, { borderColor: moodColor + "40" }]}>
                <Text style={styles.metaLabel}>Weather</Text>
                <Text style={[styles.metaValue, { color: theme.text }]}>
                  {dateEntry.weather}
                </Text>
              </View>
            )}
          </View>
        )}

          {/* Story */}
          <View style={[styles.sectionCard, styles.descriptionCard]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              📖 Story
            </Text>
            <Text
              style={[
                styles.sectionBody,
                { color: theme.text + "dd" },
              ]}
            >
              {dateEntry.description || "No story written for this date."}
            </Text>
          </View>

          {/* Highlights */}
          {dateEntry.highlights && dateEntry.highlights.length > 0 && (
            <View style={[styles.sectionCard, styles.listCard]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                ✨ Highlights
              </Text>
              {dateEntry.highlights.map((highlight, index) => (
                <View key={index} style={styles.highlightRow}>
                  <View style={[styles.highlightBullet, { backgroundColor: moodColor + "70" }]} />
                  <Text style={[styles.sectionBody, { color: theme.text }]}>
                    {highlight}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Favorite Moment */}
          {dateEntry.favorite_moment && (
            <View
              style={[
                styles.sectionCard,
                styles.favoriteCard,
                { borderColor: moodColor + "80" },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                💫 Favorite Moment
              </Text>
              <Text
                style={[
                  styles.sectionBody,
                  styles.favoriteQuote,
                  { color: theme.text },
                ]}
              >
                "{dateEntry.favorite_moment}"
              </Text>
            </View>
          )}

          <View style={{ height: 60 }} />
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
    paddingBottom: 24,
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
    paddingVertical: 4,
    backgroundColor: "transparent",
    zIndex: 5,
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
  contentNoPhotos: {
    marginTop: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingTop: Platform.OS === "ios" ? 70 : 60,
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
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 18,
  },
  moodIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  moodLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  titleText: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 15,
    marginBottom: 20,
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  metaCard: {
    width: "48%",
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.02)",
    marginBottom: 12,
  },
  metaCardWide: {
    width: "100%",
  },
  metaCardCompact: {
    width: "48%",
  },
  metaLabel: {
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#94a3b8",
    marginBottom: 6,
  },
  metaValue: {
    fontSize: 18,
    fontWeight: "600",
  },
  sectionCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(15,23,42,0.8)",
    padding: 20,
    marginBottom: 18,
  },
  descriptionCard: {
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(15,23,42,0.9)",
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
  listCard: {
    backgroundColor: "rgba(15,23,42,0.85)",
  },
  highlightRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  highlightBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  favoriteCard: {
    borderWidth: 1.5,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  favoriteQuote: {
    fontStyle: "italic",
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

