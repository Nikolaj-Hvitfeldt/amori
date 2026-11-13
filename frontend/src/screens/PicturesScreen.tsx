import React, { useState, useEffect, useCallback, useRef } from "react";
import { FlatList, Modal, StyleSheet, View } from "react-native";
import { momentsService } from "../services/moments";
import { datesService } from "../services/dates";
import { milestonesService } from "../services/milestones";
import { Moment } from "../types/moments";
import { DateEntry } from "../types/dates";
import { Milestone } from "../types/milestones";
import MomentDetailView from "../components/MomentDetailView";
import DateDetailView from "../components/DateDetailView";
import MilestoneDetailView from "../components/MilestoneDetailView";
import { useAutoRefresh } from "../hooks/useAutoRefresh";
import { color, gutter, motion, polaroid, radius, space } from "../theme";
import {
  EMPTY_COPY,
  ErrorSlip,
  Header,
  Polaroid,
  ScreenColumn,
  Text,
  haptics,
  paperLift,
  polaroidTilt,
  useNavLock,
  useWebFrame,
  withAlpha,
} from "../ui";
import { Lightbox } from "./wall/Lightbox";

type SourceType = "moment" | "date" | "milestone";

// Photo item with source info
interface PhotoItem {
  id: string;
  url: string;
  sourceType: SourceType;
  sourceId: string;
  sourceTitle: string;
  sourceDate: string;
}

/** Newest source date first; ties keep a stable order by id. */
function byNewest(a: PhotoItem, b: PhotoItem): number {
  const d = (b.sourceDate || "").localeCompare(a.sourceDate || "");
  return d !== 0 ? d : a.id.localeCompare(b.id);
}

/** Grey polaroid frames while the wall loads [2A]. */
const SKELETON_COUNT = 6;
/** The blank square inside the empty polaroid: a faint ink wash on paper. */
const EMPTY_PHOTO_WASH = 0.12;

interface PicturesScreenProps {
  isFocused?: boolean;
}

