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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { momentsService, Moment, CreateMomentDto } from "../services/moments";

export default function StoriesScreen() {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Moment | null>(null);
  const [editingStory, setEditingStory] = useState<Moment | null>(null);

  const [newStory, setNewStory] = useState<CreateMomentDto>({
    title: "",
    story_date: "",
    description: "",
  });

  useEffect(() => {
    loadMoments();
  }, []);

  const loadMoments = async () => {
    try {
      setLoading(true);
      const stories = await momentsService.getAllMoments();
      setMoments(stories);
    } catch (error) {
      console.error("Error loading moments:", error);
      Alert.alert("Error", "Failed to load your moments");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStory = async () => {
    if (
      !newStory.title.trim() ||
      !newStory.story_date.trim() ||
      !newStory.description.trim()
    ) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      if (editingStory) {
        // Update existing story
        await momentsService.updateMoment(editingStory.id!, {
          title: newStory.title,
          story_date: newStory.story_date,
          description: newStory.description,
          photos: newStory.photos,
        });
        Alert.alert("Success", "Love story updated successfully!");
      } else {
        // Create new story
        await momentsService.createMoment(newStory);
        Alert.alert("Success", "Love story added successfully!");
      }

      setNewStory({ title: "", story_date: "", description: "" });
      setEditingStory(null);
      setModalVisible(false);
      loadMoments();
    } catch (error) {
      console.error("Error saving love story:", error);
      Alert.alert(
        "Error",
        editingStory
          ? "Failed to update love story"
          : "Failed to create love story"
      );
    }
  };

  const handleEditStory = (story: Moment) => {
    setEditingStory(story);
    setNewStory({
      title: story.title,
      story_date: story.story_date,
      description: story.description,
      photos: story.photos,
    });
    setModalVisible(true);
  };

  const handleAddNewStory = () => {
    setEditingStory(null);
    setNewStory({ title: "", story_date: "", description: "" });
    setModalVisible(true);
  };

  const handleViewStory = (story: Moment) => {
    setSelectedStory(story);
    setDetailsModalVisible(true);
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

      if (!result.canceled && result.assets) {
        const newPhotos = result.assets.map((asset) => asset.uri);
        const currentPhotos = newStory.photos || [];
        setNewStory({
          ...newStory,
          photos: [...currentPhotos, ...newPhotos],
        });
      }
    } catch (error) {
      console.error("Error picking images:", error);
      Alert.alert("Error", "Failed to pick images");
    }
  };

  const removePhoto = (indexToRemove: number) => {
    const updatedPhotos = (newStory.photos || []).filter(
      (_, index) => index !== indexToRemove
    );
    setNewStory({ ...newStory, photos: updatedPhotos });
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
            setEditingStory(null);
            setNewStory({ title: "", story_date: "", description: "" });
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
        <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10 }}>
          Our Special Moments 💕
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
              onPress={() => handleViewStory(story)}
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
                    handleEditStory(story);
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
              {story.photos && story.photos.length > 0 && (
                <View
                  style={{
                    flexDirection: "row",
                    marginTop: 10,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 14, color: "#666", marginRight: 5 }}>
                    📸
                  </Text>
                  <Text style={{ fontSize: 14, color: "#666" }}>
                    {story.photos.length} photo
                    {story.photos.length > 1 ? "s" : ""}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}

        {/* Add New Story Button - moved to bottom */}
        <TouchableOpacity
          onPress={handleAddNewStory}
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
              maxHeight: "80%",
              shadowColor: "#f8a5c2",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 12,
              borderWidth: 1,
              borderColor: "#f8d7da",
            }}
          >
            <View style={{ alignItems: "center", marginBottom: 24 }}>
              <Text style={{ fontSize: 16, color: "#d498a3", marginBottom: 4 }}>
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
                  style={{ fontSize: 20, fontWeight: "bold", color: "#8b4a6b" }}
                >
                  {editingStory
                    ? "Edit This Moment"
                    : "Capture a Special Moment"}
                </Text>
              </Text>
              <Text style={{ fontSize: 16, color: "#d498a3", marginTop: 4 }}>
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
              value={newStory.title}
              onChangeText={(text) => setNewStory({ ...newStory, title: text })}
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
                    newStory.story_date || today.toISOString().split("T")[0];

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
                          setNewStory({
                            ...newStory,
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
                          setNewStory({
                            ...newStory,
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
                <Text style={{ color: "#fff", fontSize: 12, marginRight: 6 }}>
                  📅
                </Text>
                <Text
                  style={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}
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
                  color: newStory.story_date ? "#8b4a6b" : "#d498a3",
                  fontStyle: newStory.story_date ? "normal" : "italic",
                }}
              >
                {newStory.story_date
                  ? `💕 ${formatDateForDisplay(newStory.story_date)}`
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
              value={newStory.description}
              onChangeText={(text) =>
                setNewStory({ ...newStory, description: text })
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
                  style={{ fontSize: 16, color: "#8b4a6b", fontWeight: "600" }}
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
                    style={{ color: "#fff", fontSize: 11, fontWeight: "bold" }}
                  >
                    ✨ Add
                  </Text>
                </TouchableOpacity>
              </View>

              {newStory.photos && newStory.photos.length > 0 ? (
                <View style={{ maxHeight: 100 }}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 10 }}
                  >
                    {newStory.photos.map((photo, index) => (
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
                  <Text style={{ fontSize: 24, marginBottom: 4 }}>✨</Text>
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
              )}
            </View>

            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setEditingStory(null);
                  setNewStory({ title: "", story_date: "", description: "" });
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

              {editingStory && (
                <TouchableOpacity
                  onPress={() =>
                    editingStory.id &&
                    handleDeleteStory(editingStory.id, editingStory.title)
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
                    style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}
                  >
                    💔 Delete
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleSaveStory}
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
                  style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}
                >
                  {editingStory ? "💕 Update Story" : "💖 Save Story"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Story Details Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={detailsModalVisible}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
          {selectedStory && (
            <>
              {/* Header */}
              <View
                style={{
                  backgroundColor: "#fff",
                  paddingTop: 50,
                  paddingBottom: 15,
                  paddingHorizontal: 20,
                  borderBottomWidth: 1,
                  borderBottomColor: "#e0e0e0",
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
                      padding: 8,
                      borderRadius: 20,
                      backgroundColor: "#f0f0f0",
                    }}
                  >
                    <Text style={{ fontSize: 16, color: "#666" }}>✕</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setDetailsModalVisible(false);
                      handleEditStory(selectedStory);
                    }}
                    style={{
                      backgroundColor: "#4834d4",
                      paddingHorizontal: 15,
                      paddingVertical: 8,
                      borderRadius: 20,
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 14,
                        fontWeight: "bold",
                      }}
                    >
                      Edit
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "bold",
                    marginBottom: 5,
                  }}
                >
                  {selectedStory.title}
                </Text>
                <Text style={{ fontSize: 16, color: "#666" }}>
                  {formatDate(selectedStory.story_date)}
                </Text>
              </View>

              {/* Content */}
              <ScrollView style={{ flex: 1 }}>
                {/* Photos Section */}
                {selectedStory.photos && selectedStory.photos.length > 0 && (
                  <View style={{ marginBottom: 20 }}>
                    <FlatList
                      data={selectedStory.photos}
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      keyExtractor={(item, index) => index.toString()}
                      renderItem={({ item }) => (
                        <View
                          style={{
                            width: Dimensions.get("window").width,
                            height: 300,
                            backgroundColor: "#000",
                          }}
                        >
                          <Image
                            source={{ uri: item }}
                            style={{
                              width: "100%",
                              height: "100%",
                            }}
                            resizeMode="contain"
                          />
                        </View>
                      )}
                    />

                    {selectedStory.photos.length > 1 && (
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "center",
                          marginTop: 10,
                        }}
                      >
                        {selectedStory.photos.map((_, index) => (
                          <View
                            key={index}
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: "#ddd",
                              marginHorizontal: 2,
                            }}
                          />
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {/* Description Section */}
                <View style={{ padding: 20 }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "bold",
                      marginBottom: 10,
                      color: "#333",
                    }}
                  >
                    Our Story
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      lineHeight: 24,
                      color: "#555",
                    }}
                  >
                    {selectedStory.description}
                  </Text>
                </View>

                {/* Metadata */}
                <View
                  style={{
                    backgroundColor: "#fff",
                    margin: 20,
                    padding: 15,
                    borderRadius: 10,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: "#666",
                      marginBottom: 5,
                    }}
                  >
                    Created: {formatDate(selectedStory.created_at || "")}
                  </Text>
                  {selectedStory.updated_at &&
                    selectedStory.updated_at !== selectedStory.created_at && (
                      <Text
                        style={{
                          fontSize: 14,
                          color: "#666",
                        }}
                      >
                        Last updated: {formatDate(selectedStory.updated_at)}
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
