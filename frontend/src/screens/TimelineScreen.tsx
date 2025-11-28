import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Image,
  Dimensions,
} from "react-native";
import { momentsService } from "../services/moments";
import { datesService } from "../services/dates";
import { milestonesService } from "../services/milestones";
import { Moment } from "../types/moments";
import { DateEntry, DateMood } from "../types/dates";
import { Milestone } from "../types/milestones";
import MomentDetailView from "../components/MomentDetailView";
import DateDetailView from "../components/DateDetailView";
import MilestoneDetailView from "../components/MilestoneDetailView";
import RotatingPhotoBackground from "../components/RotatingPhotoBackground";
import { getThumbnailUrl } from "../utils/imageUtils";
import { MILESTONE_CONFIG } from "../constants/milestoneConfig";
import { getCachedData, setCachedData, invalidateCache } from "../utils/cache";

// Unified timeline item type
type TimelineItemType = "moment" | "date" | "milestone";

interface TimelineItem {
  id: string;
  type: TimelineItemType;
  date: string;
  title: string;
  description?: string;
  photos?: string[];
  // Type-specific data
  moment?: Moment;
  dateEntry?: DateEntry;
  milestone?: Milestone;
}

// Helper function for shadows
const getBoxShadow = (
  shadowColor: string,
  shadowOffset: { width: number; height: number },
  shadowOpacity: number,
  shadowRadius: number
) => {
  if (Platform.OS === "web") {
    const color = shadowColor.startsWith("#")
      ? shadowColor +
        Math.round(shadowOpacity * 255)
          .toString(16)
          .padStart(2, "0")
      : shadowColor;
    return {
      boxShadow: `${shadowOffset.width}px ${shadowOffset.height}px ${shadowRadius}px 0px ${color}`,
    } as any;
  }
  return {
    shadowColor,
    shadowOffset,
    shadowOpacity,
    shadowRadius,
  };
};

// Helper function for text shadows
const getTextShadow = (
  textShadowColor: string,
  textShadowOffset: { width: number; height: number },
  textShadowRadius: number
) => {
  return Platform.select({
    web: {
      textShadow: `${textShadowOffset.width}px ${textShadowOffset.height}px ${textShadowRadius}px ${textShadowColor}`,
    } as any,
    default: {
      textShadowColor,
      textShadowOffset,
      textShadowRadius,
    },
  });
};

// Filter valid photos
const filterValidPhotos = (photoUrls: string[]): string[] => {
  if (!photoUrls || !Array.isArray(photoUrls)) return [];
  return photoUrls.filter(
    (url) =>
      url &&
      typeof url === "string" &&
      url.trim() !== "" &&
      (url.startsWith("http://") || url.startsWith("https://"))
  );
};

// Format date
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
};