export default function PicturesScreen({ isFocused = true }: PicturesScreenProps) {
  const { wallColumns } = useWebFrame();
  const cellWidth = { width: `${100 / wallColumns}%` as const };
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailData, setDetailData] = useState<{
    type: SourceType;
    data: Moment | DateEntry | Milestone;
  } | null>(null);

  // Store fetched data for detail views
  const [momentsData, setMomentsData] = useState<Moment[]>([]);
  const [datesData, setDatesData] = useState<DateEntry[]>([]);
  const [milestonesData, setMilestonesData] = useState<Milestone[]>([]);

  // Error vs empty [2A]: "failed" = nothing to show, "stale" = still showing the last good copy.
  // A failed load leaves the previous photos in place; the ref says whether there are any.
  const [loadError, setLoadError] = useState<null | "failed" | "stale">(null);
  const lastGoodPhotoCountRef = useRef(0);

  // Separate locks: opening the lightbox must not swallow a quick "Open …" tap.
  const guardLightbox = useNavLock();
  const guardDetail = useNavLock();

  const loadAllPhotos = useCallback(async (bypassCache: boolean = false) => {
    setLoading(true);
    try {
      const [momentsResult, datesResult, milestonesResult] = await Promise.all([
        momentsService.getAllMoments(undefined, undefined, bypassCache),
        datesService.getAll(undefined, undefined, bypassCache),
        milestonesService.getAll(undefined, undefined, bypassCache),
      ]);

      const moments = momentsResult.data || [];
      const dates = datesResult.data || [];
      const milestones = milestonesResult.data || [];

      setMomentsData(moments);
      setDatesData(dates);
      setMilestonesData(milestones);

      const allPhotos: PhotoItem[] = [];
      const collect = (
        sourceType: SourceType,
        sourceId: string | undefined,
        urls: string[] | undefined,
        sourceTitle: string,
        sourceDate: string
      ) => {
        if (!sourceId) return;
        (urls || []).forEach((url, index) => {
          if (url && typeof url === "string" && url.startsWith("http")) {
            allPhotos.push({
              id: `${sourceType}-${sourceId}-${index}`,
              url,
              sourceType,
              sourceId,
              sourceTitle,
              sourceDate,
            });
          }
        });
      };

      moments.forEach((m) => collect("moment", m.id, m.photos, m.title, m.story_date));
      dates.forEach((d) => collect("date", d.id, d.photos, d.title || d.location || "Date", d.date));
      milestones.forEach((m) => collect("milestone", m.id, m.photos, m.title, m.date));

      // Stable layout: newest first (no shuffle; tilt is seeded per photo by the Polaroid).
      allPhotos.sort(byNewest);
      setPhotos(allPhotos);
      lastGoodPhotoCountRef.current = allPhotos.length;
      setLoadError(null);
    } catch (error) {
      console.error("Error loading photos:", error);
      setLoadError(lastGoodPhotoCountRef.current > 0 ? "stale" : "failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllPhotos();
  }, [loadAllPhotos]);

  // Auto-check for changes and refresh only if data has changed
  useAutoRefresh({
    onRefresh: () => loadAllPhotos(true), // Bypass cache for fresh data
    resourceType: "all", // The Wall shows all resource types
    isFocused,
  });

  const handlePhotoPress = guardLightbox((photo: PhotoItem) => {
    haptics.select();
    setSelectedPhoto(photo);
  });

  const handleViewEntry = guardDetail(() => {
    if (!selectedPhoto) return;

    let data: Moment | DateEntry | Milestone | undefined;

    if (selectedPhoto.sourceType === "moment") {
      data = momentsData.find((m) => m.id === selectedPhoto.sourceId);
    } else if (selectedPhoto.sourceType === "date") {
      data = datesData.find((d) => d.id === selectedPhoto.sourceId);
    } else if (selectedPhoto.sourceType === "milestone") {
      data = milestonesData.find((m) => m.id === selectedPhoto.sourceId);
    }

    if (data) {
      haptics.navigate();
      setDetailData({ type: selectedPhoto.sourceType, data });
      setSelectedPhoto(null);
      // Present the detail only after the lightbox Modal has dismissed: iOS can drop a
      // Modal presented while another is still closing.
      setTimeout(() => setShowDetailModal(true), motion.sheetClose);
    }
  });

  const closeDetail = () => setShowDetailModal(false);
  const retry = () => loadAllPhotos(true);

  const header = (
    <View>
      <Header title="Memory wall" section="wall" />
      {photos.length > 0 ? (
        <Text
          variant="title"
          tone="accent"
          style={styles.count}
          accessibilityLabel={`${photos.length} ${photos.length === 1 ? "photo" : "photos"}`}
        >
          {`✦ ${photos.length} ${photos.length === 1 ? "photo" : "photos"} ✦`}
        </Text>
      ) : null}
    </View>
  );

  let body: React.ReactNode;
  if (loading) {
    body = (
      <View>
        {header}
        <View
          style={styles.grid}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel="Loading"
          accessibilityState={{ busy: true }}
          testID="wall-skeleton"
        >
          {Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <View key={i} style={[styles.cell, cellWidth]}>
              <View
                style={[styles.skeletonFrame, { transform: [{ rotate: `${polaroidTilt(`skeleton-${i}`)}deg` }] }]}
              >
                <View style={styles.skeletonPhoto} />
                <View style={styles.captionBox} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  } else if (photos.length === 0 && loadError === "failed") {
    body = (
      <View>
        {header}
        <ErrorSlip what="your memory wall" onRetry={retry} style={styles.slip} />
      </View>
    );
  } else if (photos.length === 0) {
    body = (
      <View>
        {header}
        <View
          style={[styles.emptyPolaroid, paperLift, { transform: [{ rotate: `${polaroidTilt("wall-empty")}deg` }] }]}
          testID="empty-slip"
        >
          <View style={styles.emptyPhoto} />
          <Text variant="body" tone="ink" style={styles.emptyText}>
            {EMPTY_COPY.wall.message}
          </Text>
          <View pointerEvents="none" style={styles.tape} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
        </View>
      </View>
    );
  } else {
    body = (
      <FlatList
        data={photos}
        keyExtractor={(item) => item.id}
        key={`wall-${wallColumns}`}
        numColumns={wallColumns}
        ListHeaderComponent={
          <View>
            {header}
            {loadError === "stale" ? (
              <ErrorSlip what="your memory wall" onRetry={retry} showingSavedCopy style={styles.slip} />
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.cell, cellWidth]}>
            <Polaroid
              id={item.id}
              title={item.sourceTitle}
              date={item.sourceDate}
              photo={item.url}
              onPress={() => handlePhotoPress(item)}
            />
          </View>
        )}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        // Virtualization settings - only render visible items
        initialNumToRender={6}
        maxToRenderPerBatch={4}
        windowSize={5}
      />
    );
  }

  return (
    <ScreenColumn kind="wall">
      {body}

      <Lightbox
        photo={
          selectedPhoto
            ? {
                url: selectedPhoto.url,
                title: selectedPhoto.sourceTitle,
                date: selectedPhoto.sourceDate,
                type: selectedPhoto.sourceType,
              }
            : null
        }
        onClose={() => setSelectedPhoto(null)}
        onOpenEntry={handleViewEntry}
      />

      {/* Entry detail, read-only from the Wall */}
      <Modal visible={showDetailModal} animationType="fade" transparent onRequestClose={closeDetail} statusBarTranslucent>
        <View style={styles.detail}>
          {detailData?.type === "moment" && (
            <MomentDetailView
              moment={detailData.data as Moment}
              onClose={closeDetail}
              onEdit={() => {}}
              allowEdit={false}
            />
          )}
          {detailData?.type === "date" && (
            <DateDetailView
              dateEntry={detailData.data as DateEntry}
              onClose={closeDetail}
              onEdit={() => {}}
              allowEdit={false}
            />
          )}
          {detailData?.type === "milestone" && (
            <MilestoneDetailView
              milestone={detailData.data as Milestone}
              onClose={closeDetail}
              onEdit={() => {}}
              allowEdit={false}
            />
          )}
        </View>
      </Modal>
    </ScreenColumn>
  );
}

/** Half of the row gap, as padding on each cell. */
const CELL_INSET = space.sm;

const styles = StyleSheet.create({
  count: { textAlign: "center", marginBottom: space.xl },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: gutter - CELL_INSET,
    paddingTop: space.sm,
  },
  row: { paddingHorizontal: gutter - CELL_INSET },
  listContent: { paddingBottom: space.xxl },
  cell: { paddingHorizontal: CELL_INSET, paddingTop: space.sm, paddingBottom: space.xl },
  skeletonFrame: {
    backgroundColor: color.outline,
    borderRadius: radius.print,
    paddingTop: polaroid.frame,
    paddingHorizontal: polaroid.frame,
  },
  skeletonPhoto: { width: "100%", aspectRatio: 1, backgroundColor: color.hairline },
  captionBox: { height: polaroid.caption },
  slip: { marginHorizontal: gutter, marginTop: space.sm, marginBottom: space.xl },
  emptyPolaroid: {
    alignSelf: "center",
    width: "60%",
    marginTop: space.xl,
    backgroundColor: color.paper,
    borderRadius: radius.print,
    padding: polaroid.frame,
    paddingBottom: space.lg,
  },
  emptyPhoto: { width: "100%", aspectRatio: 1, backgroundColor: withAlpha(color.inkMuted, EMPTY_PHOTO_WASH) },
  emptyText: { textAlign: "center", marginTop: space.md },
  tape: {
    position: "absolute",
    top: -polaroid.tape.height / 2,
    left: "50%",
    marginLeft: -polaroid.tape.width / 2,
    width: polaroid.tape.width,
    height: polaroid.tape.height,
    backgroundColor: color.tape,
  },
  detail: { flex: 1, backgroundColor: color.surface },
});
