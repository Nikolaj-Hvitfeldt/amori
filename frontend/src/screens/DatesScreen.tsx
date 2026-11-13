import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { CalendarDays, ImagePlus, Plus, X } from "lucide-react-native";
import { DateEntry } from "../types/dates";
import { datesService } from "../services/dates";
import DateDetailView from "../components/DateDetailView";
import WebDatePicker from "../components/WebDatePicker";
import { filterValidPhotos } from "../utils/imageUtils";
import { ITEMS_PER_PAGE } from "../constants/spacing";
import { useAutoRefresh } from "../hooks/useAutoRefresh";
import { MISSING_FIELDS_MESSAGE, useDateForm } from "../hooks/useDateForm";
import { color, field, gutter, hitTarget, motion, radius, space } from "../theme";
import {
  AddButton,
  Button,
  Collapsible,
  ConfirmDialog,
  EMPTY_COPY,
  EmptySlip,
  ErrorSlip,
  FormSheet,
  Header,
  ICON_STROKE,
  Input,
  MOODS,
  MoodTag,
  PhotoImage,
  SaveState,
  ScreenColumn,
  Sheet,
  Skeleton,
  Text,
  Thread,
  ThreadItem,
  formatLongDate,
  haptics,
  iconSize,
  useNavLock,
} from "../ui";

interface DatesScreenProps {
  isFocused?: boolean;
}

/** Shown above the fields when a save fails [2A]. */
const SAVE_ERROR_MESSAGE = "Couldn't save this date. Check your connection and try again.";
/** Matches the old close-then-reset delay so the sheet's close animation finishes first. */
const RESET_DELAY_MS = 300;
/** Form thumbnails: two field heights square. */
const THUMB = field.height * 2;

