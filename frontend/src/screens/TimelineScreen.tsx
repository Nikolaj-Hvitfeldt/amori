import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { View, Modal, StyleSheet, LayoutChangeEvent } from "react-native";
import { momentsService } from "../services/moments";
import { datesService } from "../services/dates";
import { milestonesService } from "../services/milestones";
import { Moment } from "../types/moments";
import { DateEntry } from "../types/dates";
import { Milestone } from "../types/milestones";
import MomentDetailView from "../components/MomentDetailView";
import DateDetailView from "../components/DateDetailView";
import MilestoneDetailView from "../components/MilestoneDetailView";
import { getCachedData, setCachedData } from "../utils/cache";
import {
  TIMELINE_BOTTOM_PADDING,
  SCROLL_LOAD_MORE_THRESHOLD,
  ITEMS_PER_TYPE,
} from "../constants/spacing";
import { useAutoRefresh } from "../hooks/useAutoRefresh";
import {
  DaysTogetherHero,
  EMPTY_COPY,
  EmptySlip,
  ErrorSlip,
  Header,
  ScreenColumn,
  Skeleton,
  Thread,
  ThreadItem,
  haptics,
  useNavLock,
  useReducedEffects,
} from "../ui";
import { color, gutter, space } from "../theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
/** After a failed load-more, ignore end-of-list triggers for this long (no tight retry loop). */
const LOAD_MORE_RETRY_PAUSE_MS = 10 * 1000;

const STORY_TITLE = "Our story";
const STORY_TAGLINE = "A little more of us, every day";

/** Same key shape the Thread uses for its items. */
const itemKey = (type: TimelineItemType, id: string) => `${type}-${id}`;

/** Maps a timeline item onto the shared thread item [1A, 4A]: cover photo only, type chip. */
function toThreadItem(item: TimelineItem): ThreadItem {
  const coverPhoto = item.photos && item.photos.length > 0 ? item.photos[0] : null;
  const threadItem: ThreadItem = {
    id: item.id,
    type: item.type,
    date: item.date,
    title: item.title,
    coverPhoto,
    body: item.description,
  };
  if (item.type === "date" && item.dateEntry?.mood) {
    threadItem.chip = { kind: "mood", value: item.dateEntry.mood };
  } else if (item.type === "milestone" && item.milestone?.milestone_type) {
    threadItem.chip = { kind: "milestone", value: item.milestone.milestone_type };
  }
  return threadItem;
}

interface TimelineScreenProps {
  isFocused?: boolean;
}

