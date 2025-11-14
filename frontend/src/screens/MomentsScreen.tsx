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
  Animated,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { momentsService, Moment, CreateMomentDto } from "../services/moments";

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
    return {
      boxShadow: `${shadowOffset.width}px ${shadowOffset.height}px ${shadowRadius}px 0px ${color}`,
    } as any;
  }
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

// Pink/romantic theme color
const MOMENT_COLOR = "#FF6B9D";
const MOMENT_BG_DARK = "#2a0f1a";
const MOMENT_BG_LIGHT = "#3d1528";

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
      if (editingMoment) {
        // Update existing moment
        await momentsService.updateMoment(editingMoment.id!, {
          title: newMoment.title,
          story_date: newMoment.story_date,
          description: newMoment.description,
          photos: newMoment.photos,
        });
        Alert.alert("Success", "Love story updated successfully!");
      } else {
        // Create new moment
        await momentsService.createMoment(newMoment);
        Alert.alert("Success", "Love story added successfully!");
      }

      setNewMoment({ title: "", story_date: "", description: "" });
      setEditingMoment(null);
      setModalVisible(false);
      loadMoments();
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
      photos: story.photos,
    });
    setModalVisible(true);
  };

  const handleAddnewMoment = () => {
    setEditingMoment(null);
    setNewMoment({ title: "", story_date: "", description: "" });
    setModalVisible(true);
  };

  const handleViewMoment = (story: Moment) => {
    setSelectedMoment(story);
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
        const currentPhotos = newMoment.photos || [];
        setNewMoment({
          ...newMoment,
          photos: [...currentPhotos, ...newPhotos],
        });
      }
    } catch (error) {
      console.error("Error picking images:", error);
      Alert.alert("Error", "Failed to pick images");
    }
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
          backgroundColor: "#FFF0E6",
        }}
      >
        <Text style={{ fontSize: 48, marginBottom: 16 }}>💕</Text>
        <Text style={{ fontSize: 18, color: "#999" }}>
          Loading your moments...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF0E6" }}>
      {/* Elegant Header */}
      <View
        style={{
          paddingTop: 60,
          paddingBottom: 20,
          paddingHorizontal: 20,
          backgroundColor: "#FF6B9D",
          borderBottomWidth: 1,
          borderBottomColor: "#FEC7D7",
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "300",
            color: "#FFF",
            textAlign: "center",
            letterSpacing: 2,
            fontFamily: Platform.select({ ios: "Georgia", android: "serif" }),
          }}
        >
          Our Moments
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: "#FFE5F0",
            textAlign: "center",
            marginTop: 5,
            fontStyle: "italic",
            letterSpacing: 1,
          }}
        >
          Little love notes that last forever
        </Text>
      </View>

      <ScrollView style={{ flex: 1, padding: 20 }}>
        {moments.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 100,
            }}
          >
            <Text style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>
              💕
            </Text>
            <Text
              style={{
                fontSize: 18,
                color: "#999",
                textAlign: "center",
                fontStyle: "italic",
                lineHeight: 24,
              }}
            >
              No special moments yet.{"\n"}
              Capture your first moment to begin!
            </Text>
          </View>
        ) : (
          moments.map((story) => {
            const storyPhotos = story.photos || [];
            const hasPhotos = storyPhotos.length > 0;

            return (
              <TouchableOpacity
                key={story.id}
                onPress={() => handleViewMoment(story)}
                onLongPress={() => handleEditMoment(story)}
                style={{
                  backgroundColor: "#FFF",
                  borderRadius: 24,
                  padding: 24,
                  marginBottom: 20,
                  borderWidth: 1,
                  borderColor: MOMENT_COLOR + "40",
                  ...getBoxShadow(
                    MOMENT_COLOR,
                    { width: 0, height: 4 },
                    0.3,
                    12
                  ),
                  elevation: 5,
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {/* Decorative heart accent */}
                <View
                  style={{
                    position: "absolute",
                    top: -10,
                    right: -10,
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: MOMENT_COLOR + "15",
                    opacity: 0.5,
                  }}
                />

                <View style={{ position: "relative", zIndex: 1 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 12,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: "600",
                          color: "#333",
                          marginBottom: 6,
                        }}
                      >
                        {story.title}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#999",
                          fontStyle: "italic",
                          marginBottom: 8,
                        }}
                      >
                        {formatDate(story.story_date)}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={{
                      fontSize: 15,
                      color: "#666",
                      lineHeight: 22,
                      marginBottom: hasPhotos ? 16 : 0,
                    }}
                    numberOfLines={3}
                  >
                    {story.description}
                  </Text>

                  {hasPhotos && (
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
                      {storyPhotos.map((photo, photoIndex) => (
                        <Image
                          key={photoIndex}
                          source={{ uri: photo }}
                          style={{
                            width: 100,
                            height: 100,
                            borderRadius: 16,
                            borderWidth: 2,
                            borderColor: MOMENT_COLOR + "60",
                          }}
                          resizeMode="cover"
                        />
                      ))}
                    </ScrollView>
                  )}
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
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: MOMENT_COLOR,
          alignItems: "center",
          justifyContent: "center",
          ...getBoxShadow(MOMENT_COLOR, { width: 0, height: 6 }, 0.5, 16),
          elevation: 10,
          borderWidth: 2,
          borderColor: "#FF8E9D",
        }}
        onPress={handleAddnewMoment}
      >
        <Text style={{ fontSize: 32, color: "white", fontWeight: "600" }}>
          💕
        </Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        presentationStyle="fullScreen"
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
              backgroundColor: "#FFF0E6",
            }}
          >
            {/* Header */}
            <View
              style={{
                paddingTop: Platform.OS === "ios" ? 60 : 40,
                paddingBottom: 20,
                paddingHorizontal: 20,
                backgroundColor: "#FF6B9D",
                borderBottomWidth: 1,
                borderBottomColor: "#FEC7D7",
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
                  onPress={() => setModalVisible(false)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "rgba(255, 255, 255, 0.3)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{ fontSize: 20, color: "#FFF", fontWeight: "600" }}
                  >
                    ✕
                  </Text>
                </TouchableOpacity>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "600",
                    color: "#FFF",
                  }}
                >
                  {editingMoment ? "Edit Moment" : "New Moment"}
                </Text>
                <TouchableOpacity
                  onPress={handleSaveMoment}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: "#FFF",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: "#FF6B9D",
                      fontWeight: "600",
                    }}
                  >
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              style={{ flex: 1, padding: 20 }}
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Title Input */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 18,
                    color: "#333",
                    marginBottom: 12,
                    fontWeight: "600",
                  }}
                >
                  💕 Title *
                </Text>
                <TextInput
                  style={{
                    borderWidth: 2,
                    borderColor: MOMENT_COLOR + "60",
                    borderRadius: 16,
                    padding: 18,
                    fontSize: 17,
                    backgroundColor: "#FFF",
                    color: "#333",
                    fontWeight: "500",
                  }}
                  placeholder="Give this moment a name..."
                  placeholderTextColor="#999"
                  value={newMoment.title}
                  onChangeText={(text) =>
                    setNewMoment({ ...newMoment, title: text })
                  }
                />
              </View>

              {/* Date Picker */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 18,
                    color: "#333",
                    marginBottom: 12,
                    fontWeight: "600",
                  }}
                >
                  💕 Date *
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    const today = new Date();
                    const currentDate =
                      newMoment.story_date || today.toISOString().split("T")[0];

                    Alert.alert(
                      "Select Date",
                      "Choose when this beautiful moment happened:",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Use Today",
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
                          text: "Custom Date",
                          onPress: () => {
                            const todayFormatted = new Date()
                              .toISOString()
                              .split("T")[0];
                            setNewMoment({
                              ...newMoment,
                              story_date: todayFormatted,
                            });
                            Alert.alert(
                              "Date Set",
                              "Date set to today. We'll add a proper date picker in the next update!"
                            );
                          },
                        },
                      ]
                    );
                  }}
                  style={{
                    borderWidth: 2,
                    borderColor: MOMENT_COLOR + "60",
                    borderRadius: 16,
                    padding: 18,
                    backgroundColor: "#FFF",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 17,
                      color: newMoment.story_date ? "#333" : "#999",
                      fontWeight: "500",
                    }}
                  >
                    {newMoment.story_date
                      ? formatDateForDisplay(newMoment.story_date)
                      : "Select a date"}
                  </Text>
                  <Text style={{ fontSize: 20, color: MOMENT_COLOR }}>📅</Text>
                </TouchableOpacity>
              </View>

              {/* Description */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 18,
                    color: "#333",
                    marginBottom: 12,
                    fontWeight: "600",
                  }}
                >
                  💕 Description *
                </Text>
                <TextInput
                  style={{
                    borderWidth: 2,
                    borderColor: MOMENT_COLOR + "60",
                    borderRadius: 16,
                    padding: 18,
                    fontSize: 17,
                    backgroundColor: "#FFF",
                    color: "#333",
                    minHeight: 120,
                    textAlignVertical: "top",
                    lineHeight: 24,
                  }}
                  placeholder="Describe this special moment..."
                  placeholderTextColor="#999"
                  value={newMoment.description}
                  onChangeText={(text) =>
                    setNewMoment({ ...newMoment, description: text })
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
                      color: "#333",
                      fontWeight: "600",
                    }}
                  >
                    💕 Photos ({newMoment.photos?.length || 0})
                  </Text>
                  <TouchableOpacity
                    onPress={pickImages}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: MOMENT_COLOR,
                    }}
                  >
                    <Text
                      style={{
                        color: "#FFF",
                        fontSize: 15,
                        fontWeight: "600",
                      }}
                    >
                      + Add Photo
                    </Text>
                  </TouchableOpacity>
                </View>

                {newMoment.photos && newMoment.photos.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 12, paddingVertical: 8 }}
                  >
                    {newMoment.photos.map((photo, index) => (
                      <View key={index} style={{ position: "relative" }}>
                        <Image
                          source={{ uri: photo }}
                          style={{
                            width: 120,
                            height: 120,
                            borderRadius: 12,
                            borderWidth: 2,
                            borderColor: MOMENT_COLOR,
                          }}
                          resizeMode="cover"
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
                      borderColor: MOMENT_COLOR + "60",
                      borderStyle: "dashed",
                      borderRadius: 16,
                      padding: 24,
                      backgroundColor: "#FFF",
                      alignItems: "center",
                      minHeight: 120,
                      justifyContent: "center",
                    }}
                    onPress={pickImages}
                  >
                    <Text
                      style={{
                        fontSize: 32,
                        color: MOMENT_COLOR + "80",
                        marginBottom: 12,
                      }}
                    >
                      📷
                    </Text>
                    <Text
                      style={{
                        color: "#666",
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
              {editingMoment && (
                <TouchableOpacity
                  onPress={() =>
                    editingMoment.id &&
                    handleDeleteStory(editingMoment.id, editingMoment.title)
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
                      color: "#FFF",
                      fontSize: 16,
                      fontWeight: "600",
                    }}
                  >
                    Delete Moment
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Story Details Modal */}
      <Modal
        animationType="slide"
        presentationStyle="fullScreen"
        visible={detailsModalVisible}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "#FFF0E6" }}>
          {selectedMoment && (
            <>
              {/* Header */}
              <View
                style={{
                  backgroundColor: "#FF6B9D",
                  paddingTop: Platform.OS === "ios" ? 60 : 40,
                  paddingBottom: 20,
                  paddingHorizontal: 20,
                  borderBottomWidth: 1,
                  borderBottomColor: "#FEC7D7",
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
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: "rgba(255, 255, 255, 0.3)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{ fontSize: 20, color: "#FFF", fontWeight: "600" }}
                    >
                      ✕
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setDetailsModalVisible(false);
                      setTimeout(() => handleEditMoment(selectedMoment), 300);
                    }}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: "#FFF",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        color: "#FF6B9D",
                        fontWeight: "600",
                      }}
                    >
                      Edit
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "300",
                    color: "#FFF",
                    textAlign: "center",
                    letterSpacing: 1,
                    fontFamily: Platform.select({
                      ios: "Georgia",
                      android: "serif",
                    }),
                  }}
                >
                  {selectedMoment.title}
                </Text>
              </View>

              <ScrollView
                style={{ flex: 1, padding: 20 }}
                contentContainerStyle={{ paddingBottom: 40 }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: "#999",
                    fontStyle: "italic",
                    marginBottom: 20,
                  }}
                >
                  {formatDate(selectedMoment.story_date)}
                </Text>

                <Text
                  style={{
                    fontSize: 17,
                    color: "#333",
                    lineHeight: 26,
                    marginBottom: 24,
                  }}
                >
                  {selectedMoment.description}
                </Text>

                {selectedMoment.photos && selectedMoment.photos.length > 0 && (
                  <View style={{ marginBottom: 20 }}>
                    <Text
                      style={{
                        fontSize: 18,
                        color: "#333",
                        fontWeight: "600",
                        marginBottom: 12,
                      }}
                    >
                      💕 Photos
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 12 }}
                    >
                      {selectedMoment.photos.map((photo, index) => (
                        <Image
                          key={index}
                          source={{ uri: photo }}
                          style={{
                            width: 200,
                            height: 200,
                            borderRadius: 16,
                            borderWidth: 2,
                            borderColor: MOMENT_COLOR + "60",
                          }}
                          resizeMode="cover"
                        />
                      ))}
                    </ScrollView>
                  </View>
                )}
              </ScrollView>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}