export default function DatesScreen({ isFocused = true }: DatesScreenProps) {
  const [dates, setDates] = useState<DateEntry[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<DateEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [, setTotal] = useState(0);

  const form = useDateForm();
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  // Save double-tap guard: the ref blocks re-entry synchronously, the state drives the button.
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
  // Error vs empty [2A]: "failed" = nothing to show, "stale" = showing the last good copy.
  const [loadError, setLoadError] = useState<null | "failed" | "stale">(null);
  const lastGoodDatesRef = useRef<DateEntry[]>([]);
  const guard = useNavLock();

  useEffect(() => {
    loadDates();
  }, []);

  // Auto-check for changes and refresh only if data has changed
  useAutoRefresh({
    onRefresh: () => loadDates(true, true), // Bypass cache for fresh data
    resourceType: "dates",
    isFocused,
  });

  const loadDates = async (reset: boolean = true, bypassCache: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
        setDates([]);
      } else {
        setLoadingMore(true);
      }

      const offset = reset ? 0 : dates.length;
      const result = await datesService.getAll(ITEMS_PER_PAGE, offset, bypassCache);

      // Safety check: ensure result and result.data exist
      if (!result || !result.data || !Array.isArray(result.data)) {
        console.error("Invalid API response:", result);
        throw new Error("Invalid response from server");
      }

      const fetchedDates = result.data;
      // Filter out invalid photos from all dates and clean up database
      const cleanedDates = fetchedDates.map((dateEntry) => {
        const allPhotos =
          dateEntry.photos && dateEntry.photos.length > 0
            ? dateEntry.photos
            : dateEntry.image_url
            ? [dateEntry.image_url]
            : [];
        const validPhotos = filterValidPhotos(allPhotos);
        // If photos were filtered out, update the database
        if (dateEntry.id && validPhotos.length !== allPhotos.length) {
          // Silently clean up invalid photos in the background
          datesService
            .update(dateEntry.id, {
              photos: validPhotos.length > 0 ? validPhotos : [],
            })
            .catch((err) => {
              console.warn("Failed to clean up invalid photos:", err);
            });
        }
        return {
          ...dateEntry,
          photos: validPhotos,
        };
      });

      const sortedDates = cleanedDates.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      if (reset) {
        setDates(sortedDates);
        lastGoodDatesRef.current = sortedDates;
        setHasMore(sortedDates.length < (result.total || 0));
        setLoadError(null);
      } else {
        setDates((prev) => {
          // Deduplicate by ID to prevent duplicate keys
          const existingIds = new Set(prev.map((d) => d.id));
          const uniqueNewDates = sortedDates.filter((d) => d.id && !existingIds.has(d.id));
          const newDates = [...prev, ...uniqueNewDates];
          lastGoodDatesRef.current = newDates;
          setHasMore(newDates.length < (result.total || 0));
          return newDates;
        });
      }

      setTotal(result.total || 0);
    } catch (error) {
      console.error("Error loading dates:", error);
      if (reset) {
        // A failed load must never look like "no dates": restore the last good copy, or show the error state.
        const lastGood = lastGoodDatesRef.current;
        setDates(lastGood);
        setLoadError(lastGood.length > 0 ? "stale" : "failed");
        if (lastGood.length === 0) setHasMore(false); // no pagination from an empty failed list
      } else {
        Alert.alert("Error", "Failed to load dates");
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      loadDates(false);
    }
  };

  const datesById = useMemo(() => new Map(dates.map((d) => [d.id, d])), [dates]);

  const threadItems = useMemo<ThreadItem[]>(
    () =>
      dates.map((d, index) => ({
        id: d.id || `date-${index}`,
        type: "date",
        date: d.date,
        title: d.title || "Our Special Date",
        coverPhoto: d.photos && d.photos.length > 0 ? d.photos[0] : null,
        chip: { kind: "mood", value: d.mood },
        body: d.location || undefined,
      })),
    [dates]
  );

  const handleViewDate = useCallback(
    guard((item: ThreadItem) => {
      const dateEntry = datesById.get(item.id);
      if (!dateEntry) return;
      haptics.navigate();
      setSelectedDate(dateEntry);
      setIsDetailVisible(true);
    }),
    [guard, datesById]
  );

  const handleDeleteDate = async (id: string, title?: string) => {
    const displayTitle = title || "this date";
    const confirmDelete =
      Platform.OS === "web"
        ? (globalThis as any).confirm(`Are you sure you want to delete "${displayTitle}"?`)
        : await new Promise<boolean>((resolve) => {
            Alert.alert("Delete Date", `Are you sure you want to delete "${displayTitle}"?`, [
              { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
              { text: "Delete", style: "destructive", onPress: () => resolve(true) },
            ]);
          });

    if (confirmDelete) {
      haptics.warning();
      try {
        await datesService.delete(id);
        setIsDetailVisible(false);
        setIsModalVisible(false);
        loadDates();
      } catch (error) {
        console.error("Error deleting date:", error);
        if (Platform.OS === "web") {
          (globalThis as any).alert("Failed to delete date entry");
        } else {
          Alert.alert("Error", "Failed to delete date entry");
        }
      }
    }
  };

  const openModal = (dateEntry?: DateEntry) => {
    if (dateEntry) {
      form.loadEntry(dateEntry);
    } else {
      form.resetForm();
    }
    setSaveState("idle");
    setFormError(null);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setConfirmDiscard(false);
    setTimeout(() => {
      form.resetForm();
      setSaveState("idle");
      setFormError(null);
    }, RESET_DELAY_MS);
  };

  /**
   * ✕, backdrop, Android back, Esc: ignored while a save is in flight (the sheet
   * closes itself once it lands); otherwise ask first when there are unsaved edits [7A].
   */
  const requestCloseModal = () => {
    if (isSavingRef.current) return;
    if (form.isDirty && saveState !== "saved") {
      setConfirmDiscard(true);
    } else {
      closeModal();
    }
  };

  const handleSaveDate = async () => {
    if (isSavingRef.current) return;
    if (!form.isValid) {
      setFormError(MISSING_FIELDS_MESSAGE);
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    setFormError(null);
    setSaveState("saving");
    try {
      const dateData = form.toDto();
      if (form.editingDate) {
        await datesService.update(form.editingDate.id, dateData);
      } else {
        await datesService.create(dateData);
      }
    } catch (error) {
      console.error("Error saving date:", error);
      setSaveState("error");
      setFormError(SAVE_ERROR_MESSAGE);
      isSavingRef.current = false;
      setIsSaving(false);
      return;
    }

    try {
      setSaveState("saved");
      haptics.success();
      await new Promise((resolve) => setTimeout(resolve, motion.savedHold));
      closeModal();
      await loadDates();
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  const renderEmpty = () =>
    loadError === "failed" ? (
      <ErrorSlip what="your dates" onRetry={() => loadDates(true, true)} />
    ) : (
      <EmptySlip
        message={EMPTY_COPY.dates.message}
        actionLabel={EMPTY_COPY.dates.action}
        onAction={() => openModal()}
      />
    );

  const listHeader = (
    <View>
      <Header title="Dates" section="dates" style={styles.header} />
      {loadError === "stale" ? (
        <ErrorSlip what="your dates" onRetry={() => loadDates(true, true)} showingSavedCopy style={styles.stale} />
      ) : null}
    </View>
  );

  const showSkeleton = loading && dates.length === 0;

  return (
    <ScreenColumn>
      {showSkeleton ? (
        <View style={styles.column}>
          <Header title="Dates" section="dates" style={styles.header} />
          <Skeleton count={3} />
        </View>
      ) : (
        <Thread
          items={threadItems}
          onPressItem={handleViewDate}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={loadingMore ? <Skeleton count={1} withPhotos={false} /> : null}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshing={showSkeleton}
          onRefresh={() => loadDates(true)}
          contentContainerStyle={styles.column}
        />
      )}

      <AddButton accessibilityLabel="Add a date" onPress={() => openModal()} />

      <FormSheet
        visible={isModalVisible}
        title={form.editingDate ? "Edit date" : "New date"}
        saveState={saveState}
        error={formError}
        onSave={handleSaveDate}
        onRequestClose={requestCloseModal}
      >
        <Input
          label="Title"
          value={form.title}
          onChangeText={form.setTitle}
          placeholder="Give this date a memorable title"
        />

        {/* Date (required) */}
        <View>
          <Text variant="caption" tone="muted" uppercase style={styles.label}>
            Date
          </Text>
          {Platform.OS === "web" ? (
            <WebDatePicker
              value={form.datePickerValue}
              onChange={form.pickDate}
              maxDate={new Date()}
              accentColor={color.accent}
              backgroundColor={color.surfaceRaised}
              textColor={color.text}
            />
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Date, ${form.date ? formatLongDate(form.date) : "not set"}`}
              onPress={() => form.setShowDatePicker(!form.showDatePicker)}
              style={styles.dateField}
            >
              <Text variant="body" tone={form.date ? "text" : "muted"}>
                {form.date ? formatLongDate(form.date) : "Select a date"}
              </Text>
              <CalendarDays size={iconSize.md} color={color.textMuted} strokeWidth={ICON_STROKE} />
            </Pressable>
          )}
          {form.showDatePicker && Platform.OS === "ios" ? (
            <View style={styles.iosPicker}>
              <DateTimePicker
                value={form.datePickerValue}
                mode="date"
                display="spinner"
                onChange={form.handleDateChange}
                maximumDate={new Date()}
                textColor={color.text}
              />
              <Button
                variant="secondary"
                label="Done"
                onPress={() => {
                  form.pickDate(form.datePickerValue);
                  form.setShowDatePicker(false);
                }}
                style={styles.alignEnd}
              />
            </View>
          ) : null}
        </View>

        {/* Mood */}
        <View>
          <Text variant="caption" tone="muted" uppercase style={styles.label}>
            Mood
          </Text>
          <View style={styles.wrapRow} accessibilityRole="radiogroup">
            {MOODS.map((m) => (
              <MoodTag key={m} mood={m} selected={form.mood === m} role="radio" onPress={() => form.setMood(m)} />
            ))}
          </View>
        </View>

        {/* Photos */}
        <View>
          <Text variant="caption" tone="muted" uppercase style={styles.label}>
            {`Photos (${form.photos.length})`}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
            {form.photos.map((photo, index) => (
              <View key={`${photo}-${index}`} style={styles.thumbWrap}>
                <PhotoImage source={photo} style={styles.thumb} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove photo ${index + 1}`}
                  onPress={() => form.removePhoto(index)}
                  hitSlop={space.sm}
                  style={styles.removePhoto}
                >
                  <X size={iconSize.sm} color={color.text} strokeWidth={ICON_STROKE} />
                </Pressable>
              </View>
            ))}
            {Array.from({ length: form.uploadingCount }, (_, i) => (
              <View
                key={`uploading-${i}`}
                style={[styles.thumb, styles.uploading]}
                accessibilityRole="progressbar"
                accessibilityLabel="Uploading photo"
                accessibilityState={{ busy: true }}
              />
            ))}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add photos"
              onPress={form.pickImage}
              disabled={form.uploadingCount > 0}
              style={[styles.thumb, styles.addPhoto]}
            >
              <ImagePlus size={iconSize.lg} color={color.textMuted} strokeWidth={ICON_STROKE} />
              <Text variant="caption" tone="muted">
                Add photos
              </Text>
            </Pressable>
          </ScrollView>
        </View>

        <Input
          label="Description"
          value={form.description}
          onChangeText={form.setDescription}
          placeholder="Describe this special date"
          multiline
        />

        {/* Location is required by validation, so it stays outside "More details" (see report). */}
        <Input
          label="Location"
          value={form.location}
          onChangeText={form.setLocation}
          placeholder="Where did this date take place?"
        />

        <Collapsible summary="Highlights, weather, favourite moment">
          <View>
            <View style={styles.highlights}>
              {form.highlights.map((highlight, index) => (
                <View key={index} style={styles.highlightRow}>
                  <Input
                    label={`Highlight ${index + 1}`}
                    value={highlight}
                    onChangeText={(value) => form.updateHighlight(index, value)}
                    containerStyle={styles.flex}
                  />
                  {form.highlights.length > 1 ? (
                    <Button
                      variant="icon"
                      accessibilityLabel={`Remove highlight ${index + 1}`}
                      icon={<X size={iconSize.md} color={color.textMuted} strokeWidth={ICON_STROKE} />}
                      onPress={() => form.removeHighlight(index)}
                      style={styles.removeHighlight}
                    />
                  ) : null}
                </View>
              ))}
              <Button
                variant="text"
                label="Add highlight"
                icon={<Plus size={iconSize.sm} color={color.text} strokeWidth={ICON_STROKE} />}
                onPress={form.addHighlight}
              />
            </View>
          </View>
          <Input
            label="Weather"
            value={form.weather}
            onChangeText={form.setWeather}
            placeholder="How was the weather that day?"
          />
          <Input
            label="Favourite moment"
            value={form.favoriteMoment}
            onChangeText={form.setFavoriteMoment}
            placeholder="What was your favourite moment?"
            multiline
          />
        </Collapsible>
      </FormSheet>

      <ConfirmDialog
        visible={confirmDiscard}
        title="Discard this date?"
        message="Your changes won't be saved."
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={() => {
          haptics.warning();
          closeModal();
        }}
      />

      {/* Detail view */}
      <Sheet
        visible={isDetailVisible}
        onRequestClose={() => setIsDetailVisible(false)}
        accessibilityLabel={selectedDate?.title || "Date"}
        size="tall"
      >
        {selectedDate ? (
          <DateDetailView
            dateEntry={selectedDate}
            onClose={() => setIsDetailVisible(false)}
            onEdit={() => {
              setIsDetailVisible(false);
              setTimeout(() => openModal(selectedDate), RESET_DELAY_MS);
            }}
            onDelete={() =>
              selectedDate.id && handleDeleteDate(selectedDate.id, selectedDate.title || selectedDate.location)
            }
          />
        ) : null}
      </Sheet>

      {/* Android Date Picker - Must be at root level for native dialog */}
      {form.showDatePicker && Platform.OS === "android" ? (
        <DateTimePicker
          value={form.datePickerValue}
          mode="date"
          display="default"
          onChange={form.handleDateChange}
          maximumDate={new Date()}
        />
      ) : null}
    </ScreenColumn>
  );
}

const styles = StyleSheet.create({
  column: { paddingHorizontal: gutter, paddingBottom: space.xxxl * 2 },
  header: { paddingHorizontal: 0 },
  stale: { marginBottom: space.xl },
  label: { marginBottom: space.sm },
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
    marginTop: space.md,
    padding: space.md,
    backgroundColor: color.surfaceRaised,
    borderRadius: radius.field,
  },
  alignEnd: { alignSelf: "flex-end" },
  wrapRow: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  photoRow: { gap: space.md, paddingTop: space.sm, paddingRight: space.sm },
  thumbWrap: { position: "relative" },
  thumb: { width: THUMB, height: THUMB, borderRadius: radius.print, overflow: "hidden" },
  removePhoto: {
    position: "absolute",
    top: space.xs,
    right: space.xs,
    width: hitTarget - space.md,
    height: hitTarget - space.md,
    borderRadius: radius.pill,
    backgroundColor: color.scrim,
    alignItems: "center",
    justifyContent: "center",
  },
  uploading: { backgroundColor: color.outline },
  addPhoto: {
    backgroundColor: color.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
    gap: space.xs,
  },
  highlights: { gap: space.md },
  highlightRow: { flexDirection: "row", alignItems: "flex-end", gap: space.xs },
  removeHighlight: { marginBottom: (field.height - hitTarget) / 2 },
  flex: { flex: 1 },
});
