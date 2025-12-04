import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  Milestone,
  CreateMilestoneDto,
  MilestoneType,
} from "../types/milestones";
import { milestonesService } from "../services/milestones";
import { API_BASE_URL } from "../services/api";
import {
  MILESTONE_CONFIG,
  getMilestoneConfig,
} from "../constants/milestoneConfig";
import MilestoneDetailView from "../components/MilestoneDetailView";
import MilestoneCard from "../components/MilestoneCard";
import AnimatedCard from "../components/AnimatedCard";
import AnimatedFAB from "../components/AnimatedFAB";
import { SkeletonList } from "../components/SkeletonLoader";
import AnimatedModal from "../components/AnimatedModal";
import SuccessCheckmark from "../components/SuccessCheckmark";
import EmptyState from "../components/common/EmptyState";
import LoadingMore from "../components/common/LoadingMore";
import ThumbnailImage from "../components/ThumbnailImage";
import WebDatePicker from "../components/WebDatePicker";
import { filterValidPhotos } from "../utils/imageUtils";
import { getBoxShadow } from "../utils/shadows";
import { formatDateEU } from "../utils/dateUtils";
import { ITEMS_PER_PAGE } from "../constants/spacing";
import {
  MILESTONE_BG,
  MILESTONE_COLOR,
  MILESTONE_SCREEN_BG,
  MILESTONE_BROWN_TEXT,
  MILESTONE_LIGHT_BROWN,
  MILESTONE_LIGHT_GOLD,
  MILESTONE_BORDER_LIGHT,
  MILESTONE_BORDER_OPACITY_30,
  MILESTONE_BORDER_OPACITY_40,
} from "../constants/theme";

