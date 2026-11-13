import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { View, ScrollView, Alert, Platform, Pressable, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Calendar, ImagePlus, X } from "lucide-react-native";
import { momentsService } from "../services/moments";
import { Moment } from "../types/moments";
import MomentDetailView from "../components/MomentDetailView";
import WebDatePicker from "../components/WebDatePicker";
import { ITEMS_PER_PAGE } from "../constants/spacing";
import { useAutoRefresh } from "../hooks/useAutoRefresh";
import { filterValidPhotos, useMomentForm } from "../hooks/useMomentForm";
import { color, field, gutter, hitTarget, motion, radius, space } from "../theme";
import {
  AddButton,
  Button,
  ConfirmDialog,
  EMPTY_COPY,
  EmptySlip,
  ErrorSlip,
  FormSheet,
  Header,
  ICON_STROKE,
  Input,
  PhotoImage,
  SaveState,
  ScreenBackground,
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

interface MomentsScreenProps {
  isFocused?: boolean;
}

const SCREEN_TITLE = "Moments";
const SAVE_FAILED = "Couldn't save this moment. Check your connection and try again.";
const REQUIRED_MISSING = "Please fill in all required fields.";

export default function MomentsScreen({ isFocused = true }: MomentsScreenProps) {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [selectedMoment, setSelectedMoment] = useState<Moment | null>(null);

  // Form state lives in useMomentForm.
  const form = useMomentForm();
  const { resetForm, loadMoment } = form;
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  // Save double-tap guard: the ref blocks re-entry synchronously, the state drives the button.
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
  // Error vs empty [2A]: "failed" = nothing to show, "stale" = showing the last good copy.
  const [loadError, setLoadError] = useState<null | "failed" | "stale">(null);
  const lastGoodMomentsRef = useRef<Moment[]>([]);
  const guard = useNavLock();

  useEffect(() => {
    loadMoments();
  }, []);

  // Auto-check for changes and refresh only if data has changed
  useAutoRefresh({
    onRefresh: () => loadMoments(true, true), // Bypass cache for fresh data
    resourceType: "moments",
    isFocused,
  });

  const loadMoments = async (reset: boolean = true, bypassCache: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
        setMoments([]);
      } else {
        setLoadingMore(true);
      }

      const offset = reset ? 0 : moments.length;
      const result = await momentsService.getAllMoments(ITEMS_PER_PAGE, offset, bypassCache);

      // Safety check: ensure result and result.data exist
      if (!result || !result.data || !Array.isArray(result.data)) {
        console.error("Invalid API response:", result);
        throw new Error("Invalid response from server");
      }

      const sortedMoments = result.data.sort(
        (a, b) => new Date(b.story_date).getTime() - new Date(a.story_date).getTime()
      );

      if (reset) {
        setMoments(sortedMoments);
        lastGoodMomentsRef.current = sortedMoments;
        setHasMore(sortedMoments.length < (result.total || 0));
        setLoadError(null);
      } else {
        setMoments((prev) => {
          // Deduplicate by ID to prevent duplicate keys
          const existingIds = new Set(prev.map((m) => m.id));
          const uniqueNewMoments = sortedMoments.filter((m) => m.id && !existingIds.has(m.id));
          const newMoments = [...prev, ...uniqueNewMoments];
          lastGoodMomentsRef.current = newMoments;
          setHasMore(newMoments.length < (result.total || 0));
          return newMoments;
        });
      }

      setTotal(result.total || 0);
    } catch (error) {
      console.error("Error loading moments:", error);
      if (reset) {
        // A failed load must never look like "no moments": restore the last good copy, or show the error state.
        const lastGood = lastGoodMomentsRef.current;
        setMoments(lastGood);
        setLoadError(lastGood.length > 0 ? "stale" : "failed");
        if (lastGood.length === 0) setHasMore(false); // no pagination from an empty failed list
      } else {
        Alert.alert("Error", "Failed to load your moments");
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      loadMoments(false);
    }
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setConfirmDiscard(false);
    setTimeout(() => {
      resetForm();
      setSaveState("idle");
      setFormError(null);
    }, motion.sheetClose);
  };

  const handleSaveMoment = async () => {
    if (isSavingRef.current) return;
    if (!form.isValid) {
      setFormError(REQUIRED_MISSING);
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    setSaveState("saving");
    setFormError(null);
    try {
      const momentData = form.buildDto();

      if (form.editingMoment) {
        await momentsService.updateMoment(form.editingMoment.id!, momentData);
      } else {
        await momentsService.createMoment(momentData);
      }

      // Saved [2A]: hold the confirmation briefly, then close and reload.
      setSaveState("saved");
      haptics.success();
      await new Promise((resolve) => setTimeout(resolve, motion.savedHold));
      closeModal();
      await loadMoments();
    } catch (error) {
      console.error("Error saving moment:", error);
      setSaveState("error");
      setFormError(SAVE_FAILED);
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  const openModal = useCallback(
    (moment?: Moment) => {
      if (moment) {
        loadMoment(moment);
      } else {
        resetForm();
      }
      setSaveState("idle");
      setFormError(null);
      setIsModalVisible(true);
    },
    [loadMoment, resetForm]
  );

  /** ✕, backdrop, Android back, Esc: ask first when there are unsaved edits [7A]. */
  const requestCloseModal = () => {
    if (form.isDirty && saveState !== "saved" && !isSaving) {
      setConfirmDiscard(true);
    } else {
      closeModal();
    }
  };

  const handleViewMoment = useCallback((moment: Moment) => {
    haptics.navigate();
    setSelectedMoment(moment);
    setIsDetailVisible(true);
  }, []);

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
            return new Promise<string>(async (resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = async () => {
                try {
                  const dataUrl = reader.result as string;
                  const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                  if (matches && matches.length === 3) {
                    mimeType = matches[1];
                    base64 = matches[2];
                    const url = await uploadBase64();
                    resolve(url);
                  } else {
                    reject(new Error("Failed to convert blob to base64"));
                  }
                } catch (error) {
                  reject(error);
                }
              };
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          }
        } else {
          const response = await fetch(uri);
          const blob = await response.blob();
          return new Promise<string>(async (resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = async () => {
              try {
                const dataUrl = reader.result as string;
                const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                if (matches && matches.length === 3) {
                  mimeType = matches[1];
                  base64 = matches[2];
                  const url = await uploadBase64();
                  resolve(url);
                } else {
                  reject(new Error("Failed to convert to base64"));
                }
              } catch (error) {
                reject(error);
              }
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }
      } else {
        const base64Data = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        mimeType = "image/jpeg";
        base64 = base64Data;
      }

      async function uploadBase64() {
        return momentsService.uploadImage(`data:${mimeType};base64,${base64}`);
      }

      return uploadBase64();
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  const pickImage = async () => {
    try {
      if (Platform.OS !== "web") {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
          Alert.alert("Permission Required", "Permission to access camera roll is required!");
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        try {
          const uploadPromises = result.assets.map((asset) => uploadImage(asset.uri));
          const uploadedUrls = await Promise.all(uploadPromises);
          form.addPhotos(uploadedUrls);
        } catch (uploadError) {
          console.error("Error uploading images:", uploadError);
          Alert.alert("Upload Error", "Failed to upload images");
        }
      }
    } catch (error) {
      console.error("Error picking images:", error);
      Alert.alert("Error", "Failed to pick images");
    }
  };

  const handleDeleteMoment = async (id: string, title: string) => {
    const confirmDelete =
      Platform.OS === "web"
        ? (globalThis as any).confirm(`Are you sure you want to delete "${title}"?`)
        : await new Promise<boolean>((resolve) => {
            Alert.alert("Delete Moment", `Are you sure you want to delete "${title}"?`, [
              { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
              { text: "Delete", style: "destructive", onPress: () => resolve(true) },
            ]);
          });

    if (confirmDelete) {
      try {
        haptics.warning();
        await momentsService.deleteMoment(id);
        setIsDetailVisible(false);
        closeModal();
        loadMoments();
      } catch (error) {
        console.error("Error deleting moment:", error);
        if (Platform.OS === "web") {
          (globalThis as any).alert("Failed to delete moment");
        } else {
          Alert.alert("Error", "Failed to delete moment");
        }
      }
    }
  };

  const threadItems = useMemo<ThreadItem[]>(
    () =>
      moments.map((m, index) => ({
        id: m.id || `moment-${index}`,
        type: "moment",
        date: m.story_date,
        title: m.title,
        coverPhoto: filterValidPhotos(m.photos || [])[0] ?? null,
        body: m.description,
      })),
    [moments]
  );

  const onPressItem = useMemo(
    () =>
      guard((item: ThreadItem) => {
        const index = threadItems.indexOf(item);
        const moment = index >= 0 ? moments[index] : undefined;
        if (moment) handleViewMoment(moment);
      }),
    [guard, threadItems, moments, handleViewMoment]
  );

  const header = <Header title={SCREEN_TITLE} section="moments" style={styles.header} />;

  if (loading && moments.length === 0) {
    return (
      <ScreenBackground>
        <View style={styles.column}>
          {header}
          <Skeleton count={3} />
        </View>
      </ScreenBackground>
    );
  }

  const renderEmpty = () =>
    loadError === "failed" ? (
      <ErrorSlip what="your moments" onRetry={() => loadMoments(true, true)} style={styles.slip} />
    ) : (
      <EmptySlip
        message={EMPTY_COPY.moments.message}
        actionLabel={EMPTY_COPY.moments.action}
        onAction={() => openModal()}
        style={styles.slip}
      />
    );

  const listHeader = (
    <View>
      {header}
      {loadError === "stale" ? (
        <ErrorSlip what="your moments" onRetry={() => loadMoments(true, true)} showingSavedCopy style={styles.slip} />
      ) : null}
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return <Skeleton count={1} withPhotos={false} style={styles.footer} />;
  };

  return (
    <ScreenBackground>
      <Thread
        items={threadItems}
        onPressItem={onPressItem}
        ListEmptyComponent={renderEmpty}
        ListHeaderComponent={listHeader}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={[styles.column, styles.listContent]}
        refreshing={loading && moments.length === 0}
        onRefresh={() => loadMoments(true)}
      />

      <AddButton accessibilityLabel="Add a moment" onPress={() => openModal()} />

      {/* Create / edit form [7A] */}
      <FormSheet
        visible={isModalVisible}
        title={form.editingMoment ? "Edit moment" : "New moment"}
        saveState={saveState}
        error={formError}
        onSave={handleSaveMoment}
        onRequestClose={requestCloseModal}
      >
        <Input
          label="Title"
          placeholder="Give this moment a memorable title"
          value={form.title}
          onChangeText={form.setTitle}
        />

        <View>
          <Text variant="caption" tone="muted" uppercase style={styles.label}>
            Date
          </Text>

          {/* Web: inline date input */}
          {Platform.OS === "web" && (
            <WebDatePicker
              value={form.datePickerValue}
              onChange={(newDate) => {
                haptics.select();
                form.pickDate(newDate);
              }}
              maxDate={new Date()}
              accentColor={color.accent}
              backgroundColor={color.surfaceRaised}
              textColor={color.text}
            />
          )}

          {/* Native: a field that opens the picker */}
          {Platform.OS !== "web" && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Date, ${form.storyDate ? formatLongDate(form.storyDate) : "not set"}`}
              accessibilityHint="Opens the date picker"
              onPress={() => form.setShowDatePicker(!form.showDatePicker)}
              style={styles.dateField}
            >
              <Text variant="body" tone={form.storyDate ? "text" : "muted"}>
                {form.storyDate ? formatLongDate(form.storyDate) : "Select a date"}
              </Text>
              <Calendar size={iconSize.md} color={color.textMuted} strokeWidth={ICON_STROKE} />
            </Pressable>
          )}

          {/* iOS: inline spinner with Done */}
          {form.showDatePicker && Platform.OS === "ios" && (
            <View style={styles.iosPicker}>
              <View style={styles.iosPickerBar}>
                <Text variant="heading">Select date</Text>
                <Button
                  variant="primary"
                  label="Done"
                  onPress={() => {
                    haptics.select();
                    form.pickDate(form.datePickerValue);
                    form.setShowDatePicker(false);
                  }}
                />
              </View>
              <DateTimePicker
                value={form.datePickerValue}
                mode="date"
                display="spinner"
                onChange={form.handleDateChange}
                maximumDate={new Date()}
                textColor={color.text}
              />
            </View>
          )}

          {/* Android: system dialog */}
          {form.showDatePicker && Platform.OS === "android" && (
            <DateTimePicker
              value={form.datePickerValue}
              mode="date"
              display="default"
              onChange={(event: any, picked?: Date) => {
                if (event.type === "set") haptics.select();
                form.handleDateChange(event, picked);
              }}
              maximumDate={new Date()}
            />
          )}
        </View>

        <Input
          label="Description"
          placeholder="Describe this moment"
          value={form.description}
          onChangeText={form.setDescription}
          multiline
        />

        {/* Photos */}
        <View>
          <Text variant="caption" tone="muted" uppercase style={styles.label}>
            {`Photos (${form.photos.length})`}
          </Text>
          {form.photos.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbRow}>
              {form.photos.map((photo, index) => (
                <View key={`${photo}-${index}`} style={styles.thumb}>
                  <PhotoImage source={photo} tint={false} style={StyleSheet.absoluteFill} />
                  <Button
                    variant="icon"
                    accessibilityLabel={`Remove photo ${index + 1}`}
                    icon={<X size={iconSize.sm} color={color.text} strokeWidth={ICON_STROKE} />}
                    onPress={() => form.removePhoto(index)}
                    style={styles.thumbRemove}
                  />
                </View>
              ))}
            </ScrollView>
          ) : null}
          <Button
            variant="secondary"
            label={form.photos.length > 0 ? "Add more photos" : "Add photos"}
            icon={<ImagePlus size={iconSize.md} color={color.text} strokeWidth={ICON_STROKE} />}
            onPress={pickImage}
          />
        </View>
      </FormSheet>

      <ConfirmDialog
        visible={confirmDiscard}
        title="Discard this moment?"
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
        accessibilityLabel={selectedMoment?.title}
        style={styles.detailSheet}
      >
        {selectedMoment && (
          <MomentDetailView
            moment={selectedMoment}
            onClose={() => setIsDetailVisible(false)}
            onEdit={() => {
              setIsDetailVisible(false);
              setTimeout(() => openModal(selectedMoment), motion.sheetClose);
            }}
            onDelete={() =>
              selectedMoment.id ? handleDeleteMoment(selectedMoment.id, selectedMoment.title) : undefined
            }
          />
        )}
      </Sheet>
    </ScreenBackground>
  );
}

/** Thumbnail edge in the form's photo row. */
const THUMB = hitTarget * 2;

const styles = StyleSheet.create({
  column: { width: "100%", paddingHorizontal: gutter },
  header: { paddingHorizontal: 0 },
  listContent: { paddingBottom: space.xxxl * 2 },
  slip: { marginTop: space.xl },
  footer: { marginLeft: space.xl + space.md },
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
    padding: space.lg,
    backgroundColor: color.surfaceRaised,
    borderRadius: radius.field,
  },
  iosPickerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: space.md,
  },
  thumbRow: { gap: space.md, paddingBottom: space.md },
  thumb: { width: THUMB, height: THUMB, borderRadius: radius.print, overflow: "hidden" },
  thumbRemove: { position: "absolute", top: 0, right: 0, backgroundColor: color.scrim },
  detailSheet: { height: "92%" },
});
