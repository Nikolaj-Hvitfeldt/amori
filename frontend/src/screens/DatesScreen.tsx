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
import { DateEntry, CreateDateEntryDto, DateMood } from "../types/dates";
import { datesService } from "../services/dates";
import { API_BASE_URL } from "../services/api";
import DateDetailView from "../components/DateDetailView";
import DateCard from "../components/DateCard";
import AnimatedCard from "../components/AnimatedCard";
import EmptyState from "../components/common/EmptyState";
import LoadingMore from "../components/common/LoadingMore";
import { filterValidPhotos } from "../utils/imageUtils";
import { getBoxShadow } from "../utils/shadows";
import { formatDateEU } from "../utils/dateUtils";
import { MOOD_COLORS, MOOD_OPTIONS } from "../utils/moodUtils";
import { ITEMS_PER_PAGE } from "../constants/spacing";
import {
  TIME_THEMES,
  TimeOfDay,
  DATE_SCREEN_BG,
  DATE_SCREEN_PURPLE,
  DATE_SCREEN_PURPLE_LIGHT,
  DATE_SCREEN_GRAY_DARK,
} from "../constants/theme";


export default function DatesScreen() {
  const [dates, setDates] = useState<DateEntry[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<DateEntry | null>(null);
  const [editingDate, setEditingDate] = useState<DateEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  // Form state
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [datePickerValue, setDatePickerValue] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [webDateInput, setWebDateInput] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [mood, setMood] = useState<DateMood>("romantic");
  const [highlights, setHighlights] = useState<string[]>([""]);
  const [weather, setWeather] = useState("");
  const [favoriteMoment, setFavoriteMoment] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Get time of day from date input
  const getTimeOfDay = (dateString: string): TimeOfDay => {
    if (!dateString) return "night";
    try {
      const hour = new Date(dateString).getHours();
      if (hour >= 5 && hour < 12) return "morning";
      if (hour >= 12 && hour < 17) return "afternoon";
      if (hour >= 17 && hour < 21) return "evening";
    } catch {
      // If date parsing fails, default to night
    }
    return "night";
  };

  const timeOfDay = getTimeOfDay(date);
  const theme = TIME_THEMES[timeOfDay];
  const moodColor = MOOD_COLORS[mood];

  useEffect(() => {
    loadDates();
  }, []);

  const loadDates = async (reset: boolean = true) => {
    try {
      if (reset) {
        setLoading(true);
        setDates([]);
      } else {
        setLoadingMore(true);
      }

      const offset = reset ? 0 : dates.length;
      const result = await datesService.getAll(ITEMS_PER_PAGE, offset);
      
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
        setHasMore(sortedDates.length < (result.total || 0));
      } else {
        setDates((prev) => {
          // Deduplicate by ID to prevent duplicate keys
          const existingIds = new Set(prev.map((d) => d.id));
          const uniqueNewDates = sortedDates.filter(
            (d) => d.id && !existingIds.has(d.id)
          );
          const newDates = [...prev, ...uniqueNewDates];
          setHasMore(newDates.length < (result.total || 0));
          return newDates;
        });
      }

      setTotal(result.total || 0);
    } catch (error) {
      console.error("Error loading dates:", error);
      Alert.alert("Error", "Failed to load dates");
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

  const handleViewDate = useCallback((dateEntry: DateEntry) => {
    setSelectedDate(dateEntry);
    setIsDetailVisible(true);
  }, []);

  const handleDeleteDate = useCallback(async (id: string) => {
    Alert.alert(
      "Delete Date",
      "Are you sure you want to delete this special date?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await datesService.delete(id);
              loadDates();
            } catch (error) {
              console.error("Error deleting date:", error);
              Alert.alert("Error", "Failed to delete date entry");
            }
          },
        },
      ]
    );
  }, []);

  const renderDateItem = useCallback(
    ({ item: dateEntry, index }: { item: DateEntry; index: number }) => {
      return (
        <AnimatedCard index={index} animationType="spring">
          <DateCard
            key={dateEntry.id}
            dateEntry={dateEntry}
            onPress={() => handleViewDate(dateEntry)}
            onLongPress={() => handleDeleteDate(dateEntry.id)}
            variant="screen"
          />
        </AnimatedCard>
      );
    },
    [handleViewDate, handleDeleteDate]
  );

  const renderEmpty = () => (
    <EmptyState
      icon="📅"
      title="No special dates recorded yet"
      message="Create your first memory to begin the journey."
      backgroundColor={DATE_SCREEN_BG}
    />
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return <LoadingMore color={DATE_SCREEN_PURPLE} />;
  };

  const resetForm = () => {
    setTitle("");
    setDate("");
    setDatePickerValue(new Date());
    setLocation("");
    setDescription("");
    setMood("romantic");
    setHighlights([""]);
    setWeather("");
    setFavoriteMoment("");
    setPhotos([]);
    setEditingDate(null);
    setShowDatePicker(false);
    setWebDateInput("");
  };

  // Helper function to filter out invalid/blob URLs

  const openModal = (dateEntry?: DateEntry) => {
    if (dateEntry) {
      setEditingDate(dateEntry);
      setTitle(dateEntry.title || "");
      setDate(dateEntry.date);
      // Parse the date string to Date object
      const parsedDate = new Date(dateEntry.date);
      setDatePickerValue(isNaN(parsedDate.getTime()) ? new Date() : parsedDate);
      setLocation(dateEntry.location);
      setDescription(dateEntry.description);
      setMood(dateEntry.mood);
      setHighlights(
        dateEntry.highlights.length > 0 ? dateEntry.highlights : [""]
      );
      setWeather(dateEntry.weather || "");
      setFavoriteMoment(dateEntry.favorite_moment || "");
      // Support both photos array and legacy image_url
      // Don't filter photos when opening modal - use photos as-is from database
      // Filtering will happen on save and on load, not when editing
      const allPhotos =
        dateEntry.photos && dateEntry.photos.length > 0
          ? dateEntry.photos
          : dateEntry.image_url
          ? [dateEntry.image_url]
          : [];
      setPhotos(allPhotos);
    } else {
      resetForm();
    }
    setIsModalVisible(true);
    // Animate fade in
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

    // European format: dd-mm-yyyy
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
    console.log("Date picker event:", event.type, "pickedDate:", pickedDate);

    // On Android, always close the picker after the event
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    // Handle the date selection
    if (event.type === "set" && pickedDate) {
      setDatePickerValue(pickedDate);
      const formattedDate = formatDateForDatabase(pickedDate);
      setDate(formattedDate);
      console.log("Date set to:", formattedDate);
    } else if (event.type === "dismissed") {
      // User cancelled on Android
      setShowDatePicker(false);
      console.log("Date picker dismissed");
    }
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setTimeout(resetForm, 300);
  };

  const handleSaveDate = async () => {
    if (!date || !location || !description) {
      Alert.alert(
        "Missing Information",
        "Please fill in the date, location, and description"
      );
      return;
    }

    try {
      const filteredHighlights = highlights.filter((h) => h.trim() !== "");
      // Filter out invalid/blob URLs before saving
      const validPhotos = filterValidPhotos(photos);
      
      // Debug logging
      console.log("💾 Saving date entry:");
      console.log("  - Photos in state:", photos);
      console.log("  - Valid photos after filtering:", validPhotos);
      console.log("  - Photos count:", photos.length, "->", validPhotos.length);

      const dateData: CreateDateEntryDto = {
        title: title.trim() || undefined,
        date,
        location,
        description,
        mood,
        highlights: filteredHighlights,
        weather: weather || undefined,
        favorite_moment: favoriteMoment || undefined,
        // Always include photos array - empty array means no photos
        photos: validPhotos,
      };
      
      console.log("  - Data being sent:", { ...dateData, photos: dateData.photos });

      if (editingDate) {
        console.log("  - Updating existing date:", editingDate.id);
        await datesService.update(editingDate.id, dateData);
      } else {
        console.log("  - Creating new date");
        await datesService.create(dateData);
      }

      console.log("  - ✅ Date saved successfully");
      closeModal();
      loadDates();
    } catch (error) {
      console.error("Error saving date:", error);
      Alert.alert("Error", "Failed to save date entry");
    }
  };

  const addHighlight = () => {
    setHighlights([...highlights, ""]);
  };

  const updateHighlight = (index: number, value: string) => {
    const newHighlights = [...highlights];
    newHighlights[index] = value;
    setHighlights(newHighlights);
  };

  const removeHighlight = (index: number) => {
    if (highlights.length > 1) {
      const newHighlights = highlights.filter((_, i) => i !== index);
      setHighlights(newHighlights);
    }
  };

  const uploadImage = async (uri: string): Promise<string> => {
    try {
      let base64: string;
      let mimeType: string;

      if (Platform.OS === "web") {
        // For web, handle blob URLs and data URLs
        if (uri.startsWith("blob:") || uri.startsWith("data:")) {
          // If it's already a data URL, extract the base64
          if (uri.startsWith("data:")) {
            const matches = uri.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
              mimeType = matches[1];
              base64 = matches[2];
            } else {
              throw new Error("Invalid data URL format");
            }
          } else {
            // For blob URLs, fetch and convert
            const response = await fetch(uri);
            const blob = await response.blob();

            // Get mime type from blob
            mimeType = blob.type || "image/jpeg";

            // Convert blob to base64
            base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const result = reader.result as string;
                // Remove data URL prefix
                const base64Data = result.split(",")[1];
                resolve(base64Data);
              };
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          }
        } else {
          // For file:// URLs or other, try to fetch
          const response = await fetch(uri);
          const blob = await response.blob();

          // Get mime type from blob
          mimeType = blob.type || "image/jpeg";

          // Convert blob to base64
          base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              // Remove data URL prefix
              const base64Data = result.split(",")[1];
              resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }
      } else {
        // For native platforms, use expo-file-system
        base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Determine mime type from file extension
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

      // Upload to backend
      const uploadResponse = await fetch(`${API_BASE_URL}/dates/upload-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: base64data }),
      });

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
      // Request permissions (skip on web as it's handled by browser)
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

      console.log("Image picker result:", result);
      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log(`Uploading ${result.assets.length} images...`);
        setLoading(true);
        try {
          // Upload all selected images
          const uploadPromises = result.assets.map((asset, index) => {
            console.log(
              `Uploading image ${index + 1}/${result.assets.length}:`,
              asset.uri
            );
            return uploadImage(asset.uri);
          });
          const uploadedUrls = await Promise.all(uploadPromises);
          console.log("📸 Uploaded URLs:", uploadedUrls);
          console.log("📸 Current photos before adding:", photos);
          const newPhotos = [...photos, ...uploadedUrls];
          console.log("📸 New photos array:", newPhotos);
          setPhotos(newPhotos);
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
      } else {
        console.log("Image picker was canceled or no assets selected");
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

  return (
    <View style={{ flex: 1, backgroundColor: DATE_SCREEN_BG }}>


      <FlatList
        data={dates}
        renderItem={renderDateItem}
        keyExtractor={(item, index) => item.id || `date-${index}`}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshing={loading && dates.length === 0}
        onRefresh={() => loadDates(true)}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={{
          position: "absolute",
          bottom: 30,
          right: 30,
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: DATE_SCREEN_PURPLE,
          alignItems: "center",
          justifyContent: "center",
          ...getBoxShadow(DATE_SCREEN_PURPLE, { width: 0, height: 6 }, 0.5, 16),
          elevation: 10,
          borderWidth: 2,
          borderColor: DATE_SCREEN_PURPLE_LIGHT,
        }}
        onPress={() => openModal()}
      >
        <Text style={{ fontSize: 32, color: "#e5d3ff", fontWeight: "600" }}>
          📅
        </Text>
      </TouchableOpacity>

      {/* Immersive Modal */}
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
              backgroundColor: theme.bg,
              opacity: fadeAnim,
            }}
          >
            {/* Header with Photo Preview */}
            <View
              style={{
                paddingTop: Platform.OS === "ios" ? 60 : 40,
                paddingBottom: 20,
                paddingHorizontal: 20,
                backgroundColor:
                  timeOfDay === "night" ? TIME_THEMES.night.gradient[1] : theme.gradient[0] + "40",
                borderBottomWidth: 1,
                borderBottomColor:
                  timeOfDay === "night" ? DATE_SCREEN_GRAY_DARK : theme.gradient[0] + "60",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: photos.length > 0 ? 16 : 0,
                }}
              >
                <TouchableOpacity
                  onPress={closeModal}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor:
                      timeOfDay === "night"
                        ? "rgba(0, 0, 0, 0.5)"
                        : "rgba(255, 255, 255, 0.3)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 20,
                      color: theme.text,
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
                    color: theme.text,
                    letterSpacing: 1,
                    fontFamily: Platform.select({
                      ios: "Georgia",
                      android: "serif",
                    }),
                  }}
                >
                  {editingDate ? "Edit Date" : "New Date"}
                </Text>
                <TouchableOpacity
                  onPress={handleSaveDate}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: moodColor,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: timeOfDay === "night" ? "#fff" : "#1a1a2e",
                      fontWeight: "600",
                    }}
                  >
                    Save
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Photo Preview */}
              {photos.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: 12 }}
                  contentContainerStyle={{ paddingHorizontal: 10, gap: 12 }}
                >
                  {photos.map((photo, index) => (
                    <View key={index} style={{ position: "relative" }}>
                      <Image
                        source={photo}
                        style={{
                          width: 120,
                          height: 120,
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor: moodColor + "60",
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
              )}
            </View>

            <ScrollView
              style={{ flex: 1, padding: 20 }}
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Mood Badge Preview */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  alignSelf: "flex-start",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: moodColor + "40",
                  marginBottom: 24,
                }}
              >
                <Text style={{ fontSize: 20, marginRight: 8 }}>
                  {MOOD_OPTIONS.find((m) => m.value === mood)?.icon}
                </Text>
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: moodColor }}
                >
                  {MOOD_OPTIONS.find((m) => m.value === mood)?.label}
                </Text>
              </View>

              {/* Title Input */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 18,
                    color: theme.text,
                    marginBottom: 12,
                    fontWeight: "600",
                    letterSpacing: 0.5,
                  }}
                >
                  ✨ Title
                </Text>
                <TextInput
                  style={{
                    borderWidth: 2,
                    borderColor: moodColor + "60",
                    borderRadius: 16,
                    padding: 18,
                    fontSize: 17,
                    backgroundColor:
                      timeOfDay === "night"
                        ? "#1e293b"
                        : "rgba(255, 255, 255, 0.9)",
                    color: theme.text,
                    fontWeight: "500",
                  }}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Give this date a memorable title..."
                  placeholderTextColor={
                    timeOfDay === "night" ? "#6b7280" : theme.text + "60"
                  }
                />
              </View>

              {/* Date Picker */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 18,
                    color: theme.text,
                    marginBottom: 12,
                    fontWeight: "600",
                    letterSpacing: 0.5,
                  }}
                >
                  📅 Date *
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    console.log(
                      "Date picker button pressed, showDatePicker:",
                      showDatePicker,
                      "date:",
                      date,
                      "datePickerValue:",
                      datePickerValue
                    );
                    if (Platform.OS === "web") {
                      if (!showDatePicker) {
                        // Initialize web date input with current date if available
                        const initialValue =
                          date && datePickerValue
                            ? formatDateForDisplay(datePickerValue)
                            : "";
                        console.log(
                          "Initializing webDateInput with:",
                          initialValue
                        );
                        setWebDateInput(initialValue);
                      }
                    }
                    setShowDatePicker(!showDatePicker);
                  }}
                  style={{
                    borderWidth: 2,
                    borderColor: moodColor + "60",
                    borderRadius: 16,
                    padding: 18,
                    backgroundColor:
                      timeOfDay === "night"
                        ? "#1e293b"
                        : "rgba(255, 255, 255, 0.9)",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 17,
                      color: date
                        ? theme.text
                        : timeOfDay === "night"
                        ? "#6b7280"
                        : theme.text + "60",
                      fontWeight: "500",
                    }}
                  >
                    {date && datePickerValue
                      ? formatDateForDisplay(datePickerValue)
                      : "Select a date"}
                  </Text>
                  <Text style={{ fontSize: 20, color: moodColor }}>📅</Text>
                </TouchableOpacity>

                {/* Date Picker - Inline for iOS */}
                {showDatePicker && Platform.OS === "ios" && (
                  <View
                    style={{
                      marginTop: 16,
                      padding: 20,
                      backgroundColor:
                        timeOfDay === "night"
                          ? "#1e293b"
                          : "rgba(255, 255, 255, 0.9)",
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: moodColor + "60",
                      zIndex: 1000,
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
                          color: theme.text,
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
                          backgroundColor: moodColor,
                        }}
                      >
                        <Text
                          style={{
                            color: timeOfDay === "night" ? "#fff" : "#1a1a2e",
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
                      textColor={theme.text}
                    />
                  </View>
                )}

                {/* Web Date Picker - Use TextInput with European date format */}
                {showDatePicker && Platform.OS === "web" && (
                  <View
                    style={{
                      marginTop: 16,
                      padding: 20,
                      backgroundColor:
                        timeOfDay === "night"
                          ? "#1e293b"
                          : "rgba(255, 255, 255, 0.9)",
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: moodColor + "60",
                    }}
                  >
                    <TextInput
                      value={webDateInput}
                      onChangeText={(text) => {
                        // Allow user to type freely
                        // Format as they type: dd-mm-yyyy
                        let cleaned = text.replace(/[^\d-]/g, "");

                        // Remove extra dashes
                        cleaned = cleaned.replace(/-+/g, "-");
                        if (cleaned.startsWith("-")) cleaned = cleaned.slice(1);

                        // Auto-format with dashes
                        let formatted = cleaned;
                        if (cleaned.length > 2 && !cleaned.includes("-")) {
                          formatted =
                            cleaned.slice(0, 2) + "-" + cleaned.slice(2);
                        }
                        if (
                          cleaned.length > 5 &&
                          cleaned.split("-").length === 2
                        ) {
                          const parts = cleaned.split("-");
                          formatted =
                            parts[0] +
                            "-" +
                            parts[1].slice(0, 2) +
                            "-" +
                            parts[1].slice(2, 6);
                        }

                        setWebDateInput(formatted);

                        // Try to parse when we have a complete date (dd-mm-yyyy)
                        const parts = formatted.split("-");
                        if (
                          parts.length === 3 &&
                          parts[0].length === 2 &&
                          parts[1].length === 2 &&
                          parts[2].length === 4
                        ) {
                          const day = parseInt(parts[0], 10);
                          const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
                          const year = parseInt(parts[2], 10);

                          // Validate date
                          if (
                            day >= 1 &&
                            day <= 31 &&
                            month >= 0 &&
                            month <= 11 &&
                            year >= 1900 &&
                            year <= 2100
                          ) {
                            const parsedDate = new Date(year, month, day);
                            if (
                              !isNaN(parsedDate.getTime()) &&
                              parsedDate.getDate() === day &&
                              parsedDate.getMonth() === month &&
                              parsedDate.getFullYear() === year
                            ) {
                              setDatePickerValue(parsedDate);
                              const formattedDate =
                                formatDateForDatabase(parsedDate);
                              setDate(formattedDate);
                            }
                          }
                        }
                      }}
                      placeholder="dd-mm-yyyy"
                      keyboardType="numeric"
                      maxLength={10}
                      editable={true}
                      style={{
                        borderWidth: 2,
                        borderColor: moodColor + "60",
                        borderRadius: 12,
                        padding: 12,
                        fontSize: 16,
                        backgroundColor:
                          timeOfDay === "night" ? "#0f172a" : "#ffffff",
                        color: theme.text,
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => {
                        // Parse the input when closing if not already parsed
                        if (webDateInput) {
                          const parts = webDateInput.split("-");
                          if (parts.length === 3) {
                            const day = parseInt(parts[0], 10);
                            const month = parseInt(parts[1], 10) - 1;
                            const year = parseInt(parts[2], 10);
                            const parsedDate = new Date(year, month, day);
                            if (!isNaN(parsedDate.getTime())) {
                              setDatePickerValue(parsedDate);
                              const formattedDate =
                                formatDateForDatabase(parsedDate);
                              setDate(formattedDate);
                            }
                          }
                        } else if (datePickerValue) {
                          const formattedDate =
                            formatDateForDatabase(datePickerValue);
                          setDate(formattedDate);
                        }
                        setWebDateInput("");
                        setShowDatePicker(false);
                      }}
                      style={{
                        marginTop: 12,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor: moodColor,
                        alignSelf: "flex-end",
                      }}
                    >
                      <Text
                        style={{
                          color: timeOfDay === "night" ? "#fff" : "#1a1a2e",
                          fontWeight: "600",
                        }}
                      >
                        Done
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Location Input */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 18,
                    color: theme.text,
                    marginBottom: 12,
                    fontWeight: "600",
                    letterSpacing: 0.5,
                  }}
                >
                  📍 Location *
                </Text>
                <TextInput
                  style={{
                    borderWidth: 2,
                    borderColor: moodColor + "60",
                    borderRadius: 16,
                    padding: 18,
                    fontSize: 17,
                    backgroundColor:
                      timeOfDay === "night"
                        ? "#1e293b"
                        : "rgba(255, 255, 255, 0.9)",
                    color: theme.text,
                    fontWeight: "500",
                  }}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Where did this beautiful date take place?"
                  placeholderTextColor={
                    timeOfDay === "night" ? "#6b7280" : theme.text + "60"
                  }
                />
              </View>

              {/* Mood Selection */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 18,
                    color: theme.text,
                    marginBottom: 12,
                    fontWeight: "600",
                    letterSpacing: 0.5,
                  }}
                >
                  ✨ Mood
                </Text>
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}
                >
                  {MOOD_OPTIONS.map((option) => {
                    const isSelected = mood === option.value;
                    const optionColor = MOOD_COLORS[option.value];
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={{
                          paddingHorizontal: 18,
                          paddingVertical: 12,
                          borderRadius: 24,
                          backgroundColor: isSelected
                            ? optionColor
                            : timeOfDay === "night"
                            ? "#374151"
                            : "rgba(255, 255, 255, 0.6)",
                          flexDirection: "row",
                          alignItems: "center",
                          borderWidth: isSelected ? 0 : 2,
                          borderColor: isSelected
                            ? "transparent"
                            : optionColor + "40",
                        }}
                        onPress={() => setMood(option.value)}
                      >
                        <Text style={{ fontSize: 18, marginRight: 8 }}>
                          {option.icon}
                        </Text>
                        <Text
                          style={{
                            color: isSelected
                              ? timeOfDay === "night"
                                ? "#fff"
                                : "#1a1a2e"
                              : theme.text,
                            fontSize: 15,
                            fontWeight: isSelected ? "600" : "500",
                          }}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Description */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 18,
                    color: theme.text,
                    marginBottom: 12,
                    fontWeight: "600",
                    letterSpacing: 0.5,
                  }}
                >
                  💭 Description *
                </Text>
                <TextInput
                  style={{
                    borderWidth: 2,
                    borderColor: moodColor + "60",
                    borderRadius: 16,
                    padding: 18,
                    fontSize: 17,
                    backgroundColor:
                      timeOfDay === "night"
                        ? "#1e293b"
                        : "rgba(255, 255, 255, 0.9)",
                    color: theme.text,
                    minHeight: 120,
                    textAlignVertical: "top",
                    lineHeight: 24,
                  }}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe this special date..."
                  placeholderTextColor={
                    timeOfDay === "night" ? "#6b7280" : theme.text + "60"
                  }
                  multiline
                />
              </View>

              {/* Highlights */}
              <View style={{ marginBottom: 24 }}>
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
                      color: theme.text,
                      fontWeight: "600",
                      letterSpacing: 0.5,
                    }}
                  >
                    ✨ Highlights
                  </Text>
                  <TouchableOpacity
                    onPress={addHighlight}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: moodColor,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 20,
                        color: timeOfDay === "night" ? "#fff" : "#1a1a2e",
                        fontWeight: "600",
                      }}
                    >
                      +
                    </Text>
                  </TouchableOpacity>
                </View>
                {highlights.map((highlight, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: "row",
                      marginBottom: 10,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 18,
                        color: moodColor,
                        marginRight: 12,
                        fontWeight: "600",
                      }}
                    >
                      •
                    </Text>
                    <TextInput
                      style={{
                        flex: 1,
                        borderWidth: 2,
                        borderColor: moodColor + "40",
                        borderRadius: 12,
                        padding: 14,
                        fontSize: 16,
                        backgroundColor:
                          timeOfDay === "night"
                            ? "#1e293b"
                            : "rgba(255, 255, 255, 0.9)",
                        color: theme.text,
                      }}
                      value={highlight}
                      onChangeText={(value) => updateHighlight(index, value)}
                      placeholder={`Highlight ${index + 1}`}
                      placeholderTextColor={
                        timeOfDay === "night" ? "#6b7280" : theme.text + "60"
                      }
                    />
                    {highlights.length > 1 && (
                      <TouchableOpacity
                        style={{
                          marginLeft: 10,
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: "#ef444440",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        onPress={() => removeHighlight(index)}
                      >
                        <Text
                          style={{
                            fontSize: 18,
                            color: "#ef4444",
                            fontWeight: "600",
                          }}
                        >
                          ×
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>

              {/* Weather */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 18,
                    color: theme.text,
                    marginBottom: 12,
                    fontWeight: "600",
                    letterSpacing: 0.5,
                  }}
                >
                  🌤️ Weather
                </Text>
                <TextInput
                  style={{
                    borderWidth: 2,
                    borderColor: moodColor + "60",
                    borderRadius: 16,
                    padding: 18,
                    fontSize: 17,
                    backgroundColor:
                      timeOfDay === "night"
                        ? "#1e293b"
                        : "rgba(255, 255, 255, 0.9)",
                    color: theme.text,
                    fontWeight: "500",
                  }}
                  value={weather}
                  onChangeText={setWeather}
                  placeholder="How was the weather that day?"
                  placeholderTextColor={
                    timeOfDay === "night" ? "#6b7280" : theme.text + "60"
                  }
                />
              </View>

              {/* Favorite Moment */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 18,
                    color: theme.text,
                    marginBottom: 12,
                    fontWeight: "600",
                    letterSpacing: 0.5,
                  }}
                >
                  💫 Favorite Moment
                </Text>
                <TextInput
                  style={{
                    borderWidth: 2,
                    borderColor: moodColor + "60",
                    borderRadius: 16,
                    padding: 18,
                    fontSize: 17,
                    backgroundColor:
                      timeOfDay === "night"
                        ? "#1e293b"
                        : "rgba(255, 255, 255, 0.9)",
                    color: theme.text,
                    minHeight: 100,
                    textAlignVertical: "top",
                    lineHeight: 24,
                    fontStyle: "italic",
                  }}
                  value={favoriteMoment}
                  onChangeText={setFavoriteMoment}
                  placeholder="What was your favorite moment from this date?"
                  placeholderTextColor={
                    timeOfDay === "night" ? "#6b7280" : theme.text + "60"
                  }
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
                      color: theme.text,
                      fontWeight: "600",
                      letterSpacing: 0.5,
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
                      backgroundColor: moodColor,
                    }}
                  >
                    <Text
                      style={{
                        color: timeOfDay === "night" ? "#fff" : "#1a1a2e",
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
                        <Image
                          source={photo}
                          style={{
                            width: 120,
                            height: 120,
                            borderRadius: 12,
                            borderWidth: 2,
                            borderColor: moodColor,
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
                      borderColor: moodColor + "60",
                      borderStyle: "dashed",
                      borderRadius: 16,
                      padding: 24,
                      backgroundColor:
                        timeOfDay === "night"
                          ? "#1e293b"
                          : "rgba(255, 255, 255, 0.9)",
                      alignItems: "center",
                      minHeight: 120,
                      justifyContent: "center",
                    }}
                    onPress={pickImage}
                  >
                    <Text
                      style={{
                        fontSize: 32,
                        color: moodColor + "80",
                        marginBottom: 12,
                      }}
                    >
                      📷
                    </Text>
                    <Text
                      style={{
                        color: theme.text,
                        fontSize: 17,
                        fontWeight: "500",
                      }}
                    >
                      Tap to add photos
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Immersive Detail View */}
      <Modal
        visible={isDetailVisible}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        {selectedDate && (
          <DateDetailView
            dateEntry={selectedDate}
            onClose={() => setIsDetailVisible(false)}
            onEdit={() => {
              setIsDetailVisible(false);
              setTimeout(() => openModal(selectedDate), 300);
            }}
          />
        )}
      </Modal>

      {/* Android Date Picker - Must be at root level for native dialog */}
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
