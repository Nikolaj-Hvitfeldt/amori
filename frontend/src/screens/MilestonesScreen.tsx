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
  StyleSheet,
} from "react-native";
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
import { getThumbnailUrl } from "../utils/imageUtils";

// Milestone type configurations
const MILESTONE_CONFIG: Record<
  MilestoneType,
  { icon: string; label: string; color: string; gradient: string[] }
> = {
  met: {
    icon: "👋",
    label: "We Met",
    color: "#FF6B9D",
    gradient: ["#FF6B9D", "#FF8E9D", "#FFB3C1"],
  },
  first_date: {
    icon: "🌹",
    label: "First Date",
    color: "#FF69B4",
    gradient: ["#FF69B4", "#FF8EC8", "#FFB3DC"],
  },
  official: {
    icon: "💕",
    label: "Became Official",
    color: "#FF1493",
    gradient: ["#FF1493", "#FF6EC7", "#FFB3E6"],
  },
  moved_in: {
    icon: "🏠",
    label: "Moved In Together",
    color: "#C71585",
    gradient: ["#C71585", "#DA70D6", "#EE82EE"],
  },
  engagement: {
    icon: "💍",
    label: "Engagement",
    color: "#BA55D3",
    gradient: ["#BA55D3", "#DDA0DD", "#E6E6FA"],
  },
  wedding: {
    icon: "💒",
    label: "Wedding",
    color: "#9370DB",
    gradient: ["#9370DB", "#B19CD9", "#D8BFD8"],
  },
  kid: {
    icon: "👶",
    label: "Kid",
    color: "#FFB6C1",
    gradient: ["#FFB6C1", "#FFC0CB", "#FFD1DC"],
  },
  custom: {
    icon: "⭐",
    label: "Custom Milestone",
    color: "#FFD700",
    gradient: ["#FFD700", "#FFE44D", "#FFF59D"],
  },
};

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
    // On web, only return boxShadow to avoid React Native Web warnings
    return {
      boxShadow: `${shadowOffset.width}px ${shadowOffset.height}px ${shadowRadius}px 0px ${color}`,
    } as any;
  }
  // On native platforms, use shadow props
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
  if (Platform.OS === "web") {
    return {
      textShadow: `${textShadowOffset.width}px ${textShadowOffset.height}px ${textShadowRadius}px ${textShadowColor}`,
    };
  }
  return {
    textShadowColor,
    textShadowOffset,
    textShadowRadius,
  };
};