export default function MilestonesScreen() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(
    null
  );
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // Form state
  const [milestoneType, setMilestoneType] = useState<MilestoneType>("met");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [datePickerValue, setDatePickerValue] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [webDateInput, setWebDateInput] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadMilestones();
  }, []);

  const loadMilestones = async (reset: boolean = true, skipCleanup: boolean = false) => {
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
      const result = await milestonesService.getAll(ITEMS_PER_PAGE, offset);
      
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
        setHasMore(sortedMilestones.length < (result.total || 0));
      } else {
        setMilestones((prev) => {
          // Deduplicate by ID to prevent duplicate keys
          const existingIds = new Set(prev.map((m) => m.id));
          const uniqueNewMilestones = sortedMilestones.filter(
            (m) => m.id && !existingIds.has(m.id)
          );
          const newMilestones = [...prev, ...uniqueNewMilestones];
          setHasMore(newMilestones.length < (result.total || 0));
          return newMilestones;
        });
      }

      setTotal(result.total || 0);
    } catch (error) {
      console.error("Error loading milestones:", error);
      Alert.alert("Error", "Failed to load milestones");
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
    setSelectedMilestone(milestone);
    setIsDetailVisible(true);
  }, []);

  const handleDeleteMilestone = useCallback(async (id: string, title?: string) => {
    const displayTitle = title || 'this milestone';
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
        setIsModalVisible(false);
        loadMilestones();
      } catch (error) {
        console.error("Error deleting milestone:", error);
        if (Platform.OS === "web") {
          (globalThis as any).alert("Failed to delete milestone");
        } else {
          Alert.alert("Error", "Failed to delete milestone");
        }
      }
    }
  }, [loadMilestones]);

  const renderMilestoneItem = useCallback(
    ({ item: milestone, index }: { item: Milestone; index: number }) => {
      return (
        <AnimatedCard index={index} animationType="spring">
          <MilestoneCard
            key={milestone.id}
            milestone={milestone}
            onPress={() => handleViewMilestone(milestone)}
            variant="screen"
          />
        </AnimatedCard>
      );
    },
    [handleViewMilestone, handleDeleteMilestone]
  );

  const renderEmpty = () => (
    <EmptyState
      icon="⭐"
      title="No milestones recorded yet"
      message="Start documenting your journey together!"
      backgroundColor={MILESTONE_SCREEN_BG}
    />
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return <LoadingMore color={MILESTONE_COLOR} />;
  };

  const formatDateForDb = (dateObj: Date): string => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const resetForm = () => {
    const today = new Date();
    setMilestoneType("met");
    setTitle("");
    setDate(formatDateForDb(today)); // Default to today
    setDatePickerValue(today);
    setDescription("");
    setPhotos([]);
    setEditingMilestone(null);
    setShowDatePicker(false);
    setWebDateInput("");
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

  const openModal = (milestone?: Milestone) => {
    if (milestone) {
      setSelectedMilestone(milestone);
      setEditingMilestone(milestone);
      setMilestoneType(milestone.milestone_type);
      setTitle(milestone.title);
      setDate(milestone.date);
      // Parse date manually to avoid timezone issues
      const [year, month, day] = milestone.date.split("-").map(Number);
      const parsedDate = new Date(year, month - 1, day);
      setDatePickerValue(isNaN(parsedDate.getTime()) ? new Date() : parsedDate);
      setDescription(milestone.description || "");
      // Don't filter photos when opening modal - use photos as-is from database
      // Filtering will happen on save and on load, not when editing
      setPhotos(milestone.photos || []);
    } else {
      resetForm();
    }
    setIsModalVisible(true);
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  };

  const formatDateForDisplay = (dateString: string | Date): string => {
    const dateObj =
      typeof dateString === "string" ? new Date(dateString) : dateString;
    if (isNaN(dateObj.getTime())) return "";

    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatDateForDatabase = (dateObj: Date): string => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (event: any, pickedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (event.type === "set" && pickedDate) {
      setDatePickerValue(pickedDate);
      const formattedDate = formatDateForDatabase(pickedDate);
      setDate(formattedDate);
    } else if (event.type === "dismissed") {
      setShowDatePicker(false);
    }
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setTimeout(resetForm, 300);
  };

  const handleSaveMilestone = async () => {
    if (!date || !title) {
      Alert.alert("Missing Information", "Please fill in the date and title");
      return;
    }

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

      closeModal();
      // Skip cleanup when loading after save to prevent removing just-saved photos
      await loadMilestones(true);
      setShowSuccess(true); // Show success animation
    } catch (error) {
      console.error("Error saving milestone:", error);
      Alert.alert("Error", "Failed to save milestone");
    }
  };

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

      const uploadResponse = await fetch(
        `${API_BASE_URL}/milestones/upload-image`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image: base64data }),
        }
      );

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(
          `Failed to upload image: ${uploadResponse.status} ${errorText}`
        );
      }

      const result = await uploadResponse.json();
      if (!result.url) {
        throw new Error("No URL returned from upload");
      }
      return result.url;
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

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
  };

  // Use formatDateEU for display (European format: dd-mm-yyyy)
  const formatDate = formatDateEU;

  const milestoneConfig = getMilestoneConfig(milestoneType);
  const milestoneColor = milestoneConfig.color;

  if (loading && milestones.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: MILESTONE_SCREEN_BG }}>
        <SkeletonList variant="milestone" count={3} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: MILESTONE_SCREEN_BG }}>
      <FlatList
        data={milestones}
        renderItem={renderMilestoneItem}
        keyExtractor={(item, index) => item.id || `milestone-${index}`}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshing={loading && milestones.length === 0}
        onRefresh={() => loadMilestones(true, false)}
      />

      <AnimatedModal
        visible={isDetailVisible}
        onClose={closeDetailView}
      >
        {selectedMilestone && (
          <MilestoneDetailView
            milestone={selectedMilestone}
            onClose={closeDetailView}
            onEdit={handleEditFromDetail}
          />
        )}
      </AnimatedModal>

      {/* Animated Floating Action Button */}
      <AnimatedFAB
        onPress={() => openModal()}
        color="#ffd700"
        style={{
          ...getBoxShadow("#ffd700", { width: 0, height: 6 }, 0.5, 16),
          borderWidth: 2,
          borderColor: MILESTONE_BORDER_LIGHT,
        }}
      >
        <Text style={{ fontSize: 32, color: MILESTONE_SCREEN_BG, fontWeight: "600" }}>
          ⭐
        </Text>
      </AnimatedFAB>

      {/* Success Checkmark Animation */}
      <SuccessCheckmark 
        visible={showSuccess} 
        onHide={() => setShowSuccess(false)} 
        color={MILESTONE_COLOR} 
      />

      {/* Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <Animated.View
            style={{
              flex: 1,
              backgroundColor: "#1a0f00",
              opacity: fadeAnim,
            }}
          >
            {/* Header */}
            <View
              style={{
                paddingTop: Platform.OS === "ios" ? 60 : 40,
                paddingBottom: 20,
                paddingHorizontal: 20,
                backgroundColor: MILESTONE_BG,
                borderBottomWidth: 1,
                borderBottomColor: MILESTONE_BORDER_OPACITY_30,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <TouchableOpacity
                  onPress={closeModal}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "rgba(255, 215, 0, 0.2)",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: MILESTONE_BORDER_OPACITY_40,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 20,
                      color: MILESTONE_COLOR,
                      fontWeight: "600",
                    }}
                  >
                    ✕
                  </Text>
                </TouchableOpacity>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "300",
                    color: MILESTONE_COLOR,
                    letterSpacing: 1,
                    fontFamily: Platform.select({
                      ios: "Georgia",
                      android: "serif",
                    }),
                  }}
                >
                  {editingMilestone ? "Edit Milestone" : "New Milestone"}
                </Text>
                <TouchableOpacity
                  onPress={handleSaveMilestone}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: "#ffd700",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: "#1a0f00",
                      fontWeight: "600",
                    }}
                  >
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              style={{ flex: 1, padding: 20, backgroundColor: "#1a0f00" }}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              {/* Milestone Type Selection */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 18,
                    color: MILESTONE_COLOR,
                    marginBottom: 12,
                    fontWeight: "600",
                  }}
                >
                  ⭐ Milestone Type
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 10 }}
                >
                  {(Object.keys(MILESTONE_CONFIG) as MilestoneType[]).map(
                    (type) => {
                      const config = MILESTONE_CONFIG[type];
                      const isSelected = milestoneType === type;
                      return (
                        <TouchableOpacity
                          key={type}
                          onPress={() => {
                            setMilestoneType(type);
                            if (
                              !title ||
                              title === MILESTONE_CONFIG[milestoneType].label
                            ) {
                              setTitle(config.label);
                            }
                          }}
                          style={{
                            paddingHorizontal: 20,
                            paddingVertical: 12,
                            borderRadius: 24,
                            backgroundColor: isSelected
                              ? config.color
                              : "#2d1810",
                            borderWidth: 2,
                            borderColor: isSelected
                              ? "transparent"
                              : config.color + "40",
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <Text style={{ fontSize: 20 }}>{config.icon}</Text>
                          <Text
                            style={{
                              color: isSelected ? MILESTONE_SCREEN_BG : config.color,
                              fontSize: 15,
                              fontWeight: isSelected ? "600" : "500",
                            }}
                          >
                            {config.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                  )}
                </ScrollView>
              </View>

              {/* Title Input */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 18,
                    color: MILESTONE_COLOR,
                    marginBottom: 12,
                    fontWeight: "600",
                  }}
                >
                  ✨ Title *
                </Text>
                <TextInput
                  style={{
                    borderWidth: 2,
                    borderColor: milestoneColor + "60",
                    borderRadius: 16,
                    padding: 18,
                    fontSize: 17,
                    backgroundColor: MILESTONE_BG,
                    color: MILESTONE_COLOR,
                    fontWeight: "500",
                  }}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Enter milestone title..."
                  placeholderTextColor={MILESTONE_BROWN_TEXT}
                />
              </View>

              {/* Date Picker */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 18,
                    color: MILESTONE_COLOR,
                    marginBottom: 12,
                    fontWeight: "600",
                  }}
                >
                  📅 Date *
                </Text>

                {/* Web: Inline date input */}
                {Platform.OS === "web" && (
                  <WebDatePicker
                    value={datePickerValue}
                    onChange={(newDate) => {
                      setDatePickerValue(newDate);
                      setDate(formatDateForDatabase(newDate));
                    }}
                    maxDate={new Date()}
                    accentColor={milestoneColor}
                    backgroundColor={MILESTONE_BG}
                    textColor={MILESTONE_COLOR}
                  />
                )}

                {/* Native: TouchableOpacity to open picker */}
                {Platform.OS !== "web" && (
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(!showDatePicker)}
                    style={{
                      borderWidth: 2,
                      borderColor: milestoneColor + "60",
                      borderRadius: 16,
                      padding: 18,
                      backgroundColor: MILESTONE_BG,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 17,
                        color: date ? "#ffd700" : "#8b7355",
                        fontWeight: "500",
                      }}
                    >
                      {date && datePickerValue
                        ? formatDateForDisplay(datePickerValue)
                        : "Select a date"}
                    </Text>
                    <Text style={{ fontSize: 20, color: milestoneColor }}>
                      📅
                    </Text>
                  </TouchableOpacity>
                )}

                {showDatePicker && Platform.OS === "ios" && (
                  <View
                    style={{
                      marginTop: 16,
                      padding: 20,
                      backgroundColor: MILESTONE_BG,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: milestoneColor + "60",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 16,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: "600",
                          color: MILESTONE_COLOR,
                        }}
                      >
                        Select Date
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          const formattedDate =
                            formatDateForDatabase(datePickerValue);
                          setDate(formattedDate);
                          setShowDatePicker(false);
                        }}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 20,
                          backgroundColor: milestoneColor,
                        }}
                      >
                        <Text
                          style={{
                            color: "#1a0f00",
                            fontWeight: "600",
                          }}
                        >
                          Done
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={datePickerValue}
                      mode="date"
                      display="spinner"
                      onChange={handleDateChange}
                      maximumDate={new Date()}
                    />
                  </View>
                )}
              </View>

              {/* Description */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 18,
                    color: MILESTONE_COLOR,
                    marginBottom: 12,
                    fontWeight: "600",
                  }}
                >
                  💭 Description
                </Text>
                <TextInput
                  style={{
                    borderWidth: 2,
                    borderColor: milestoneColor + "60",
                    borderRadius: 16,
                    padding: 18,
                    fontSize: 17,
                    backgroundColor: MILESTONE_BG,
                    color: MILESTONE_LIGHT_BROWN,
                    minHeight: 120,
                    textAlignVertical: "top",
                    lineHeight: 24,
                  }}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe this milestone..."
                  placeholderTextColor={MILESTONE_BROWN_TEXT}
                  multiline
                />
              </View>

              {/* Photos */}
              <View style={{ marginBottom: 30 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      color: MILESTONE_COLOR,
                      fontWeight: "600",
                    }}
                  >
                    📷 Photos ({photos.length})
                  </Text>
                  <TouchableOpacity
                    onPress={pickImage}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: milestoneColor,
                    }}
                  >
                    <Text
                      style={{
                        color: "#1a0f00",
                        fontSize: 15,
                        fontWeight: "600",
                      }}
                    >
                      + Add Photo
                    </Text>
                  </TouchableOpacity>
                </View>

                {photos.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 12, paddingVertical: 8 }}
                  >
                    {photos.map((photo, index) => (
                      <View key={index} style={{ position: "relative" }}>
                        <ThumbnailImage
                          source={photo}
                          style={{
                            width: 120,
                            height: 120,
                            borderRadius: 12,
                            borderWidth: 2,
                            borderColor: milestoneColor,
                          }}
                          contentFit="cover"
                          cachePolicy="disk"
                          transition={150}
                        />
                        <TouchableOpacity
                          onPress={() => removePhoto(index)}
                          style={{
                            position: "absolute",
                            top: -8,
                            right: -8,
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            backgroundColor: "#ef4444",
                            alignItems: "center",
                            justifyContent: "center",
                            borderWidth: 2,
                            borderColor: "#fff",
                            zIndex: 10,
                          }}
                        >
                          <Text
                            style={{
                              color: "#fff",
                              fontSize: 16,
                              fontWeight: "600",
                            }}
                          >
                            ×
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <TouchableOpacity
                    style={{
                      borderWidth: 2,
                      borderColor: milestoneColor + "60",
                      borderStyle: "dashed",
                      borderRadius: 16,
                      padding: 24,
                      backgroundColor: MILESTONE_BG,
                      alignItems: "center",
                      minHeight: 120,
                      justifyContent: "center",
                    }}
                    onPress={pickImage}
                  >
                    <Text
                      style={{
                        fontSize: 32,
                        color: milestoneColor + "80",
                        marginBottom: 12,
                      }}
                    >
                      📷
                    </Text>
                    <Text
                      style={{
                        color: MILESTONE_BROWN_TEXT,
                        fontSize: 17,
                        fontWeight: "500",
                      }}
                    >
                      Tap to add photos
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Delete Button for Editing */}
              {editingMilestone && (
                <TouchableOpacity
                  onPress={() =>
                    editingMilestone.id &&
                    handleDeleteMilestone(editingMilestone.id, editingMilestone.title)
                  }
                  style={{
                    backgroundColor: "#ef4444",
                    padding: 16,
                    borderRadius: 20,
                    alignItems: "center",
                    marginTop: 20,
                    marginBottom: 20,
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 18,
                      fontWeight: "600",
                    }}
                  >
                    Delete Milestone
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Android Date Picker */}
      {showDatePicker && Platform.OS === "android" && (
        <DateTimePicker
          value={datePickerValue}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
    </View>
  );
}
