import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Animated,
  Dimensions,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import DateTimePicker from "@react-native-community/datetimepicker";
import { DateEntry, CreateDateEntryDto, DateMood } from "../types/dates";
import { datesService } from "../services/dates";
import { API_BASE_URL } from "../services/api";
import DateDetailView from "../components/DateDetailView";
import RotatingPhotoBackground from "../components/RotatingPhotoBackground";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

// Time-based color themes (matching DateDetailView)
const TIME_THEMES: Record<TimeOfDay, { gradient: string[]; text: string; bg: string }> = {
  morning: {
    gradient: ["#FFE5B4", "#FFD89B", "#FFC65D"],
    text: "#8B4513",
    bg: "#FFF8E7",
  },
  afternoon: {
    gradient: ["#87CEEB", "#B0E0E6", "#E0F6FF"],
    text: "#1E3A5F",
    bg: "#E8F4F8",
  },
  evening: {
    gradient: ["#FFB6C1", "#FFA07A", "#FF8C69"],
    text: "#8B0000",
    bg: "#FFE8E0",
  },
  night: {
    gradient: ["#1a1a2e", "#16213e", "#0f172a"],
    text: "#e5d3ff",
    bg: "#0f172a",
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

const MOOD_OPTIONS: { value: DateMood; label: string; icon: string }[] = [
  { value: "magical", label: "Magical", icon: "✨" },
  { value: "romantic", label: "Romantic", icon: "💕" },
  { value: "adventurous", label: "Adventurous", icon: "🌟" },
  { value: "cozy", label: "Cozy", icon: "🕯️" },
  { value: "spontaneous", label: "Spontaneous", icon: "🎈" },
  { value: "dreamy", label: "Dreamy", icon: "🌙" },
];

export default function DatesScreen() {
  const [dates, setDates] = useState<DateEntry[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<DateEntry | null>(null);
  const [editingDate, setEditingDate] = useState<DateEntry | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [datePickerValue, setDatePickerValue] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
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

  const loadDates = async () => {
    try {
      setLoading(true);
      const fetchedDates = await datesService.getAll();
      setDates(
        fetchedDates.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      );
    } catch (error) {
      console.error("Error loading dates:", error);
      Alert.alert("Error", "Failed to load dates");
    } finally {
      setLoading(false);
    }
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
  };

  // Helper function to filter out invalid/blob URLs
  const filterValidPhotos = (photoUrls: string[]): string[] => {
    return photoUrls.filter((url) => {
      // Only keep URLs that start with http:// or https:// (valid web URLs)
      // Filter out blob: URLs and other invalid formats
      return url && typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://"));
    });
  };

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
      // Filter out blob URLs and invalid URLs
      const allPhotos = dateEntry.photos && dateEntry.photos.length > 0
        ? dateEntry.photos
        : dateEntry.image_url
        ? [dateEntry.image_url]
        : [];
      setPhotos(filterValidPhotos(allPhotos));
    } else {
      resetForm();
    }
    setIsModalVisible(true);
    // Animate fade in
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const formatDateForDisplay = (dateString: string | Date): string => {
    const dateObj = typeof dateString === "string" ? new Date(dateString) : dateString;
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

      const dateData: CreateDateEntryDto = {
        title: title.trim() || undefined,
        date,
        location,
        description,
        mood,
        highlights: filteredHighlights,
        weather: weather || undefined,
        favorite_moment: favoriteMoment || undefined,
        photos: validPhotos.length > 0 ? validPhotos : undefined,
      };

      if (editingDate) {
        await datesService.update(editingDate.id, dateData);
      } else {
        await datesService.create(dateData);
      }

      closeModal();
      loadDates();
    } catch (error) {
      console.error("Error saving date:", error);
      Alert.alert("Error", "Failed to save date entry");
    }
  };

  const handleDeleteDate = async (id: string) => {
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
      // Read image as base64 using expo-file-system (legacy API)
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Determine mime type from file extension
      const extension = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeTypes: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
      };
      const mimeType = mimeTypes[extension] || 'image/jpeg';
      const base64data = `data:${mimeType};base64,${base64}`;
      
      // Upload to backend
      const uploadResponse = await fetch(`${API_BASE_URL}/dates/upload-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: base64data }),
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Failed to upload image: ${errorText}`);
      }

      const { url } = await uploadResponse.json();
      return url;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        setLoading(true);
        // Upload all selected images
        const uploadPromises = result.assets.map((asset) => uploadImage(asset.uri));
        const uploadedUrls = await Promise.all(uploadPromises);
        setPhotos([...photos, ...uploadedUrls]);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error picking/uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
      setLoading(false);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
  };

  const formatDate = (dateString: string): string => {
    // European format: dd-mm-yyyy
    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) return "";
    
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const getMoodInfo = (moodValue: DateMood) => {
    return (
      MOOD_OPTIONS.find((option) => option.value === moodValue) ||
      MOOD_OPTIONS[1]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#1a1a2e" }}>
      {/* Elegant Header */}
      <View
        style={{
          paddingTop: 60,
          paddingBottom: 20,
          paddingHorizontal: 20,
          backgroundColor: "linear-gradient(135deg, #16213e 0%, #0f172a 100%)",
          borderBottomWidth: 1,
          borderBottomColor: "#e5d3ff20",
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "300",
            color: "#e5d3ff",
            textAlign: "center",
            letterSpacing: 2,
            fontFamily: Platform.select({ ios: "Georgia", android: "serif" }),
          }}
        >
          Our Dates
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: "#a78bfa",
            textAlign: "center",
            marginTop: 5,
            fontStyle: "italic",
            letterSpacing: 1,
          }}
        >
          Step back through time
        </Text>
      </View>

      <ScrollView style={{ flex: 1, padding: 20 }}>
        {dates.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 100,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                color: "#6b7280",
                textAlign: "center",
                fontStyle: "italic",
                lineHeight: 24,
              }}
            >
              No special dates recorded yet.{"\n"}
              Create your first memory to begin the journey.
            </Text>
          </View>
        ) : (
          dates.map((dateEntry) => {
            const moodInfo = getMoodInfo(dateEntry.mood);
            // Get photos array (support both photos and legacy image_url)
            // Filter out blob URLs and invalid URLs
            const allDatePhotos =
              dateEntry.photos && dateEntry.photos.length > 0
                ? dateEntry.photos
                : dateEntry.image_url
                ? [dateEntry.image_url]
                : [];
            const datePhotos = filterValidPhotos(allDatePhotos);

            return (
              <TouchableOpacity
                key={dateEntry.id}
                style={{
                  backgroundColor: "#0f172a",
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: "#374151",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 5,
                  overflow: "hidden",
                  position: "relative",
                }}
                onPress={() => {
                  setSelectedDate(dateEntry);
                  setIsDetailVisible(true);
                }}
                onLongPress={() => handleDeleteDate(dateEntry.id)}
              >
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
                {/* Content with relative positioning to appear above background */}
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
                      {/* Title */}
                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: "600",
                          color: datePhotos.length > 0 ? "#ffffff" : "#e5d3ff",
                          marginBottom: 4,
                          textShadowColor: "rgba(0, 0, 0, 0.75)",
                          textShadowOffset: { width: 0, height: 1 },
                          textShadowRadius: 3,
                        }}
                      >
                        {dateEntry.title || "Our Special Date"}
                      </Text>
                      {/* Date below title - italic small font */}
                      <Text
                        style={{
                          fontSize: 12,
                          fontStyle: "italic",
                          color: datePhotos.length > 0 ? "#f3f4f6" : "#9ca3af",
                          marginBottom: 8,
                          textShadowColor: "rgba(0, 0, 0, 0.75)",
                          textShadowOffset: { width: 0, height: 1 },
                          textShadowRadius: 3,
                        }}
                      >
                        {formatDate(dateEntry.date)}
                      </Text>
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <Text style={{ fontSize: 20, marginRight: 8 }}>
                          {moodInfo.icon}
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            color: datePhotos.length > 0 ? "#ffffff" : "#a78bfa",
                            fontWeight: "500",
                            textShadowColor: "rgba(0, 0, 0, 0.75)",
                            textShadowOffset: { width: 0, height: 1 },
                            textShadowRadius: 3,
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
                      textShadowColor: "rgba(0, 0, 0, 0.75)",
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 3,
                    }}
                  >
                    📍 {dateEntry.location}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={{
          position: "absolute",
          bottom: 30,
          right: 30,
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: "#7c3aed",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#7c3aed",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 8,
        }}
        onPress={() => openModal()}
      >
        <Text style={{ fontSize: 28, color: "white" }}>+</Text>
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
                backgroundColor: timeOfDay === "night" ? "#16213e" : theme.gradient[0] + "40",
                borderBottomWidth: 1,
                borderBottomColor: timeOfDay === "night" ? "#374151" : theme.gradient[0] + "60",
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
                    backgroundColor: timeOfDay === "night" ? "rgba(0, 0, 0, 0.5)" : "rgba(255, 255, 255, 0.3)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 20, color: theme.text, fontWeight: "600" }}>✕</Text>
                </TouchableOpacity>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "300",
                    color: theme.text,
                    letterSpacing: 1,
                    fontFamily: Platform.select({ ios: "Georgia", android: "serif" }),
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
                        source={{ uri: photo }}
                        style={{
                          width: 120,
                          height: 120,
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor: moodColor + "60",
                        }}
                        resizeMode="cover"
                        onError={(error) => {
                          console.warn("Failed to load image:", photo, error);
                          // Remove invalid image from the array
                          removePhoto(index);
                        }}
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
                        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
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
                <Text style={{ fontSize: 16, fontWeight: "600", color: moodColor }}>
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
                    backgroundColor: timeOfDay === "night" ? "#1e293b" : "rgba(255, 255, 255, 0.9)",
                    color: theme.text,
                    fontWeight: "500",
                  }}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Give this date a memorable title..."
                  placeholderTextColor={timeOfDay === "night" ? "#6b7280" : theme.text + "60"}
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
                    console.log("Date picker button pressed, showDatePicker:", showDatePicker);
                    setShowDatePicker(!showDatePicker);
                  }}
                  style={{
                    borderWidth: 2,
                    borderColor: moodColor + "60",
                    borderRadius: 16,
                    padding: 18,
                    backgroundColor: timeOfDay === "night" ? "#1e293b" : "rgba(255, 255, 255, 0.9)",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 17,
                      color: date ? theme.text : (timeOfDay === "night" ? "#6b7280" : theme.text + "60"),
                      fontWeight: "500",
                    }}
                  >
                    {date ? formatDateForDisplay(datePickerValue) : "Select a date"}
                  </Text>
                  <Text style={{ fontSize: 20, color: moodColor }}>📅</Text>
                </TouchableOpacity>

                {/* Date Picker - Inline for iOS */}
                {showDatePicker && Platform.OS === "ios" && (
                  <View
                    style={{
                      marginTop: 16,
                      padding: 20,
                      backgroundColor: timeOfDay === "night" ? "#1e293b" : "rgba(255, 255, 255, 0.9)",
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
                          const formattedDate = formatDateForDatabase(datePickerValue);
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
                      backgroundColor: timeOfDay === "night" ? "#1e293b" : "rgba(255, 255, 255, 0.9)",
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: moodColor + "60",
                    }}
                  >
                    <TextInput
                      value={date ? formatDateForDisplay(datePickerValue) : ""}
                      onChangeText={(text) => {
                        // Parse European format (dd-mm-yyyy) to Date object
                        const parts = text.split("-");
                        if (parts.length === 3) {
                          const day = parseInt(parts[0], 10);
                          const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
                          const year = parseInt(parts[2], 10);
                          const parsedDate = new Date(year, month, day);
                          if (!isNaN(parsedDate.getTime())) {
                            setDatePickerValue(parsedDate);
                            const formattedDate = formatDateForDatabase(parsedDate);
                            setDate(formattedDate);
                          }
                        }
                      }}
                      placeholder="dd-mm-yyyy"
                      style={{
                        borderWidth: 2,
                        borderColor: moodColor + "60",
                        borderRadius: 12,
                        padding: 12,
                        fontSize: 16,
                        backgroundColor: timeOfDay === "night" ? "#0f172a" : "#ffffff",
                        color: theme.text,
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(false)}
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
                    backgroundColor: timeOfDay === "night" ? "#1e293b" : "rgba(255, 255, 255, 0.9)",
                    color: theme.text,
                    fontWeight: "500",
                  }}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Where did this beautiful date take place?"
                  placeholderTextColor={timeOfDay === "night" ? "#6b7280" : theme.text + "60"}
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
                          borderColor: isSelected ? "transparent" : optionColor + "40",
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
                    backgroundColor: timeOfDay === "night" ? "#1e293b" : "rgba(255, 255, 255, 0.9)",
                    color: theme.text,
                    minHeight: 120,
                    textAlignVertical: "top",
                    lineHeight: 24,
                  }}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe this special date..."
                  placeholderTextColor={timeOfDay === "night" ? "#6b7280" : theme.text + "60"}
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
                        backgroundColor: timeOfDay === "night" ? "#1e293b" : "rgba(255, 255, 255, 0.9)",
                        color: theme.text,
                      }}
                      value={highlight}
                      onChangeText={(value) => updateHighlight(index, value)}
                      placeholder={`Highlight ${index + 1}`}
                      placeholderTextColor={timeOfDay === "night" ? "#6b7280" : theme.text + "60"}
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
                        <Text style={{ fontSize: 18, color: "#ef4444", fontWeight: "600" }}>
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
                    backgroundColor: timeOfDay === "night" ? "#1e293b" : "rgba(255, 255, 255, 0.9)",
                    color: theme.text,
                    fontWeight: "500",
                  }}
                  value={weather}
                  onChangeText={setWeather}
                  placeholder="How was the weather that day?"
                  placeholderTextColor={timeOfDay === "night" ? "#6b7280" : theme.text + "60"}
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
                    backgroundColor: timeOfDay === "night" ? "#1e293b" : "rgba(255, 255, 255, 0.9)",
                    color: theme.text,
                    minHeight: 100,
                    textAlignVertical: "top",
                    lineHeight: 24,
                    fontStyle: "italic",
                  }}
                  value={favoriteMoment}
                  onChangeText={setFavoriteMoment}
                  placeholder="What was your favorite moment from this date?"
                  placeholderTextColor={timeOfDay === "night" ? "#6b7280" : theme.text + "60"}
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
                          source={{ uri: photo }}
                          style={{
                            width: 120,
                            height: 120,
                            borderRadius: 12,
                            borderWidth: 2,
                            borderColor: moodColor,
                          }}
                          resizeMode="cover"
                          onError={(error) => {
                            console.warn("Failed to load image:", photo, error);
                            // Remove invalid image from the array
                            removePhoto(index);
                          }}
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