export default function MilestonesScreen() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(
    null
  );
  const [loading, setLoading] = useState(false);
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
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadMilestones();
  }, []);

  const loadMilestones = async (skipCleanup: boolean = false) => {
    try {
      setLoading(true);
      // Reset failed images state on reload
      setFailedImages(new Set());
      const fetchedMilestones = await milestonesService.getAll();
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
      setMilestones(
        cleanedMilestones.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      );
    } catch (error) {
      console.error("Error loading milestones:", error);
      Alert.alert("Error", "Failed to load milestones");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMilestoneType("met");
    setTitle("");
    setDate("");
    setDatePickerValue(new Date());
    setDescription("");
    setPhotos([]);
    setEditingMilestone(null);
    setShowDatePicker(false);
    setWebDateInput("");
  };

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

  const openModal = (milestone?: Milestone) => {
    if (milestone) {
      setEditingMilestone(milestone);
      setMilestoneType(milestone.milestone_type);
      setTitle(milestone.title);
      setDate(milestone.date);
      const parsedDate = new Date(milestone.date);
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
      loadMilestones(true);
    } catch (error) {
      console.error("Error saving milestone:", error);
      Alert.alert("Error", "Failed to save milestone");
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    Alert.alert(
      "Delete Milestone",
      "Are you sure you want to delete this milestone?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await milestonesService.delete(id);
              loadMilestones();
            } catch (error) {
              console.error("Error deleting milestone:", error);
              Alert.alert("Error", "Failed to delete milestone");
            }
          },
        },
      ]
    );
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

  const formatDate = (dateString: string): string => {
    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) return "";

    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const calculateDaysSince = (dateString: string): number => {
    const milestoneDate = new Date(dateString);
    const today = new Date();
    const diffTime = today.getTime() - milestoneDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const milestoneConfig = MILESTONE_CONFIG[milestoneType];
  const milestoneColor = milestoneConfig.color;

  return (
    <View style={{ flex: 1, backgroundColor: "#1a0f00" }}>
      {/* Elegant Header */}
      <View
        style={{
          paddingTop: 60,
          paddingBottom: 20,
          paddingHorizontal: 20,
          backgroundColor: "#2d1810",
          borderBottomWidth: 1,
          borderBottomColor: "#ffd70030",
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "300",
            color: "#ffd700",
            textAlign: "center",
            letterSpacing: 2,
            fontFamily: Platform.select({ ios: "Georgia", android: "serif" }),
          }}
        >
          Our Milestones
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: "#ffb84d",
            textAlign: "center",
            marginTop: 5,
            fontStyle: "italic",
            letterSpacing: 1,
          }}
        >
          Moments that shine forever
        </Text>
      </View>

      <ScrollView style={{ flex: 1, padding: 20 }}>
        {milestones.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 100,
            }}
          >
            <Text style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>
              ⭐
            </Text>
            <Text
              style={{
                fontSize: 18,
                color: "#8b7355",
                textAlign: "center",
                fontStyle: "italic",
                lineHeight: 24,
              }}
            >
              No milestones recorded yet.{"\n"}
              Start documenting your journey together!
            </Text>
          </View>
        ) : (
          <View>
            {milestones.map((milestone, index) => {
              const config = MILESTONE_CONFIG[milestone.milestone_type];
              const daysSince = calculateDaysSince(milestone.date);
              const milestonePhotos = filterValidPhotos(milestone.photos || []);

              return (
                <TouchableOpacity
                  key={milestone.id}
                  style={{
                    backgroundColor: "#2d1810",
                    borderRadius: 24,
                    padding: 24,
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: "#ffd70040",
                    ...getBoxShadow(
                      "#ffd700",
                      { width: 0, height: 4 },
                      0.3,
                      12
                    ),
                    elevation: 5,
                    overflow: "hidden",
                    position: "relative",
                  }}
                  onPress={() => openModal(milestone)}
                  onLongPress={() => handleDeleteMilestone(milestone.id)}
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

                  {(() => {
                    // Filter out images that failed to load
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
                                backgroundColor: "#1a0f00", // Prevent white flash
                              }}
                              resizeMode="cover"
                              onError={(error) => {
                                console.warn(
                                  "Failed to load image on card:",
                                  photo,
                                  error
                                );
                                // Only mark as failed if it's actually a bad URL
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
            })}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={{
          position: "absolute",
          bottom: 30,
          right: 30,
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: "#ffd700",
          alignItems: "center",
          justifyContent: "center",
          ...getBoxShadow("#ffd700", { width: 0, height: 6 }, 0.5, 16),
          elevation: 10,
          borderWidth: 2,
          borderColor: "#ffed4e",
        }}
        onPress={() => openModal()}
      >
        <Text style={{ fontSize: 32, color: "#1a0f00", fontWeight: "600" }}>
          ⭐
        </Text>
      </TouchableOpacity>

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
                backgroundColor: "#2d1810",
                borderBottomWidth: 1,
                borderBottomColor: "#ffd70030",
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
                    borderColor: "#ffd70040",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 20,
                      color: "#ffd700",
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
                    color: "#ffd700",
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
                    color: "#ffd700",
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
                              color: isSelected ? "#1a0f00" : config.color,
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
                    color: "#ffd700",
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
                    backgroundColor: "#2d1810",
                    color: "#ffd700",
                    fontWeight: "500",
                  }}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Enter milestone title..."
                  placeholderTextColor="#8b7355"
                />
              </View>

              {/* Date Picker */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 18,
                    color: "#ffd700",
                    marginBottom: 12,
                    fontWeight: "600",
                  }}
                >
                  📅 Date *
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (Platform.OS === "web") {
                      if (!showDatePicker) {
                        const initialValue =
                          date && datePickerValue
                            ? formatDateForDisplay(datePickerValue)
                            : "";
                        setWebDateInput(initialValue);
                      }
                    }
                    setShowDatePicker(!showDatePicker);
                  }}
                  style={{
                    borderWidth: 2,
                    borderColor: milestoneColor + "60",
                    borderRadius: 16,
                    padding: 18,
                    backgroundColor: "#2d1810",
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

                {showDatePicker && Platform.OS === "ios" && (
                  <View
                    style={{
                      marginTop: 16,
                      padding: 20,
                      backgroundColor: "#2d1810",
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
                          color: "#ffd700",
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

                {showDatePicker && Platform.OS === "web" && (
                  <View
                    style={{
                      marginTop: 16,
                      padding: 20,
                      backgroundColor: "#FFF",
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: milestoneColor + "60",
                    }}
                  >
                    <TextInput
                      value={webDateInput}
                      onChangeText={(text) => {
                        let cleaned = text.replace(/[^\d-]/g, "");
                        cleaned = cleaned.replace(/-+/g, "-");
                        if (cleaned.startsWith("-")) cleaned = cleaned.slice(1);

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

                        const parts = formatted.split("-");
                        if (
                          parts.length === 3 &&
                          parts[0].length === 2 &&
                          parts[1].length === 2 &&
                          parts[2].length === 4
                        ) {
                          const day = parseInt(parts[0], 10);
                          const month = parseInt(parts[1], 10) - 1;
                          const year = parseInt(parts[2], 10);

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
                      style={{
                        borderWidth: 2,
                        borderColor: milestoneColor + "60",
                        borderRadius: 12,
                        padding: 12,
                        fontSize: 16,
                        backgroundColor: "#1a0f00",
                        color: "#ffd700",
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => {
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
                        backgroundColor: milestoneColor,
                        alignSelf: "flex-end",
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
                )}
              </View>

              {/* Description */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 18,
                    color: "#ffd700",
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
                    backgroundColor: "#2d1810",
                    color: "#d4a574",
                    minHeight: 120,
                    textAlignVertical: "top",
                    lineHeight: 24,
                  }}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe this milestone..."
                  placeholderTextColor="#8b7355"
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
                      color: "#ffd700",
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
                        <Image
                          source={{ uri: photo }}
                          style={{
                            width: 120,
                            height: 120,
                            borderRadius: 12,
                            borderWidth: 2,
                            borderColor: milestoneColor,
                          }}
                          resizeMode="cover"
                          onError={(error) => {
                            console.warn("Failed to load image:", photo, error);
                            // Don't remove photo on error - just log it
                            // Photo might be valid but temporarily unavailable
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
                      borderColor: milestoneColor + "60",
                      borderStyle: "dashed",
                      borderRadius: 16,
                      padding: 24,
                      backgroundColor: "#2d1810",
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
                        color: "#8b7355",
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