// Calculate days since
const calculateDaysSince = (dateString: string): number => {
  const milestoneDate = new Date(dateString);
  const today = new Date();
  const diffTime = today.getTime() - milestoneDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Mood colors and info
const MOOD_COLORS: Record<DateMood, string> = {
  magical: "#DDA0DD",
  romantic: "#FFB6C1",
  adventurous: "#FFD700",
  cozy: "#FFA07A",
  spontaneous: "#FF69B4",
  dreamy: "#DDA0DD",
};

const MOOD_OPTIONS: { value: DateMood; label: string; icon: string }[] = [
  { value: "magical", label: "Magical", icon: "✨" },
  { value: "romantic", label: "Romantic", icon: "💕" },
  { value: "adventurous", label: "Adventurous", icon: "🌟" },
  { value: "cozy", label: "Cozy", icon: "🕯️" },
  { value: "spontaneous", label: "Spontaneous", icon: "🎈" },
  { value: "dreamy", label: "Dreamy", icon: "🌙" },
];

const getMoodInfo = (moodValue: DateMood) => {
  return (
    MOOD_OPTIONS.find((option) => option.value === moodValue) || MOOD_OPTIONS[1]
  );
};

// Theme colors
const MOMENT_COLOR = "#FF6B9D";
const MOMENT_BG = "#1a0f1a";
const MOMENT_TEXT = "#ffd1e0";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ITEMS_PER_TYPE = 10; // Load 10 items from each type per page (30 total)

// Cache keys
const CACHE_KEY_TIMELINE_ITEMS = "timeline_items";
const CACHE_KEY_TIMELINE_STATE = "timeline_state";
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export default function TimelineScreen() {
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // Track pagination state for each type
  const [momentsOffset, setMomentsOffset] = useState(0);
  const [datesOffset, setDatesOffset] = useState(0);
  const [milestonesOffset, setMilestonesOffset] = useState(0);
  const [momentsTotal, setMomentsTotal] = useState(0);
  const [datesTotal, setDatesTotal] = useState(0);
  const [milestonesTotal, setMilestonesTotal] = useState(0);

  useEffect(() => {
    loadTimelineFromCacheOrAPI(true);
  }, []);

  // Load timeline from cache first, then API if needed
  const loadTimelineFromCacheOrAPI = async (reset: boolean = true) => {
    if (reset) {
      // Try to load from cache first
      try {
        const [cachedItems, cachedState] = await Promise.all([
          getCachedData<TimelineItem[]>(CACHE_KEY_TIMELINE_ITEMS),
          getCachedData<{
            momentsOffset: number;
            datesOffset: number;
            milestonesOffset: number;
            momentsTotal: number;
            datesTotal: number;
            milestonesTotal: number;
            hasMore: boolean;
          }>(CACHE_KEY_TIMELINE_STATE),
        ]);

        if (cachedItems && cachedState) {
          // Restore from cache
          setTimelineItems(cachedItems);
          setMomentsOffset(cachedState.momentsOffset);
          setDatesOffset(cachedState.datesOffset);
          setMilestonesOffset(cachedState.milestonesOffset);
          setMomentsTotal(cachedState.momentsTotal);
          setDatesTotal(cachedState.datesTotal);
          setMilestonesTotal(cachedState.milestonesTotal);
          setHasMore(cachedState.hasMore);
          setLoading(false);

          // Still load fresh data in background to update cache
          loadTimeline(true, true); // true = reset, true = skipCache (update cache)
          return;
        }
      } catch (error) {
        console.warn("Error loading timeline from cache:", error);
      }
    }

    // No cache or cache miss - load from API
    await loadTimeline(reset, false);
  };

  const loadTimeline = async (
    reset: boolean = true,
    skipCache: boolean = false
  ) => {
    try {
      if (reset) {
        setLoading(true);
        setTimelineItems([]);
        setMomentsOffset(0);
        setDatesOffset(0);
        setMilestonesOffset(0);
      } else {
        setLoadingMore(true);
      }

      // Fetch paginated data in parallel
      const [momentsResult, datesResult, milestonesResult] = await Promise.all([
        momentsService.getAllMoments(ITEMS_PER_TYPE, reset ? 0 : momentsOffset),
        datesService.getAll(ITEMS_PER_TYPE, reset ? 0 : datesOffset),
        milestonesService.getAll(ITEMS_PER_TYPE, reset ? 0 : milestonesOffset),
      ]);

      const moments = momentsResult.data || momentsResult || [];
      const dates = datesResult.data || datesResult || [];
      const milestones = milestonesResult.data || milestonesResult || [];

      // Update totals
      if (momentsResult.total !== undefined)
        setMomentsTotal(momentsResult.total);
      if (datesResult.total !== undefined) setDatesTotal(datesResult.total);
      if (milestonesResult.total !== undefined)
        setMilestonesTotal(milestonesResult.total);

      // Convert to timeline items
      const newItems: TimelineItem[] = [
        ...moments.map((moment: Moment) => ({
          id: moment.id || `moment-${moment.title}`,
          type: "moment" as TimelineItemType,
          date: moment.story_date,
          title: moment.title,
          description: moment.description,
          photos: moment.photos,
          moment,
        })),
        ...dates.map((date: DateEntry) => ({
          id: date.id,
          type: "date" as TimelineItemType,
          date: date.date,
          title: date.title || date.location || "Untitled Date",
          description: date.description,
          photos: date.photos,
          dateEntry: date,
        })),
        ...milestones.map((milestone: Milestone) => ({
          id: milestone.id,
          type: "milestone" as TimelineItemType,
          date: milestone.date,
          title: milestone.title,
          description: milestone.description,
          photos: milestone.photos,
          milestone,
        })),
      ];

      // Merge with existing items if loading more
      let allItems: TimelineItem[];
      if (reset) {
        allItems = newItems;
      } else {
        // Deduplicate by ID to prevent duplicates
        const existingIds = new Set(timelineItems.map((item) => item.id));
        const uniqueNewItems = newItems.filter(
          (item) => !existingIds.has(item.id)
        );
        allItems = [...timelineItems, ...uniqueNewItems];
      }

      // Sort by date (newest first)
      allItems.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA; // Descending order (newest first)
      });

      setTimelineItems(allItems);

      // Calculate new offsets
      const newMomentsOffset = reset
        ? moments.length
        : momentsOffset + moments.length;
      const newDatesOffset = reset ? dates.length : datesOffset + dates.length;
      const newMilestonesOffset = reset
        ? milestones.length
        : milestonesOffset + milestones.length;

      // Update offsets
      setMomentsOffset(newMomentsOffset);
      setDatesOffset(newDatesOffset);
      setMilestonesOffset(newMilestonesOffset);

      // Check if there's more data
      const hasMoreMoments = newMomentsOffset < momentsTotal;
      const hasMoreDates = newDatesOffset < datesTotal;
      const hasMoreMilestones = newMilestonesOffset < milestonesTotal;
      const hasMoreData = hasMoreMoments || hasMoreDates || hasMoreMilestones;
      setHasMore(hasMoreData);

      // Cache the merged timeline items and state
      if (!skipCache) {
        try {
          await Promise.all([
            setCachedData(CACHE_KEY_TIMELINE_ITEMS, allItems, CACHE_TTL),
            setCachedData(
              CACHE_KEY_TIMELINE_STATE,
              {
                momentsOffset: newMomentsOffset,
                datesOffset: newDatesOffset,
                milestonesOffset: newMilestonesOffset,
                momentsTotal,
                datesTotal,
                milestonesTotal,
                hasMore: hasMoreData,
              },
              CACHE_TTL
            ),
          ]);
        } catch (error) {
          console.warn("Error caching timeline data:", error);
        }
      }
    } catch (error) {
      console.error("Error loading timeline:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      loadTimeline(false, false); // false = don't reset, false = cache results
    }
  };

  // Invalidate timeline cache when items are created/updated/deleted
  const invalidateTimelineCache = async () => {
    try {
      await Promise.all([
        invalidateCache(CACHE_KEY_TIMELINE_ITEMS),
        invalidateCache(CACHE_KEY_TIMELINE_STATE),
      ]);
    } catch (error) {
      console.warn("Error invalidating timeline cache:", error);
    }
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 100; // Trigger load more 100px before bottom
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;

    if (isCloseToBottom && hasMore && !loadingMore) {
      loadMore();
    }
  };

  const handleItemPress = (item: TimelineItem) => {
    setSelectedItem(item);
    setDetailModalVisible(true);
  };

  const closeDetailModal = () => {
    setDetailModalVisible(false);
    setTimeout(() => setSelectedItem(null), 300);
  };

  const renderMomentCard = (item: TimelineItem) => {
    if (!item.moment) return null;
    const moment = item.moment;
    const momentPhotos = filterValidPhotos(moment.photos || []);
    // Use thumbnails for list view performance
    const thumbnailPhotos = momentPhotos.map((photo) => getThumbnailUrl(photo));

    return (
      <TouchableOpacity
        key={item.id}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.7}
        style={{
          backgroundColor: MOMENT_BG,
          borderRadius: 24,
          padding: 20,
          marginBottom: 30, // Consistent gap (30px) for rope visibility
          marginHorizontal: 20,
          minHeight: 180,
          overflow: "hidden", // Hide line inside card
          position: "relative",
          borderWidth: 2,
          borderColor: MOMENT_COLOR + "40",
          ...getBoxShadow(MOMENT_COLOR, { width: 0, height: 6 }, 0.5, 16),
          elevation: 10,
          zIndex: 2, // Cards above line
        }}
      >
        {/* Decorative heart accent */}
        <View
          style={{
            position: "absolute",
            top: -20,
            right: -20,
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: MOMENT_COLOR + "15",
            opacity: 0.6,
          }}
        />

        {/* Rotating Photo Background - using thumbnails for performance */}
        {momentPhotos.length > 0 && (
          <RotatingPhotoBackground
            photos={thumbnailPhotos}
            interval={8000}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 0,
            }}
          />
        )}

        {/* Content */}
        <View style={{ position: "relative", zIndex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 8,
            }}
          >
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "600",
                    color: momentPhotos.length > 0 ? "#ffffff" : MOMENT_TEXT,
                    marginRight: 8,
                    ...getTextShadow(
                      "rgba(0, 0, 0, 0.75)",
                      { width: 0, height: 1 },
                      3
                    ),
                  }}
                >
                  {moment.title}
                </Text>
                <Text style={{ fontSize: 20 }}>💕</Text>
              </View>
              <Text
                style={{
                  fontSize: 12,
                  fontStyle: "italic",
                  color:
                    momentPhotos.length > 0 ? "#f3f4f6" : MOMENT_TEXT + "80",
                  marginBottom: 8,
                  ...getTextShadow(
                    "rgba(0, 0, 0, 0.75)",
                    { width: 0, height: 1 },
                    3
                  ),
                }}
              >
                {formatDate(moment.story_date)}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontSize: 20, marginRight: 8 }}>💕</Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: momentPhotos.length > 0 ? "#ffffff" : MOMENT_COLOR,
                    fontWeight: "500",
                    ...getTextShadow(
                      "rgba(0, 0, 0, 0.75)",
                      { width: 0, height: 1 },
                      3
                    ),
                  }}
                >
                  Special Moment
                </Text>
              </View>
            </View>
          </View>

          <Text
            style={{
              fontSize: 16,
              color: momentPhotos.length > 0 ? "#ffffff" : MOMENT_TEXT + "CC",
              marginTop: 8,
              fontWeight: "500",
              ...getTextShadow(
                "rgba(0, 0, 0, 0.75)",
                { width: 0, height: 1 },
                3
              ),
            }}
            numberOfLines={2}
          >
            {moment.description}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDateCard = (item: TimelineItem) => {
    if (!item.dateEntry) return null;
    const dateEntry = item.dateEntry;
    const moodInfo = getMoodInfo(dateEntry.mood);
    const dateMoodColor = MOOD_COLORS[dateEntry.mood];
    // Get photos array (support both photos and legacy image_url)
    const allDatePhotos =
      dateEntry.photos && dateEntry.photos.length > 0
        ? dateEntry.photos
        : dateEntry.image_url
        ? [dateEntry.image_url]
        : [];
    const datePhotos = filterValidPhotos(allDatePhotos);

    return (
      <TouchableOpacity
        key={item.id}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.7}
        style={{
          backgroundColor: "#0f172a",
          borderRadius: 16,
          padding: 20,
          marginBottom: 30, // Consistent gap (30px) for rope visibility
          marginHorizontal: 20,
          overflow: "hidden", // Hide line inside card
          position: "relative",
          zIndex: 2, // Cards above line
          borderWidth: 1,
          borderColor: "#374151",
          ...getBoxShadow(dateMoodColor, { width: 0, height: 4 }, 0.3, 12),
          elevation: 5,
        }}
      >
        {/* Decorative calendar accent */}
        <View
          style={{
            position: "absolute",
            top: -10,
            right: -10,
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: dateMoodColor + "15",
            opacity: 0.5,
          }}
        />

        {/* Rotating Photo Background */}
        {datePhotos.length > 0 && (
          <RotatingPhotoBackground
            photos={datePhotos}
            interval={8000}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 0,
            }}
          />
        )}

        {/* Content */}
        <View style={{ position: "relative", zIndex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 8,
            }}
          >
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "600",
                    color: datePhotos.length > 0 ? "#ffffff" : "#e5d3ff",
                    marginRight: 8,
                    ...getTextShadow(
                      "rgba(0, 0, 0, 0.75)",
                      { width: 0, height: 1 },
                      3
                    ),
                  }}
                >
                  {dateEntry.title || "Our Special Date"}
                </Text>
                <Text style={{ fontSize: 20 }}>📅</Text>
              </View>
              <Text
                style={{
                  fontSize: 12,
                  fontStyle: "italic",
                  color: datePhotos.length > 0 ? "#f3f4f6" : "#9ca3af",
                  marginBottom: 8,
                  ...getTextShadow(
                    "rgba(0, 0, 0, 0.75)",
                    { width: 0, height: 1 },
                    3
                  ),
                }}
              >
                {formatDate(dateEntry.date)}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontSize: 20, marginRight: 8 }}>
                  {moodInfo.icon}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: datePhotos.length > 0 ? "#ffffff" : "#a78bfa",
                    fontWeight: "500",
                    ...getTextShadow(
                      "rgba(0, 0, 0, 0.75)",
                      { width: 0, height: 1 },
                      3
                    ),
                  }}
                >
                  {moodInfo.label}
                </Text>
              </View>
            </View>
          </View>

          <Text
            style={{
              fontSize: 16,
              color: datePhotos.length > 0 ? "#ffffff" : "#d1d5db",
              marginBottom: 8,
              fontWeight: "500",
              ...getTextShadow(
                "rgba(0, 0, 0, 0.75)",
                { width: 0, height: 1 },
                3
              ),
            }}
          >
            📍 {dateEntry.location}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMilestoneCard = (item: TimelineItem) => {
    if (!item.milestone) return null;
    const milestone = item.milestone;
    const config = MILESTONE_CONFIG[milestone.milestone_type];
    const daysSince = calculateDaysSince(milestone.date);
    const milestonePhotos = filterValidPhotos(milestone.photos || []);

    return (
      <TouchableOpacity
        key={item.id}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.7}
        style={{
          backgroundColor: "#2d1810",
          borderRadius: 24,
          padding: 24,
          marginBottom: 30, // Consistent gap (30px) for rope visibility
          marginHorizontal: 20,
          overflow: "hidden", // Hide line inside card
          position: "relative",
          zIndex: 2, // Cards above line
          borderWidth: 1,
          borderColor: "#ffd70040",
          ...getBoxShadow("#ffd700", { width: 0, height: 4 }, 0.3, 12),
          elevation: 5,
        }}
      >
        {/* Decorative star accent */}
        <View
          style={{
            position: "absolute",
            top: -10,
            right: -10,
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: config.color + "15",
            opacity: 0.5,
          }}
        />

        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            marginBottom: 16,
            position: "relative",
            zIndex: 1,
          }}
        >
          <View
            style={{
              width: 70,
              height: 70,
              borderRadius: 35,
              backgroundColor: config.color + "25",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 16,
              borderWidth: 2,
              borderColor: config.color + "50",
            }}
          >
            <Text style={{ fontSize: 36 }}>{config.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "600",
                color: "#ffd700",
                marginBottom: 6,
                ...getTextShadow("#000", { width: 0, height: 1 }, 2),
              }}
            >
              {milestone.title}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <Text style={{ fontSize: 16, marginRight: 6 }}>
                {config.icon}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: config.color,
                  fontWeight: "500",
                }}
              >
                {config.label}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 12,
                color: "#8b7355",
                fontStyle: "italic",
              }}
            >
              {formatDate(milestone.date)} • {daysSince} days ago
            </Text>
          </View>
        </View>

        {milestone.description && (
          <Text
            style={{
              fontSize: 15,
              color: "#d4a574",
              lineHeight: 22,
              marginBottom: 16,
              position: "relative",
              zIndex: 1,
            }}
          >
            {milestone.description}
          </Text>
        )}

        {/* Photos */}
        {(() => {
          const validDisplayPhotos = milestonePhotos.filter(
            (photo) => !failedImages.has(photo)
          );
          return validDisplayPhotos.length > 0 ? (
            <View
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 8 }}
                contentContainerStyle={{
                  gap: 10,
                  paddingRight: 20,
                }}
                nestedScrollEnabled={true}
              >
                {validDisplayPhotos.map((photo, photoIndex) => (
                  <Image
                    key={photoIndex}
                    source={{ uri: photo }}
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: config.color + "60",
                      backgroundColor: "#1a0f00",
                    }}
                    resizeMode="cover"
                    onError={(error) => {
                      console.warn(
                        "Failed to load image on card:",
                        photo,
                        error
                      );
                      setFailedImages((prev: Set<string>) =>
                        new Set(prev).add(photo)
                      );
                    }}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null;
        })()}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B9D" />
        <Text style={styles.loadingText}>Loading your timeline...</Text>
      </View>
    );
  }

  if (timelineItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📅</Text>
        <Text style={styles.emptyTitle}>Your Timeline is Empty</Text>
        <Text style={styles.emptyText}>
          Start adding moments, dates, and milestones to see your journey
          together!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={400}
      >
        {/* Golden Rope Timeline - represents the bond between moments */}
        <View style={styles.timelineLine}>
          {/* Base golden rope */}
          <View style={styles.timelineLineDecoration} />
          {/* Rope texture overlay */}
          <View style={styles.timelineRopeTexture} />
          {/* Shine/highlight for 3D effect */}
          <View
            style={{
              position: "absolute",
              left: 1,
              top: 0,
              bottom: 0,
              width: 2,
              backgroundColor: "rgba(255, 255, 255, 0.3)",
              opacity: 0.6,
            }}
          />

          {/* Jump ring connecting rope to charm */}
          <View style={styles.jumpRing}>
            {/* Small opening detail (jewelry feature) */}
            <View style={styles.jumpRingOpening} />
          </View>

          {/* Golden heart charm hanging at the end of the rope */}
          <View style={styles.ropeCharm}>
            {/* Small loop connecting heart to rope */}
            <View style={styles.charmLoop} />
            {/* Golden heart charm */}
            <View style={styles.heartCharm}>
              <Text style={styles.heartEmoji}>💛</Text>
            </View>
          </View>
        </View>

        {timelineItems.map((item) => {
          switch (item.type) {
            case "moment":
              return renderMomentCard(item);
            case "date":
              return renderDateCard(item);
            case "milestone":
              return renderMilestoneCard(item);
            default:
              return null;
          }
        })}

        {/* Loading more indicator */}
        {loadingMore && (
          <View style={styles.loadingMoreContainer}>
            <Text style={styles.loadingMoreText}>Loading more memories...</Text>
          </View>
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeDetailModal}
      >
        {selectedItem && (
          <>
            {selectedItem.type === "moment" && selectedItem.moment && (
              <MomentDetailView
                moment={selectedItem.moment}
                onClose={closeDetailModal}
                onEdit={() => {}}
                allowEdit={false}
              />
            )}
            {selectedItem.type === "date" && selectedItem.dateEntry && (
              <DateDetailView
                dateEntry={selectedItem.dateEntry}
                onClose={closeDetailModal}
                onEdit={() => {}}
                allowEdit={false}
              />
            )}
            {selectedItem.type === "milestone" && selectedItem.milestone && (
              <MilestoneDetailView
                milestone={selectedItem.milestone}
                onClose={closeDetailModal}
                onEdit={() => {}}
                allowEdit={false}
              />
            )}
          </>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5E6D3", // Warmer beige/cream tone
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5E6D3", // Warmer beige/cream tone
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5E6D3", // Warmer beige/cream tone
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 30, // Consistent gap (30px) for rope visibility
    paddingBottom: 40,
  },
  timelineLine: {
    position: "absolute",
    left: "50%", // Center of screen using percentage
    marginLeft: -4, // Half of rope width (8px / 2)
    top: -30, // Extend upward to match top gap (30px)
    bottom: 40, // Leave space before jump ring (40px gap)
    width: 8, // Thicker rope
    zIndex: 0, // Behind cards - visible between cards, hidden inside cards
  },
  timelineLineDecoration: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 8,
    // Golden rope base color
    backgroundColor: "#FFD700", // Base gold
    opacity: 0.95,
    ...Platform.select({
      ios: {
        shadowColor: "#FFD700",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      web: {
        // Rope texture with gradient and shadows for 3D effect
        backgroundImage: `
          repeating-linear-gradient(
            45deg,
            #FFD700 0px,
            #FFD700 2px,
            #FFA500 2px,
            #FFA500 4px,
            #FFD700 4px,
            #FFD700 6px,
            #FFED4E 6px,
            #FFED4E 8px
          )
        `,
        boxShadow: `
          inset -1px 0 2px rgba(184, 134, 11, 0.7),
          inset 1px 0 2px rgba(255, 255, 255, 0.5),
          inset 0 -1px 2px rgba(184, 134, 11, 0.5),
          inset 0 1px 2px rgba(255, 255, 255, 0.4),
          0 0 6px rgba(255, 215, 0, 0.4),
          0 0 12px rgba(255, 215, 0, 0.2)
        `,
      },
    }),
  },
  // Rope texture overlay for braided effect
  timelineRopeTexture: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 8,
    backgroundColor: "transparent",
    ...Platform.select({
      web: {
        // Braided rope pattern
        backgroundImage: `
          repeating-linear-gradient(
            0deg,
            transparent 0px,
            transparent 1px,
            rgba(184, 134, 11, 0.4) 1px,
            rgba(184, 134, 11, 0.4) 2px,
            transparent 2px,
            transparent 3px
          ),
          repeating-linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.1) 0px,
            rgba(255, 255, 255, 0.1) 1px,
            transparent 1px,
            transparent 2px
          )
        `,
        opacity: 0.6,
      },
      default: {
        opacity: 0.2,
        backgroundColor: "rgba(184, 134, 11, 0.3)",
      },
    }),
  },
  // Jump ring connecting rope to charm (jewelry-style connector)
  jumpRing: {
    position: "absolute",
    left: "50%",
    marginLeft: -6, // Center the 12px ring (12px / 2)
    bottom: -20, // Position between rope end and charm loop
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#FFD700",
    backgroundColor: "transparent",
    zIndex: 1, // Above rope, below charm
    ...Platform.select({
      web: {
        boxShadow: `
          0 0 2px rgba(255, 215, 0, 0.8),
          inset 0 0 4px rgba(184, 134, 11, 0.5),
          inset 1px 1px 2px rgba(255, 255, 255, 0.3)
        `,
      },
      ios: {
        shadowColor: "#FFD700",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  // Small opening in the jump ring (jewelry detail)
  jumpRingOpening: {
    position: "absolute",
    right: -1,
    top: 4,
    width: 2,
    height: 4,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 1,
  },
  // Golden heart charm hanging at the end of the rope
  ropeCharm: {
    position: "absolute",
    left: "50%",
    marginLeft: -16, // Center the charm (32px / 2)
    bottom: -50, // Position below the rope end
    width: 32,
    height: 50,
    zIndex: 2, // Above jump ring
    alignItems: "center",
  },
  // Small loop connecting heart to rope
  charmLoop: {
    position: "absolute",
    top: 0,
    left: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#FFD700",
    backgroundColor: "#FFA500",
    zIndex: 1,
    ...Platform.select({
      web: {
        boxShadow: "inset 0 0 3px rgba(184, 134, 11, 0.7)",
      },
    }),
  },
  // Golden heart charm
  heartCharm: {
    position: "absolute",
    top: 10,
    left: 0,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#FFD700",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.6,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        filter: "drop-shadow(0 2px 8px rgba(255, 215, 0, 0.6))",
      },
    }),
  },
  heartEmoji: {
    fontSize: 32,
    ...Platform.select({
      web: {
        textShadow: "0px 0px 6px rgba(255, 215, 0, 0.8)",
      } as any,
      default: {
        textShadowColor: "rgba(255, 215, 0, 0.8)",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6,
      },
    }),
  },
  loadingMoreContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingMoreText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
});
