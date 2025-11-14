import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Image,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import DateTimePicker from "@react-native-community/datetimepicker";
import { momentsService, Moment, CreateMomentDto } from "../services/moments";
import { API_BASE_URL } from "../services/api";
import { getThumbnailUrl } from "../utils/imageUtils";

export default function MomentsScreen() {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedMoment, setSelectedMoment] = useState<Moment | null>(null);
  const [editingMoment, setEditingMoment] = useState<Moment | null>(null);

  const [newMoment, setNewMoment] = useState<CreateMomentDto>({
    title: "",
    story_date: "",
    description: "",
  });

  useEffect(() => {
    loadMoments();
  }, []);

  const loadMoments = async (skipCleanup: boolean = false) => {
    try {
      setLoading(true);
      const stories = await momentsService.getAllMoments();
      // Filter out invalid photos from all moments
      const cleanedMoments = stories.map((moment) => {
        const originalPhotos = moment.photos || [];
        const validPhotos = filterValidPhotos(originalPhotos);

        // Only run cleanup if we're not skipping it and we actually found invalid photos
        if (
          !skipCleanup &&
          moment.id &&
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
            momentsService
              .updateMoment(moment.id, {
                // Explicitly pass empty array to clear photos, not undefined
                photos: validPhotos.length > 0 ? validPhotos : [],
              })
              .catch((err) => {
                console.warn("Failed to clean up invalid photos:", err);
              });
          }
        }
        return {
          ...moment,
          photos: validPhotos,
        };
      });
      setMoments(cleanedMoments);
    } catch (error) {
      console.error("Error loading moments:", error);
      Alert.alert("Error", "Failed to load your moments");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMoment = async () => {
    if (
      !newMoment.title.trim() ||
      !newMoment.story_date.trim() ||
      !newMoment.description.trim()
    ) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      // Filter out invalid photos before saving
      const validPhotos = filterValidPhotos(newMoment.photos || []);

      if (editingMoment) {
        // Update existing moment
        await momentsService.updateMoment(editingMoment.id!, {
          title: newMoment.title,
          story_date: newMoment.story_date,
          description: newMoment.description,
          // Explicitly pass empty array to clear photos, not undefined
          photos: validPhotos.length > 0 ? validPhotos : [],
        });
        Alert.alert("Success", "Love story updated successfully!");
      } else {
        // Create new moment
        await momentsService.createMoment({
          ...newMoment,
          // Explicitly pass empty array to clear photos, not undefined
          photos: validPhotos.length > 0 ? validPhotos : [],
        });
        Alert.alert("Success", "Love story added successfully!");
      }

      setNewMoment({ title: "", story_date: "", description: "" });
      setEditingMoment(null);
      setModalVisible(false);
      // Skip cleanup when loading after save to prevent removing just-saved photos
      loadMoments(true);
    } catch (error) {
      console.error("Error saving love story:", error);
      Alert.alert(
        "Error",
        editingMoment
          ? "Failed to update love story"
          : "Failed to create love story"
      );
    }
  };

  const handleEditMoment = (story: Moment) => {
    setEditingMoment(story);
    setNewMoment({
      title: story.title,
      story_date: story.story_date,
      description: story.description,
      // Don't filter photos when opening modal - use photos as-is from database
      // Filtering will happen on save and on load, not when editing
      photos: story.photos || [],
    });
    setModalVisible(true);
  };

  const handleAddnewMoment = () => {
    setEditingMoment(null);
    setNewMoment({ title: "", story_date: "", description: "" });
    setModalVisible(true);
  };

  const handleViewMoment = (story: Moment) => {
    // Filter invalid photos before viewing
    setSelectedMoment({
      ...story,
      photos: filterValidPhotos(story.photos || []),
    });
    setDetailsModalVisible(true);
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
        `${API_BASE_URL}/moments/upload-image`,
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

  const pickImages = async () => {
    try {
      // Request permission
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          "Permission Required",
          "Permission to access camera roll is required!"
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setLoading(true);
        try {
          const uploadPromises = result.assets.map((asset) =>
            uploadImage(asset.uri)
          );
          const uploadedUrls = await Promise.all(uploadPromises);
          const currentPhotos = newMoment.photos || [];
          setNewMoment({
            ...newMoment,
            photos: [...currentPhotos, ...uploadedUrls],
          });
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
      console.error("Error picking images:", error);
      Alert.alert("Error", "Failed to pick images");
      setLoading(false);
    }
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

  const removePhoto = (indexToRemove: number) => {
    const updatedPhotos = (newMoment.photos || []).filter(
      (_, index) => index !== indexToRemove
    );
    setNewMoment({ ...newMoment, photos: updatedPhotos });
  };

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return "Select a date";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const handleDeleteStory = async (id: string, title: string) => {
    Alert.alert("Delete Story", `Are you sure you want to delete "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await momentsService.deleteMoment(id);
            setModalVisible(false);
            setEditingMoment(null);
            setNewMoment({ title: "", story_date: "", description: "" });
            loadMoments();
            Alert.alert("Success", "Love story deleted successfully!");
          } catch (error) {
            console.error("Error deleting love story:", error);
            Alert.alert("Error", "Failed to delete love story");
          }
        },
      },
    ]);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f5f5f5",
        }}
      >
        <Text style={{ fontSize: 18 }}>Loading your moments...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      <View
        style={{
          padding: 20,
          backgroundColor: "#fff",
          borderBottomWidth: 1,
          borderBottomColor: "#e0e0e0",
        }}
      >
        <Text
          style={{
            fontSize: 20,
            color: "#d498a3",
            fontStyle: "italic",
            marginBottom: 15,
            textAlign: "center",
          }}
        >
          💖 Our Little Love Notes 💖
        </Text>
      </View>

      <ScrollView style={{ flex: 1, padding: 20 }}>
        {moments.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 50 }}>
            <Text style={{ fontSize: 16, color: "#666" }}>
              No special moments yet
            </Text>
            <Text style={{ fontSize: 14, color: "#999", marginTop: 5 }}>
              Tap "Capture a Moment" to preserve your first one!
            </Text>
          </View>
        ) : (
          moments.map((story) => (
            <TouchableOpacity
              key={story.id}
              onPress={() => handleViewMoment(story)}
              style={{
                backgroundColor: "#fff",
                padding: 15,
                marginBottom: 15,
                borderRadius: 10,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    flex: 1,
                    marginRight: 10,
                  }}
                >
                  {story.title}
                </Text>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleEditMoment(story);
                  }}
                  style={{
                    backgroundColor: "#d498a3",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 15,
                    shadowColor: "#d498a3",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                  }}
                >
                  <Text
                    style={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}
                  >
                    ✏️ Edit
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>
                {formatDate(story.story_date)}
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  lineHeight: 24,
                }}
                numberOfLines={3}
              >
                {story.description}
              </Text>
              {(() => {
                const validPhotos = filterValidPhotos(story.photos || []);
                return validPhotos.length > 0 ? (
                  <View
                    style={{
                      flexDirection: "row",
                      marginTop: 10,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{ fontSize: 14, color: "#666", marginRight: 5 }}
                    >
                      📸
                    </Text>
                    <Text style={{ fontSize: 14, color: "#666" }}>
                      {validPhotos.length} photo
                      {validPhotos.length > 1 ? "s" : ""}
                    </Text>
                  </View>
                ) : null;
              })()}
            </TouchableOpacity>
          ))
        )}

        {/* Add New Story Button - moved to bottom */}
        <TouchableOpacity
          onPress={handleAddnewMoment}
          style={{
            backgroundColor: "#f8a5c2",
            padding: 16,
            borderRadius: 16,
            alignItems: "center",
            marginTop: 20,
            marginBottom: 20,
            shadowColor: "#f8a5c2",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
            ✨ Capture a Moment 💕
          </Text>
          <Text
            style={{ color: "#fff", fontSize: 14, marginTop: 4, opacity: 0.9 }}
          >
            Preserve something special
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
          >
            <View
              style={{
                backgroundColor: "#fdf6f8",
                padding: 24,
                margin: 20,
                borderRadius: 20,
                width: "90%",
                maxWidth: 400,
                maxHeight: "85%",
                shadowColor: "#f8a5c2",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 12,
                borderWidth: 1,
                borderColor: "#f8d7da",
              }}
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                bounces={false}
              >
                <View style={{ alignItems: "center", marginBottom: 24 }}>
                  <Text
                    style={{ fontSize: 16, color: "#d498a3", marginBottom: 4 }}
                  >
                    💕✨💕
                  </Text>
                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: "bold",
                      color: "#8b4a6b",
                      textAlign: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: "bold",
                        color: "#8b4a6b",
                      }}
                    >
                      {editingMoment
                        ? "Edit This Moment"
                        : "Capture a Special Moment"}
                    </Text>
                  </Text>
                  <Text
                    style={{ fontSize: 16, color: "#d498a3", marginTop: 4 }}
                  >
                    💕✨💕
                  </Text>
                </View>

                <Text
                  style={{
                    fontSize: 16,
                    marginBottom: 8,
                    color: "#8b4a6b",
                    fontWeight: "600",
                  }}
                >
                  💖 What Made This Moment Special?
                </Text>
                <TextInput
                  style={{
                    borderWidth: 2,
                    borderColor: "#f8d7da",
                    padding: 14,
                    borderRadius: 12,
                    marginBottom: 20,
                    fontSize: 16,
                    backgroundColor: "#fff",
                    shadowColor: "#f8a5c2",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                  }}
                  placeholder="Give this moment a name... 💕"
                  placeholderTextColor="#d498a3"
                  value={newMoment.title}
                  onChangeText={(text) =>
                    setNewMoment({ ...newMoment, title: text })
                  }
                />

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      flex: 1,
                      color: "#8b4a6b",
                      fontWeight: "600",
                    }}
                  >
                    📅 When did this happen?
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      console.log("Calendar icon pressed");
                      // Simple date selection with today's date as default
                      const today = new Date();
                      const currentDate =
                        newMoment.story_date ||
                        today.toISOString().split("T")[0];

                      Alert.alert(
                        "💕 Select Date",
                        "Choose when this beautiful moment happened:",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "💖 Use Today",
                            onPress: () => {
                              const todayFormatted = new Date()
                                .toISOString()
                                .split("T")[0];
                              setNewMoment({
                                ...newMoment,
                                story_date: todayFormatted,
                              });
                            },
                          },
                          {
                            text: "✨ Custom Date",
                            onPress: () => {
                              // For now, just set to today - we can improve this later
                              const todayFormatted = new Date()
                                .toISOString()
                                .split("T")[0];
                              setNewMoment({
                                ...newMoment,
                                story_date: todayFormatted,
                              });
                              Alert.alert(
                                "💕 Date Set",
                                "Date set to today. We'll add a proper date picker in the next update!"
                              );
                            },
                          },
                        ]
                      );
                    }}
                    style={{
                      backgroundColor: "#f8a5c2",
                      padding: 10,
                      borderRadius: 20,
                      flexDirection: "row",
                      alignItems: "center",
                      shadowColor: "#f8a5c2",
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.3,
                      shadowRadius: 6,
                    }}
                  >
                    <Text
                      style={{ color: "#fff", fontSize: 12, marginRight: 6 }}
                    >
                      📅
                    </Text>
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: "bold",
                      }}
                    >
                      Select
                    </Text>
                  </TouchableOpacity>
                </View>

                <View
                  style={{
                    borderWidth: 2,
                    borderColor: "#f8d7da",
                    padding: 16,
                    borderRadius: 12,
                    marginBottom: 20,
                    backgroundColor: "#fff",
                    minHeight: 50,
                    justifyContent: "center",
                    shadowColor: "#f8a5c2",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: newMoment.story_date ? "#8b4a6b" : "#d498a3",
                      fontStyle: newMoment.story_date ? "normal" : "italic",
                    }}
                  >
                    {newMoment.story_date
                      ? `💕 ${formatDateForDisplay(newMoment.story_date)}`
                      : "Tap 'Select' to choose your special date 💖"}
                  </Text>
                </View>

                <Text
                  style={{
                    fontSize: 16,
                    marginBottom: 8,
                    color: "#8b4a6b",
                    fontWeight: "600",
                  }}
                >
                  💝 Describe This Moment
                </Text>
                <TextInput
                  style={{
                    borderWidth: 2,
                    borderColor: "#f8d7da",
                    padding: 16,
                    borderRadius: 12,
                    marginBottom: 24,
                    fontSize: 16,
                    height: 120,
                    textAlignVertical: "top",
                    backgroundColor: "#fff",
                    shadowColor: "#f8a5c2",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                  }}
                  placeholder="What happened? How did it feel? What made it special? 💕✨"
                  placeholderTextColor="#d498a3"
                  value={newMoment.description}
                  onChangeText={(text) =>
                    setNewMoment({ ...newMoment, description: text })
                  }
                  multiline={true}
                />

                {/* Photos Section */}
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
                        fontSize: 16,
                        color: "#8b4a6b",
                        fontWeight: "600",
                      }}
                    >
                      📸 Capture the Memory
                    </Text>
                    <TouchableOpacity
                      onPress={pickImages}
                      style={{
                        backgroundColor: "#f8a5c2",
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 15,
                        shadowColor: "#f8a5c2",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                      }}
                    >
                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 11,
                          fontWeight: "bold",
                        }}
                      >
                        ✨ Add
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {(() => {
                    // Don't filter photos in edit modal - show all photos as-is
                    const displayPhotos = newMoment.photos || [];
                    return displayPhotos.length > 0 ? (
                      <View style={{ maxHeight: 100 }}>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={{ paddingRight: 10 }}
                        >
                          {displayPhotos.map((photo, index) => (
                            <View
                              key={index}
                              style={{
                                marginRight: 8,
                                position: "relative",
                              }}
                            >
                              <Image
                                source={{ uri: photo }}
                                style={{
                                  width: 60,
                                  height: 60,
                                  borderRadius: 6,
                                  backgroundColor: "#f0f0f0",
                                }}
                                resizeMode="cover"
                                onError={(e) => {
                                  console.warn(
                                    "Failed to load image:",
                                    photo,
                                    e
                                  );
                                }}
                              />
                              <TouchableOpacity
                                onPress={() => removePhoto(index)}
                                style={{
                                  position: "absolute",
                                  top: -4,
                                  right: -4,
                                  backgroundColor: "#ff6b9d",
                                  borderRadius: 8,
                                  width: 16,
                                  height: 16,
                                  justifyContent: "center",
                                  alignItems: "center",
                                }}
                              >
                                <Text
                                  style={{
                                    color: "#fff",
                                    fontSize: 10,
                                    fontWeight: "bold",
                                  }}
                                >
                                  ×
                                </Text>
                              </TouchableOpacity>
                            </View>
                          ))}
                        </ScrollView>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={pickImages}
                        style={{
                          borderWidth: 2,
                          borderColor: "#f8a5c2",
                          borderStyle: "dashed",
                          borderRadius: 12,
                          padding: 16,
                          alignItems: "center",
                          backgroundColor: "#fdf6f8",
                          maxHeight: 80,
                          justifyContent: "center",
                        }}
                      >
                        <Text style={{ fontSize: 24, marginBottom: 4 }}>
                          ✨
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#8b4a6b",
                            textAlign: "center",
                            fontWeight: "600",
                          }}
                        >
                          Add photos from camera roll
                        </Text>
                      </TouchableOpacity>
                    );
                  })()}
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <TouchableOpacity
                    onPress={() => {
                      setModalVisible(false);
                      setEditingMoment(null);
                      setNewMoment({
                        title: "",
                        story_date: "",
                        description: "",
                      });
                    }}
                    style={{
                      backgroundColor: "#f0f0f0",
                      padding: 14,
                      borderRadius: 25,
                      flex: 1,
                      marginRight: 12,
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: "#e0e0e0",
                    }}
                  >
                    <Text
                      style={{ fontSize: 16, color: "#666", fontWeight: "600" }}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  {editingMoment && (
                    <TouchableOpacity
                      onPress={() =>
                        editingMoment.id &&
                        handleDeleteStory(editingMoment.id, editingMoment.title)
                      }
                      style={{
                        backgroundColor: "#ff6b9d",
                        padding: 14,
                        borderRadius: 25,
                        flex: 1,
                        marginRight: 12,
                        alignItems: "center",
                        shadowColor: "#ff6b9d",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 16,
                          fontWeight: "bold",
                        }}
                      >
                        💔 Delete
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={handleSaveMoment}
                    style={{
                      backgroundColor: "#f8a5c2",
                      padding: 14,
                      borderRadius: 25,
                      flex: 1,
                      alignItems: "center",
                      shadowColor: "#f8a5c2",
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.4,
                      shadowRadius: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 16,
                        fontWeight: "bold",
                      }}
                    >
                      {editingMoment ? "💕 Update Story" : "💖 Save Story"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Story Details Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={detailsModalVisible}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "#fdf6f8" }}>
          {selectedMoment && (
            <>
              {/* Header */}
              <View
                style={{
                  backgroundColor: "#fff",
                  paddingTop: 50,
                  paddingBottom: 20,
                  paddingHorizontal: 20,
                  borderBottomWidth: 2,
                  borderBottomColor: "#f8d7da",
                  shadowColor: "#f8a5c2",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => setDetailsModalVisible(false)}
                    style={{
                      padding: 10,
                      borderRadius: 25,
                      backgroundColor: "#f8d7da",
                      shadowColor: "#f8a5c2",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        color: "#8b4a6b",
                        fontWeight: "bold",
                      }}
                    >
                      ✕
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setDetailsModalVisible(false);
                      handleEditMoment(selectedMoment);
                    }}
                    style={{
                      backgroundColor: "#f8a5c2",
                      paddingHorizontal: 20,
                      paddingVertical: 10,
                      borderRadius: 25,
                      shadowColor: "#f8a5c2",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.4,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 14,
                        fontWeight: "bold",
                      }}
                    >
                      💕 Edit
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text
                  style={{
                    fontSize: 26,
                    fontWeight: "bold",
                    marginBottom: 8,
                    color: "#8b4a6b",
                    textAlign: "center",
                  }}
                >
                  💖 {selectedMoment.title}
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    color: "#d498a3",
                    textAlign: "center",
                    fontWeight: "600",
                    fontStyle: "italic",
                  }}
                >
                  ✨ {formatDate(selectedMoment.story_date)} ✨
                </Text>
              </View>

              {/* Content */}
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Photos Section */}
                {(() => {
                  const displayPhotos = selectedMoment.photos || [];
                  return displayPhotos.length > 0 ? (
                    <View style={{ marginBottom: 30, marginTop: 10 }}>
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: "600",
                          color: "#8b4a6b",
                          textAlign: "center",
                          marginBottom: 15,
                        }}
                      >
                        📸 Our Photos 📸
                      </Text>
                      <FlatList
                        data={displayPhotos}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => (
                          <View
                            style={{
                              width: Dimensions.get("window").width,
                              height: 300,
                              backgroundColor: "#f8d7da",
                              borderRadius: 12,
                              overflow: "hidden",
                              marginHorizontal: 5,
                            }}
                          >
                            <Image
                              source={{ uri: item }}
                              style={{
                                width: "100%",
                                height: "100%",
                              }}
                              resizeMode="contain"
                              onError={(e) => {
                                console.warn(
                                  "Failed to load image in detail view:",
                                  item,
                                  e
                                );
                              }}
                            />
                          </View>
                        )}
                      />

                      {displayPhotos.length > 1 && (
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "center",
                            marginTop: 15,
                          }}
                        >
                          {displayPhotos.map((_, index) => (
                            <View
                              key={index}
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: 5,
                                backgroundColor: "#f8a5c2",
                                marginHorizontal: 4,
                                shadowColor: "#f8a5c2",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.3,
                                shadowRadius: 3,
                                elevation: 2,
                              }}
                            />
                          ))}
                        </View>
                      )}
                    </View>
                  ) : null;
                })()}

                {/* Description Section */}
                <View
                  style={{
                    padding: 24,
                    marginHorizontal: 16,
                    backgroundColor: "#fff",
                    borderRadius: 20,
                    shadowColor: "#f8a5c2",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                    elevation: 4,
                    borderWidth: 1,
                    borderColor: "#f8d7da",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "bold",
                      marginBottom: 15,
                      color: "#8b4a6b",
                      textAlign: "center",
                    }}
                  >
                    💝 Our Story 💝
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      lineHeight: 26,
                      color: "#5d5d5d",
                      textAlign: "center",
                      fontStyle: "italic",
                    }}
                  >
                    "{selectedMoment.description}"
                  </Text>
                </View>

                {/* Metadata */}
                <View
                  style={{
                    backgroundColor: "#fdf6f8",
                    margin: 16,
                    marginTop: 20,
                    padding: 20,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: "#f8d7da",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: "#d498a3",
                      marginBottom: 8,
                      fontWeight: "600",
                    }}
                  >
                    ✨ Captured: {formatDate(selectedMoment.created_at || "")}
                  </Text>
                  {selectedMoment.updated_at &&
                    selectedMoment.updated_at !== selectedMoment.created_at && (
                      <Text
                        style={{
                          fontSize: 13,
                          color: "#d498a3",
                          fontStyle: "italic",
                        }}
                      >
                        💕 Last updated: {formatDate(selectedMoment.updated_at)}
                      </Text>
                    )}
                </View>
              </ScrollView>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}
