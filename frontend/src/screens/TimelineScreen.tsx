import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Modal,
  ActivityIndicator,
  StyleSheet,
  Platform,
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
import TimelineMomentCard from "../components/timeline/TimelineMomentCard";
import TimelineDateCard from "../components/timeline/TimelineDateCard";
import TimelineMilestoneCard from "../components/timeline/TimelineMilestoneCard";
import TimelineRope from "../components/timeline/TimelineRope";
import { getCachedData, setCachedData, invalidateCache } from "../utils/cache";
import { TIMELINE_BG, TEXT_SECONDARY, TEXT_PRIMARY } from "../constants/theme";
import {
  TIMELINE_TOP_PADDING,
  TIMELINE_BOTTOM_PADDING,
  SCROLL_LOAD_MORE_THRESHOLD,
  ITEMS_PER_TYPE,
} from "../constants/spacing";

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
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - SCROLL_LOAD_MORE_THRESHOLD;

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
    return (
      <TimelineMomentCard
        key={item.id}
        moment={item.moment}
        onPress={() => handleItemPress(item)}
      />
    );
  };

  const renderDateCard = (item: TimelineItem) => {
    if (!item.dateEntry) return null;
    return (
      <TimelineDateCard
        key={item.id}
        dateEntry={item.dateEntry}
        onPress={() => handleItemPress(item)}
      />
    );
  };

  const renderMilestoneCard = (item: TimelineItem) => {
    if (!item.milestone) return null;
    return (
      <TimelineMilestoneCard
        key={item.id}
        milestone={item.milestone}
        onPress={() => handleItemPress(item)}
      />
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
        <TimelineRope />

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
    backgroundColor: TIMELINE_BG,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: TIMELINE_BG,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: TEXT_SECONDARY,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: TIMELINE_BG,
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: TEXT_PRIMARY,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: TEXT_SECONDARY,
    textAlign: "center",
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: TIMELINE_TOP_PADDING,
    paddingBottom: TIMELINE_BOTTOM_PADDING,
  },
  loadingMoreContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingMoreText: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    fontStyle: "italic",
  },
});