export default function TimelineScreen({ isFocused = true }: TimelineScreenProps) {
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const reduced = useReducedEffects();
  // The detail opens in a full-screen, status-bar-translucent Modal: keep its top bar below the notch.
  const insets = useSafeAreaInsets();
  const guard = useNavLock();

  // Track pagination state for each type
  const [momentsOffset, setMomentsOffset] = useState(0);
  const [datesOffset, setDatesOffset] = useState(0);
  const [milestonesOffset, setMilestonesOffset] = useState(0);
  const [momentsTotal, setMomentsTotal] = useState(0);
  const [datesTotal, setDatesTotal] = useState(0);
  const [milestonesTotal, setMilestonesTotal] = useState(0);

  // Days-together hero [3A] (allowed addition #1): every milestone, unpaginated, so the
  // earliest "met" is found even when it is not on the current page. A failure hides it.
  const [heroMilestones, setHeroMilestones] = useState<Milestone[]>([]);

  // Error vs empty [2A]: "failed" = nothing to show, "stale" = showing the last good copy.
  const [loadError, setLoadError] = useState<null | "failed" | "stale">(null);
  const lastGoodRef = useRef<{
    items: TimelineItem[];
    momentsOffset: number;
    datesOffset: number;
    milestonesOffset: number;
  } | null>(null);

  // Thread height, to turn the pixel load-more threshold into onEndReachedThreshold.
  const [listHeight, setListHeight] = useState(0);

  useEffect(() => {
    loadTimelineFromCacheOrAPI(true);
  }, []);

  // Auto-check for changes and refresh only if data has changed
  useAutoRefresh({
    onRefresh: () => loadTimeline(true, true), // Bypass cache for fresh data
    resourceType: "all", // Timeline shows all resource types
    isFocused,
  });

  // One unpaginated read, the same call the Wall makes. Never touches the thread's state.
  const loadHero = async (bypassCache: boolean) => {
    try {
      const result = await milestonesService.getAll(undefined, undefined, bypassCache);
      const all = result && Array.isArray(result.data) ? result.data : [];
      setHeroMilestones(all);
    } catch (error) {
      // Keep whatever hero we already had; a failed refresh must not hide a known count.
      console.warn("Error loading days-together milestones:", error);
    }
  };

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
          lastGoodRef.current = {
            items: cachedItems,
            momentsOffset: cachedState.momentsOffset,
            datesOffset: cachedState.datesOffset,
            milestonesOffset: cachedState.milestonesOffset,
          };
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
    // The hero's own read runs alongside; it never blocks or breaks the thread.
    if (reset) loadHero(skipCache);
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
        momentsService.getAllMoments(ITEMS_PER_TYPE, reset ? 0 : momentsOffset, skipCache),
        datesService.getAll(ITEMS_PER_TYPE, reset ? 0 : datesOffset, skipCache),
        milestonesService.getAll(ITEMS_PER_TYPE, reset ? 0 : milestonesOffset, skipCache),
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
      lastGoodRef.current = {
        items: allItems,
        momentsOffset: newMomentsOffset,
        datesOffset: newDatesOffset,
        milestonesOffset: newMilestonesOffset,
      };
      if (reset) setLoadError(null);

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
      if (reset) {
        // A failed load must never look like an empty story: restore the last good copy, or show the error state.
        const lastGood = lastGoodRef.current;
        if (lastGood && lastGood.items.length > 0) {
          setTimelineItems(lastGood.items);
          setMomentsOffset(lastGood.momentsOffset);
          setDatesOffset(lastGood.datesOffset);
          setMilestonesOffset(lastGood.milestonesOffset);
          setLoadError("stale");
        } else {
          setLoadError("failed");
        }
      } else {
        // A failed load-more must not retry by itself: onEndReached refires when the footer
        // disappears. The old ScrollView only retried on the next scroll.
        loadMoreFailedAtRef.current = Date.now();
      }
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

  // Was a ScrollView onScroll check: load more within SCROLL_LOAD_MORE_THRESHOLD px of the
  // bottom. The Thread's onEndReachedThreshold is in visible lengths, so convert the pixels.
  const loadMoreFailedAtRef = useRef(0);
  const handleEndReached = () => {
    if (Date.now() - loadMoreFailedAtRef.current < LOAD_MORE_RETRY_PAUSE_MS) return;
    if (hasMore && !loadingMore) {
      loadMore();
    }
  };
  const endReachedThreshold =
    listHeight > 0 ? SCROLL_LOAD_MORE_THRESHOLD / listHeight : 0.2;

  const retry = () => loadTimeline(true, true);

  const itemsByKey = useMemo(() => {
    const map = new Map<string, TimelineItem>();
    for (const item of timelineItems) map.set(itemKey(item.type, item.id), item);
    return map;
  }, [timelineItems]);

  const threadItems = useMemo(() => timelineItems.map(toThreadItem), [timelineItems]);

  const handleItemPress = useCallback(
    (threadItem: ThreadItem) => {
      const item = itemsByKey.get(itemKey(threadItem.type, threadItem.id));
      if (!item) return;
      haptics.navigate();
      setSelectedItem(item);
      setDetailModalVisible(true);
    },
    [itemsByKey]
  );
  // Double-tap lock on opening a detail view (allowed addition #3).
  const openItem = useMemo(() => guard(handleItemPress), [guard, handleItemPress]);

  const closeDetailModal = useCallback(() => {
    setDetailModalVisible(false);
    setTimeout(() => setSelectedItem(null), 300);
  }, []);

  const header = (
    <View style={styles.bleed}>
      <Header title={STORY_TITLE} tagline={STORY_TAGLINE} section="story" />
      <DaysTogetherHero milestones={heroMilestones} />
    </View>
  );

  const onListLayout = (e: LayoutChangeEvent) => setListHeight(e.nativeEvent.layout.height);

  let body: React.ReactNode;
  if (loading && timelineItems.length === 0) {
    body = (
      <View style={styles.column}>
        {header}
        <Skeleton count={4} />
      </View>
    );
  } else if (timelineItems.length === 0) {
    body = (
      <View style={styles.column}>
        {header}
        {loadError === "failed" ? (
          <ErrorSlip what="your story" onRetry={retry} style={styles.slip} />
        ) : (
          // Story has no add flow of its own, so the slip shows no Add button.
          <EmptySlip message={EMPTY_COPY.story.message} style={styles.slip} />
        )}
      </View>
    );
  } else {
    body = (
      <View style={styles.fill} onLayout={onListLayout}>
        <Thread
          items={threadItems}
          onPressItem={openItem}
          ListHeaderComponent={
            <View>
              {header}
              {loadError === "stale" ? (
                <ErrorSlip what="your story" onRetry={retry} showingSavedCopy style={styles.staleSlip} />
              ) : null}
            </View>
          }
          ListFooterComponent={loadingMore ? <Skeleton count={1} withPhotos={false} /> : null}
          onEndReached={handleEndReached}
          onEndReachedThreshold={endReachedThreshold}
          contentContainerStyle={styles.column}
          testID="story-thread"
        />
      </View>
    );
  }

  return (
    <ScreenColumn testID="story-screen">
      {body}

      {/* Detail view, read-only from Story. A plain timed slide, no spring [5C]. */}
      <Modal
        visible={detailModalVisible}
        onRequestClose={closeDetailModal}
        animationType={reduced ? "none" : "slide"}
        statusBarTranslucent
      >
        <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: color.surface }}>
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
        </View>
      </Modal>
    </ScreenColumn>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  column: {
    paddingHorizontal: gutter,
    paddingBottom: TIMELINE_BOTTOM_PADDING,
  },
  // Header and hero carry their own gutter; undo the column's.
  bleed: { marginHorizontal: -gutter },
  slip: { marginTop: space.xl },
  staleSlip: { marginBottom: space.xl },
});
