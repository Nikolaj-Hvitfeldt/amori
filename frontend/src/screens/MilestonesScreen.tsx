import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { View, ScrollView, Pressable, Platform, Alert, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import DateTimePicker from "@react-native-community/datetimepicker";
import { CalendarDays, ImagePlus, X } from "lucide-react-native";
import { Milestone, CreateMilestoneDto } from "../types/milestones";
import { milestonesService } from "../services/milestones";
import MilestoneDetailView from "../components/MilestoneDetailView";
import AnimatedModal from "../components/AnimatedModal";
import WebDatePicker from "../components/WebDatePicker";
import { filterValidPhotos } from "../utils/imageUtils";
import { ITEMS_PER_PAGE } from "../constants/spacing";
import { useAutoRefresh } from "../hooks/useAutoRefresh";
import { formatDateForDb, useMilestoneForm } from "../hooks/useMilestoneForm";
import {
  AddButton,
  Button,
  ConfirmDialog,
  EMPTY_COPY,
  EmptySlip,
  ErrorSlip,
  FormSheet,
  Header,
  Input,
  MILESTONE_TYPES,
  MilestoneTypeTag,
  PhotoImage,
  SaveState,
  ScreenBackground,
  Skeleton,
  Text,
  Thread,
  ThreadItem,
  formatLongDate,
  haptics,
  ICON_STROKE,
  iconSize,
  useNavLock,
} from "../ui";
import { color, field, gutter, hitTarget, motion, radius, space } from "../theme";

interface MilestonesScreenProps {
  isFocused?: boolean;
}

/** Inline message above the fields when a save fails [2A]. */
const SAVE_ERROR = "Couldn't save this milestone. Check your connection and try again.";
/** Form thumbnail edge. */
const THUMB = space.xxxl * 2;

export default function MilestonesScreen({ isFocused = true }: MilestonesScreenProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // Form state lives in useMilestoneForm (no behaviour change).
  const form = useMilestoneForm();
  const {
    editingMilestone,
    milestoneType,
    title,
    setTitle,
    date,
    datePickerValue,
    setDatePickerValue,
    showDatePicker,
    setShowDatePicker,
    description,
    setDescription,
    photos,
    setPhotos,
    resetForm,
  } = form;

  // Save double-tap guard: the ref blocks re-entry synchronously, the state drives the button.
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
  const [saveSucceeded, setSaveSucceeded] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  // Error vs empty [2A]: "failed" = nothing to show, "stale" = showing the last good copy.
  const [loadError, setLoadError] = useState<null | "failed" | "stale">(null);
  const lastGoodMilestonesRef = useRef<Milestone[]>([]);
  const navGuard = useNavLock();

  useEffect(() => {
    loadMilestones();
  }, []);

  // Auto-check for changes and refresh only if data has changed
  useAutoRefresh({
    onRefresh: () => loadMilestones(true, false, true), // Bypass cache for fresh data
    resourceType: "milestones",
    isFocused,
  });

  const loadMilestones = async (reset: boolean = true, skipCleanup: boolean = false, bypassCache: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
        setMilestones([]);
        // Reset failed images state on reload
        setFailedImages(new Set());
      } else {
        setLoadingMore(true);
      }

      const offset = reset ? 0 : milestones.length;
      const result = await milestonesService.getAll(ITEMS_PER_PAGE, offset, bypassCache);

      // Safety check: ensure result and result.data exist
      if (!result || !result.data || !Array.isArray(result.data)) {
        console.error("Invalid API response:", result);
        throw new Error("Invalid response from server");
      }

      const fetchedMilestones = result.data;
      // Filter out invalid photos from all milestones and clean up database
      const cleanedMilestones = fetchedMilestones.map((milestone) => {
        const originalPhotos = milestone.photos || [];
        const validPhotos = filterValidPhotos(originalPhotos);

        // Only run cleanup if we're not skipping it and we actually found invalid photos
        if (
          !skipCleanup &&
          milestone.id &&
          validPhotos.length !== originalPhotos.length
        ) {
          // Check if there are actually invalid URLs (not just empty array)
          const hasInvalidUrls = originalPhotos.some(
            (url) =>
              !url ||
              typeof url !== "string" ||
              url.trim() === "" ||
              (!url.startsWith("http://") && !url.startsWith("https://"))
          );

          // Only update if we found actual invalid URLs
          if (hasInvalidUrls) {
            // Silently clean up invalid photos in the background
            milestonesService
              .update(milestone.id, {
                // Explicitly pass empty array to clear photos, not undefined
                photos: validPhotos.length > 0 ? validPhotos : [],
              })
              .catch((err) => {
                console.warn("Failed to clean up invalid photos:", err);
              });
          }
        }
        return {
          ...milestone,
          photos: validPhotos,
        };
      });

      const sortedMilestones = cleanedMilestones.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      if (reset) {
        setMilestones(sortedMilestones);
        lastGoodMilestonesRef.current = sortedMilestones;
        setHasMore(sortedMilestones.length < (result.total || 0));
        setLoadError(null);
      } else {
        setMilestones((prev) => {
          // Deduplicate by ID to prevent duplicate keys
          const existingIds = new Set(prev.map((m) => m.id));
          const uniqueNewMilestones = sortedMilestones.filter(
            (m) => m.id && !existingIds.has(m.id)
          );
          const newMilestones = [...prev, ...uniqueNewMilestones];
          lastGoodMilestonesRef.current = newMilestones;
          setHasMore(newMilestones.length < (result.total || 0));
          return newMilestones;
        });
      }

      setTotal(result.total || 0);
    } catch (error) {
      console.error("Error loading milestones:", error);
      if (reset) {
        // A failed load must never look like "no milestones": restore the last good copy, or show the error state.
        const lastGood = lastGoodMilestonesRef.current;
        setMilestones(lastGood);
        setLoadError(lastGood.length > 0 ? "stale" : "failed");
        if (lastGood.length === 0) setHasMore(false); // no pagination from an empty failed list
      } else {
        Alert.alert("Error", "Failed to load milestones");
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      loadMilestones(false, true); // Don't cleanup on pagination
    }
  };

  const handleViewMilestone = useCallback((milestone: Milestone) => {
    haptics.navigate();
    setSelectedMilestone(milestone);
    setIsDetailVisible(true);
  }, []);

  /** Returns true when the milestone was deleted. The confirmation is unchanged. */
  const handleDeleteMilestone = async (id: string, title?: string): Promise<boolean> => {
    const displayTitle = title || "this milestone";
    const confirmDelete = Platform.OS === "web"
      ? (globalThis as any).confirm(`Are you sure you want to delete "${displayTitle}"?`)
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            "Delete Milestone",
            `Are you sure you want to delete "${displayTitle}"?`,
            [
              { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
              { text: "Delete", style: "destructive", onPress: () => resolve(true) },
            ]
          );
        });

    if (confirmDelete) {
      try {
        await milestonesService.delete(id);
        haptics.warning();
        setIsModalVisible(false);
        loadMilestones();
        return true;
      } catch (error) {
        console.error("Error deleting milestone:", error);
        if (Platform.OS === "web") {
          (globalThis as any).alert("Failed to delete milestone");
        } else {
          Alert.alert("Error", "Failed to delete milestone");
        }
      }
    }
    return false;
  };

  const closeDetailView = () => {
    setIsDetailVisible(false);
    setTimeout(() => setSelectedMilestone(null), 300);
  };

  const handleEditFromDetail = () => {
    if (!selectedMilestone) return;
    const milestoneToEdit = selectedMilestone;
    setIsDetailVisible(false);
    setTimeout(() => openModal(milestoneToEdit), 250);
  };

  const handleDeleteFromDetail = async () => {
    if (!selectedMilestone?.id) return;
    const deleted = await handleDeleteMilestone(selectedMilestone.id, selectedMilestone.title);
    if (deleted) closeDetailView();
  };

  const openModal = (milestone?: Milestone) => {
    if (milestone) {
      setSelectedMilestone(milestone);
      form.loadMilestone(milestone);
    } else {
      resetForm();
    }
    setSaveError(null);
    setSaveSucceeded(false);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setConfirmDiscard(false);
    setTimeout(resetForm, 300);
  };

  /** ✕, backdrop, Android back and Esc: ask before throwing away unsaved edits [7A]. */
  const requestCloseModal = () => {
    if (form.isDirty && !saveSucceeded) {
      haptics.warning();
      setConfirmDiscard(true);
    } else {
      closeModal();
    }
  };

  const handleSaveMilestone = async () => {
    if (isSavingRef.current) return;
    if (!date || !title) {
      Alert.alert("Missing Information", "Please fill in the date and title");
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    setSaveError(null);
    try {
      const validPhotos = filterValidPhotos(photos);

      const milestoneData: CreateMilestoneDto = {
        milestone_type: milestoneType,
        title: title.trim(),
        date,
        description: description.trim() || undefined,
        // Explicitly pass empty array to clear photos, not undefined
        photos: validPhotos.length > 0 ? validPhotos : [],
      };

      if (editingMilestone) {
        await milestonesService.update(editingMilestone.id, milestoneData);
      } else {
        await milestonesService.create(milestoneData);
      }

      // Saved for motion.savedHold, then the sheet closes [2A].
      setSaveSucceeded(true);
      haptics.success();
      await new Promise((resolve) => setTimeout(resolve, motion.savedHold));
      closeModal();
      // Skip cleanup when loading after save to prevent removing just-saved photos
      await loadMilestones(true);
    } catch (error) {
      console.error("Error saving milestone:", error);
      setSaveError(SAVE_ERROR);
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  const saveState: SaveState = saveSucceeded
    ? "saved"
    : isSaving
      ? "saving"
      : saveError
        ? "error"
        : "idle";

  const uploadImage = async (uri: string): Promise<string> => {
    try {
      let base64: string;
      let mimeType: string;

      if (Platform.OS === "web") {
        if (uri.startsWith("blob:") || uri.startsWith("data:")) {
          if (uri.startsWith("data:")) {
            const matches = uri.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
              mimeType = matches[1];
              base64 = matches[2];
            } else {
              throw new Error("Invalid data URL format");
            }
          } else {
            const response = await fetch(uri);
            const blob = await response.blob();
            mimeType = blob.type || "image/jpeg";
            base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const result = reader.result as string;
                const base64Data = result.split(",")[1];
                resolve(base64Data);
              };
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          }
        } else {
          const response = await fetch(uri);
          const blob = await response.blob();
          mimeType = blob.type || "image/jpeg";
          base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              const base64Data = result.split(",")[1];
              resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }
      } else {
        base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const extension = uri.split(".").pop()?.toLowerCase() || "jpg";
        const mimeTypes: Record<string, string> = {
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          gif: "image/gif",
          webp: "image/webp",
        };
        mimeType = mimeTypes[extension] || "image/jpeg";
      }

      const base64data = `data:${mimeType};base64,${base64}`;

      return await milestonesService.uploadImage(base64data);
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  const pickImage = async () => {
    try {
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Required",
            "Please grant permission to access your photos."
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setLoading(true);
        try {
          const uploadPromises = result.assets.map((asset) =>
            uploadImage(asset.uri)
          );
          const uploadedUrls = await Promise.all(uploadPromises);
          setPhotos([...photos, ...uploadedUrls]);
        } catch (uploadError) {
          console.error("Error uploading images:", uploadError);
          Alert.alert(
            "Upload Error",
            `Failed to upload images: ${
              uploadError instanceof Error
                ? uploadError.message
                : "Unknown error"
            }`
          );
        } finally {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert(
        "Error",
        `Failed to pick image: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setLoading(false);
    }
  };

  // Thread items [1A]: cover photo above the text [4A], the type as a chip [5B].
  const { threadItems, byKey } = useMemo(() => {
    const map = new Map<string, Milestone>();
    const items: ThreadItem[] = milestones.map((m, index) => {
      const id = m.id || `milestone-${index}`;
      map.set(id, m);
      return {
        id,
        type: "milestone",
        date: m.date,
        title: m.title,
        coverPhoto: m.photos && m.photos.length > 0 ? m.photos[0] : null,
        chip: { kind: "milestone", value: m.milestone_type },
        body: m.description || undefined,
      };
    });
    return { threadItems: items, byKey: map };
  }, [milestones]);

  const onPressItem = useMemo(
    () =>
      navGuard((item: ThreadItem) => {
        const m = byKey.get(item.id);
        if (m) handleViewMilestone(m);
      }),
    [navGuard, byKey, handleViewMilestone]
  );

  const retry = () => loadMilestones(true, false, true);

  const renderEmpty = () =>
    loadError === "failed" ? (
      <ErrorSlip what="your milestones" onRetry={retry} />
    ) : (
      <EmptySlip
        message={EMPTY_COPY.milestones.message}
        actionLabel={EMPTY_COPY.milestones.action}
        onAction={() => openModal()}
      />
    );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return <Skeleton count={1} withPhotos={false} style={styles.footer} />;
  };

  const showSkeleton = loading && milestones.length === 0;

  return (
    <ScreenBackground>
      <Header title="Milestones" section="milestones" />

      {showSkeleton ? (
        <View style={styles.listPad}>
          <Skeleton count={3} />
        </View>
      ) : (
        <Thread
          items={threadItems}
          onPressItem={onPressItem}
          ListEmptyComponent={renderEmpty}
          ListHeaderComponent={
            loadError === "stale" ? (
              <ErrorSlip what="your milestones" onRetry={retry} showingSavedCopy style={styles.staleSlip} />
            ) : null
          }
          ListFooterComponent={renderFooter}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.listPad}
          refreshing={showSkeleton}
          onRefresh={() => loadMilestones(true, false)}
        />
      )}

      <AddButton onPress={() => openModal()} accessibilityLabel={EMPTY_COPY.milestones.action} />

      <AnimatedModal visible={isDetailVisible} onClose={closeDetailView}>
        {selectedMilestone && (
          <MilestoneDetailView
            milestone={selectedMilestone}
            onClose={closeDetailView}
            onEdit={handleEditFromDetail}
            onDelete={handleDeleteFromDetail}
          />
        )}
      </AnimatedModal>

      {/* Create / edit form [7A]: required fields first, then Photos and Description. */}
      <FormSheet
        visible={isModalVisible}
        title={editingMilestone ? "Edit milestone" : "New milestone"}
        onRequestClose={requestCloseModal}
        onSave={handleSaveMilestone}
        saveState={saveState}
        error={saveError}
        testID="milestone-form"
      >
        <View>
          <Text variant="caption" tone="muted" uppercase style={styles.label}>
            Milestone type
          </Text>
          <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="Milestone type">
            {MILESTONE_TYPES.map((type) => (
              <MilestoneTypeTag
                key={type}
                type={type}
                role="radio"
                selected={milestoneType === type}
                onPress={() => form.selectType(type)}
              />
            ))}
          </View>
        </View>

        <Input
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="Enter milestone title..."
        />

        <View>
          <Text variant="caption" tone="muted" uppercase style={styles.label}>
            Date
          </Text>

          {/* Web: inline date input */}
          {Platform.OS === "web" && (
            <WebDatePicker
              value={datePickerValue}
              onChange={form.setPickedDate}
              maxDate={new Date()}
              accentColor={color.accent}
              backgroundColor={color.surfaceRaised}
              textColor={color.text}
            />
          )}

          {/* Native: a field that opens the picker */}
          {Platform.OS !== "web" && (
            <Pressable
              onPress={() => setShowDatePicker(!showDatePicker)}
              accessibilityRole="button"
              accessibilityLabel={date ? `Date, ${formatLongDate(date)}` : "Select a date"}
              style={styles.dateField}
            >
              <Text variant="body" tone={date ? "text" : "muted"}>
                {date ? formatLongDate(date) : "Select a date"}
              </Text>
              <CalendarDays size={iconSize.md} color={color.textMuted} strokeWidth={ICON_STROKE} />
            </Pressable>
          )}

          {showDatePicker && Platform.OS === "ios" && (
            <View style={styles.iosPicker}>
              <View style={styles.iosPickerBar}>
                <Text variant="heading">Select date</Text>
                <Button
                  variant="primary"
                  label="Done"
                  onPress={() => {
                    form.setDate(formatDateForDb(datePickerValue));
                    setShowDatePicker(false);
                  }}
                />
              </View>
              <DateTimePicker
                value={datePickerValue}
                mode="date"
                display="spinner"
                onChange={form.handleDateChange}
                maximumDate={new Date()}
                themeVariant="dark"
              />
            </View>
          )}
        </View>

        <View>
          <View style={styles.photosBar}>
            <Text variant="caption" tone="muted" uppercase>
              {`Photos (${photos.length})`}
            </Text>
            <Button
              variant="secondary"
              label="Add photo"
              icon={<ImagePlus size={iconSize.md} color={color.text} strokeWidth={ICON_STROKE} />}
              onPress={pickImage}
            />
          </View>
          {photos.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.thumb}>
                  <PhotoImage source={photo} tint={false} style={StyleSheet.absoluteFill} />
                  <Button
                    variant="icon"
                    accessibilityLabel={`Remove photo ${index + 1}`}
                    icon={<X size={iconSize.md} color={color.text} strokeWidth={ICON_STROKE} />}
                    onPress={() => form.removePhoto(index)}
                    style={styles.removePhoto}
                  />
                </View>
              ))}
            </ScrollView>
          ) : null}
        </View>

        <Input
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe this milestone..."
          multiline
        />
      </FormSheet>

      <ConfirmDialog
        visible={confirmDiscard}
        title="Discard this milestone?"
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={closeModal}
      />

      {/* Android Date Picker */}
      {showDatePicker && Platform.OS === "android" && (
        <DateTimePicker
          value={datePickerValue}
          mode="date"
          display="default"
          onChange={form.handleDateChange}
          maximumDate={new Date()}
        />
      )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  listPad: {
    paddingHorizontal: gutter,
    // Clear the "+" button.
    paddingBottom: space.xxxl * 2,
  },
  staleSlip: { marginBottom: space.xl },
  footer: { paddingBottom: space.xl },
  label: { marginBottom: space.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  dateField: {
    minHeight: field.height,
    backgroundColor: color.surfaceRaised,
    borderRadius: radius.field,
    paddingHorizontal: space.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iosPicker: {
    marginTop: space.lg,
    padding: space.lg,
    backgroundColor: color.surfaceRaised,
    borderRadius: radius.field,
  },
  iosPickerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: space.lg,
  },
  photosBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: space.md,
  },
  thumbs: { gap: space.md },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: radius.print,
    overflow: "hidden",
  },
  removePhoto: {
    position: "absolute",
    top: 0,
    right: 0,
    width: hitTarget,
    height: hitTarget,
    backgroundColor: color.scrim,
  },
});
