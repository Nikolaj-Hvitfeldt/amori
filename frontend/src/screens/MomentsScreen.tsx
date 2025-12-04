import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import DateTimePicker from "@react-native-community/datetimepicker";
import { momentsService } from "../services/moments";
import { Moment, CreateMomentDto } from "../types/moments";
import { API_BASE_URL } from "../services/api";
import MomentDetailView from "../components/MomentDetailView";
import MomentCard from "../components/MomentCard";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import LoadingMore from "../components/common/LoadingMore";
import { getThumbnailUrl } from "../utils/imageUtils";
import { getBoxShadow } from "../utils/shadows";
import {
  MOMENT_COLOR,
  MOMENT_BG,
  MOMENT_TEXT,
  MOMENT_GRADIENT,
} from "../constants/theme";
import { ITEMS_PER_PAGE } from "../constants/spacing";

export default function MomentsScreen() {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [selectedMoment, setSelectedMoment] = useState<Moment | null>(null);
  const [editingMoment, setEditingMoment] = useState<Moment | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [storyDate, setStoryDate] = useState("");
  const [datePickerValue, setDatePickerValue] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [webDateInput, setWebDateInput] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadMoments();
  }, []);

  const loadMoments = async (reset: boolean = true) => {
    try {
      if (reset) {
        setLoading(true);
        setMoments([]);
      } else {
        setLoadingMore(true);
      }

      const offset = reset ? 0 : moments.length;
      const result = await momentsService.getAllMoments(ITEMS_PER_PAGE, offset);

      // Safety check: ensure result and result.data exist
      if (!result || !result.data || !Array.isArray(result.data)) {
        console.error("Invalid API response:", result);
        throw new Error("Invalid response from server");
      }

      const sortedMoments = result.data.sort(
        (a, b) =>
          new Date(b.story_date).getTime() - new Date(a.story_date).getTime()
      );

      if (reset) {
        setMoments(sortedMoments);
        setHasMore(sortedMoments.length < (result.total || 0));
      } else {
        setMoments((prev) => {
          // Deduplicate by ID to prevent duplicate keys
          const existingIds = new Set(prev.map((m) => m.id));
          const uniqueNewMoments = sortedMoments.filter(
            (m) => m.id && !existingIds.has(m.id)
          );
          const newMoments = [...prev, ...uniqueNewMoments];
          setHasMore(newMoments.length < (result.total || 0));
          return newMoments;
        });
      }

      setTotal(result.total || 0);
    } catch (error) {
      console.error("Error loading moments:", error);
      Alert.alert("Error", "Failed to load your moments");
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

  const resetForm = useCallback(() => {
    setTitle("");
    setStoryDate("");
    setDatePickerValue(new Date());
    setDescription("");
    setPhotos([]);
    setEditingMoment(null);
    setShowDatePicker(false);
    setWebDateInput("");
  }, []);

  const filterValidPhotos = (photoUrls: string[]): string[] => {
    return photoUrls.filter(
      (url) =>
        url &&
        typeof url === "string" &&
        (url.startsWith("http://") || url.startsWith("https://"))
    );
  };

  const handleSaveMoment = async () => {
    if (!storyDate || !description || !title.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    try {
      const validPhotos = filterValidPhotos(photos);
      const momentData: CreateMomentDto = {
        title: title.trim(),
        story_date: storyDate,
        description,
        photos: validPhotos.length > 0 ? validPhotos : [],
      };

      if (editingMoment) {
        await momentsService.updateMoment(editingMoment.id!, momentData);
      } else {
        await momentsService.createMoment(momentData);
      }

      closeModal();
      await loadMoments();
    } catch (error) {
      console.error("Error saving moment:", error);
      Alert.alert("Error", "Failed to save moment");
    }
  };

  const openModal = useCallback(
    (moment?: Moment) => {
      if (moment) {
        setEditingMoment(moment);
        setTitle(moment.title);
        setStoryDate(moment.story_date);
        const parsedDate = new Date(moment.story_date);
        setDatePickerValue(
          isNaN(parsedDate.getTime()) ? new Date() : parsedDate
        );
        setDescription(moment.description || "");
        setPhotos(filterValidPhotos(moment.photos || []));
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
    },
    [fadeAnim]
  );

  const closeModal = () => {
    setIsModalVisible(false);
    setTimeout(resetForm, 300);
  };

  const handleViewMoment = useCallback((moment: Moment) => {
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
                  const matches = dataUrl.match(
                    /^data:([A-Za-z-+\/]+);base64,(.+)$/
                  );
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
                const matches = dataUrl.match(
                  /^data:([A-Za-z-+\/]+);base64,(.+)$/
                );
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
        const response = await fetch(`${API_BASE_URL}/moments/upload-image`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image: `data:${mimeType};base64,${base64}`,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Upload failed:", response.status, errorText);
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.url;
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
        const permissionResult =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
          Alert.alert(
            "Permission Required",
            "Permission to access camera roll is required!"
          );
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
          const uploadPromises = result.assets.map((asset) =>
            uploadImage(asset.uri)
          );
          const uploadedUrls = await Promise.all(uploadPromises);

          // Use functional update to avoid stale closure
          setPhotos((prevPhotos) => [...prevPhotos, ...uploadedUrls]);
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

  const removePhoto = (indexToRemove: number) => {
    const newPhotos = photos.filter((_, index) => index !== indexToRemove);
    setPhotos(newPhotos);
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
      setStoryDate(formattedDate);
    } else if (event.type === "dismissed") {
      setShowDatePicker(false);
    }
  };

  const handleDeleteMoment = async (id: string, title: string) => {
    Alert.alert(
      "Delete Moment",
      `Are you sure you want to delete "${title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await momentsService.deleteMoment(id);
              closeModal();
              loadMoments();
            } catch (error) {
              console.error("Error deleting moment:", error);
              Alert.alert("Error", "Failed to delete moment");
            }
          },
        },
      ]
    );
  };

  const renderMoment = useCallback(
    ({ item: moment }: { item: Moment }) => {
      return (
        <MomentCard
          key={moment.id}
          moment={moment}
          onPress={() => handleViewMoment(moment)}
          onLongPress={() => openModal(moment)}
          variant="screen"
        />
      );
    },
    [handleViewMoment, openModal]
  );

  if (loading) {
    return (
      <LoadingState
        message="Loading your moments..."
        color={MOMENT_COLOR}
        backgroundColor={MOMENT_BG}
      />
    );
  }

  const renderEmpty = () => (
    <EmptyState
      icon="💕"
      title="No special moments yet"
      message="Capture your first moment to begin!"
      backgroundColor={MOMENT_BG}
    />
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return <LoadingMore color={MOMENT_COLOR} />;
  };

  return (
    <View style={{ flex: 1, backgroundColor: MOMENT_BG }}>
      <FlatList
        data={moments}
        renderItem={renderMoment}
        keyExtractor={(item, index) => item.id || `moment-${index}`}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={{ paddingVertical: 20 }}
        showsVerticalScrollIndicator={false}
        refreshing={loading && moments.length === 0}
        onRefresh={() => loadMoments(true)}
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
          backgroundColor: MOMENT_COLOR,
          alignItems: "center",
          justifyContent: "center",
          ...getBoxShadow(MOMENT_COLOR, { width: 0, height: 6 }, 0.5, 16),
          elevation: 10,
          borderWidth: 2,
          borderColor: "#FF8E9D",
        }}
        onPress={() => openModal()}
      >
        <Text style={{ fontSize: 32, color: "white", fontWeight: "600" }}>
          💕
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
              backgroundColor: MOMENT_BG,
              opacity: fadeAnim,
            }}
          >
            {/* Header */}
            <View
              style={{
                paddingTop: Platform.OS === "ios" ? 60 : 40,
                paddingBottom: 20,
                paddingHorizontal: 20,
                backgroundColor: MOMENT_GRADIENT[0] + "40",
                borderBottomWidth: 1,
                borderBottomColor: MOMENT_GRADIENT[0] + "60",
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
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 20,
                      color: MOMENT_TEXT,
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
                    color: MOMENT_TEXT,
                    letterSpacing: 1,
                    fontFamily: Platform.select({
                      ios: "Georgia",
                      android: "serif",
                    }),
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
                    backgroundColor: MOMENT_COLOR,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: "#fff",
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
                        source={{ uri: getThumbnailUrl(photo) }}
                        style={{
                          width: 120,
                          height: 120,
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor: MOMENT_COLOR + "60",
                        }}
                        resizeMode="cover"
                        onError={(error) => {
                          console.warn("Failed to load image:", photo, error);
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
              )}
            </View>

            <ScrollView
              style={{ flex: 1, padding: 20, backgroundColor: MOMENT_BG }}
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Heart Badge Preview */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  alignSelf: "flex-start",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: MOMENT_COLOR + "40",
                  marginBottom: 24,
                }}
              >
                <Text style={{ fontSize: 20, marginRight: 8 }}>💕</Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: MOMENT_COLOR,
                  }}
                >
                  Special Moment
                </Text>
              </View>

              {/* Title Input */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 18,
                    color: MOMENT_TEXT,
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
                    borderColor: MOMENT_COLOR + "60",
                    borderRadius: 16,
                    padding: 18,
                    fontSize: 17,
                    backgroundColor: "#1e293b",
                    color: MOMENT_TEXT,
                    fontWeight: "500",
                  }}
                  placeholder="Give this moment a memorable title..."
                  placeholderTextColor={MOMENT_TEXT + "60"}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              {/* Date Picker */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 18,
                    color: MOMENT_TEXT,
                    marginBottom: 12,
                    fontWeight: "600",
                    letterSpacing: 0.5,
                  }}
                >
                  📅 Date *
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (Platform.OS === "web") {
                      if (!showDatePicker) {
                        const initialValue =
                          storyDate && datePickerValue
                            ? formatDateForDisplay(datePickerValue)
                            : "";
                        setWebDateInput(initialValue);
                      }
                    }
                    setShowDatePicker(!showDatePicker);
                  }}
                  style={{
                    borderWidth: 2,
                    borderColor: MOMENT_COLOR + "60",
                    borderRadius: 16,
                    padding: 18,
                    backgroundColor: "#1e293b",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 17,
                      color: storyDate ? MOMENT_TEXT : MOMENT_TEXT + "60",
                      fontWeight: "500",
                    }}
                  >
                    {storyDate && datePickerValue
                      ? formatDateForDisplay(datePickerValue)
                      : "Select a date"}
                  </Text>
                  <Text style={{ fontSize: 20, color: MOMENT_COLOR }}>📅</Text>
                </TouchableOpacity>

                {/* Date Picker - Inline for iOS */}
                {showDatePicker && Platform.OS === "ios" && (
                  <View
                    style={{
                      marginTop: 16,
                      padding: 20,
                      backgroundColor: "#1e293b",
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: MOMENT_COLOR + "60",
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
                          color: MOMENT_TEXT,
                        }}
                      >
                        Select Date
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          const formattedDate =
                            formatDateForDatabase(datePickerValue);
                          setStoryDate(formattedDate);
                          setShowDatePicker(false);
                        }}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 20,
                          backgroundColor: MOMENT_COLOR,
                        }}
                      >
                        <Text
                          style={{
                            color: "#fff",
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
                      textColor={MOMENT_TEXT}
                    />
                  </View>
                )}

                {/* Web Date Picker - Use TextInput with European date format */}
                {showDatePicker && Platform.OS === "web" && (
                  <View
                    style={{
                      marginTop: 16,
                      padding: 20,
                      backgroundColor: "#1e293b",
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: MOMENT_COLOR + "60",
                    }}
                  >
                    <TextInput
                      value={webDateInput}
                      onChangeText={(text) => {
                        let cleaned = text.replace(/[^\d-]/g, "");
                        if (cleaned.length <= 2) {
                          setWebDateInput(cleaned);
                        } else if (cleaned.length <= 5) {
                          if (cleaned.length === 3 && !cleaned.includes("-")) {
                            cleaned =
                              cleaned.slice(0, 2) + "-" + cleaned.slice(2);
                          }
                          setWebDateInput(cleaned);
                        } else {
                          if (
                            cleaned.length === 6 &&
                            cleaned.split("-").length === 2
                          ) {
                            cleaned =
                              cleaned.slice(0, 5) + "-" + cleaned.slice(5);
                          }
                          cleaned = cleaned.slice(0, 10);
                          setWebDateInput(cleaned);
                        }

                        if (cleaned.length === 10) {
                          const [day, month, year] = cleaned.split("-");
                          if (day && month && year) {
                            const dateObj = new Date(
                              parseInt(year),
                              parseInt(month) - 1,
                              parseInt(day)
                            );
                            if (!isNaN(dateObj.getTime())) {
                              setDatePickerValue(dateObj);
                              setStoryDate(formatDateForDatabase(dateObj));
                            }
                          }
                        }
                      }}
                      placeholder="dd-mm-yyyy"
                      keyboardType="numeric"
                      maxLength={10}
                      style={{
                        borderWidth: 2,
                        borderColor: MOMENT_COLOR + "60",
                        borderRadius: 12,
                        padding: 12,
                        fontSize: 16,
                        backgroundColor: "#0f172a",
                        color: MOMENT_TEXT,
                        textAlign: "center",
                      }}
                      placeholderTextColor={MOMENT_TEXT + "60"}
                    />
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(false)}
                      style={{
                        marginTop: 12,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor: MOMENT_COLOR,
                        alignSelf: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: "#fff",
                          fontWeight: "600",
                        }}
                      >
                        Done
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

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

              {/* Description */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 18,
                    color: MOMENT_TEXT,
                    marginBottom: 12,
                    fontWeight: "600",
                    letterSpacing: 0.5,
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
                    backgroundColor: "#1e293b",
                    color: MOMENT_TEXT,
                    minHeight: 120,
                    textAlignVertical: "top",
                    lineHeight: 24,
                  }}
                  placeholder="Describe this special moment..."
                  placeholderTextColor={MOMENT_TEXT + "60"}
                  value={description}
                  onChangeText={setDescription}
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
                      color: MOMENT_TEXT,
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

                {photos.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 12, paddingVertical: 8 }}
                  >
                    {photos.map((photo, index) => (
                      <View key={index} style={{ position: "relative" }}>
                        <Image
                          source={{ uri: getThumbnailUrl(photo) }}
                          style={{
                            width: 120,
                            height: 120,
                            borderRadius: 12,
                            borderWidth: 2,
                            borderColor: MOMENT_COLOR,
                          }}
                          resizeMode="cover"
                          onError={(error) => {
                            console.warn("Failed to load image:", photo, error);
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
                      borderColor: MOMENT_COLOR + "60",
                      borderStyle: "dashed",
                      borderRadius: 16,
                      padding: 24,
                      backgroundColor: "#1e293b",
                      alignItems: "center",
                      minHeight: 120,
                      justifyContent: "center",
                    }}
                    onPress={pickImage}
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
                        color: MOMENT_TEXT + "80",
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
                    handleDeleteMoment(editingMoment.id, editingMoment.title)
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
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Detail View Modal */}
      <Modal
        visible={isDetailVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsDetailVisible(false)}
      >
        {selectedMoment && (
          <MomentDetailView
            moment={selectedMoment}
            onClose={() => setIsDetailVisible(false)}
            onEdit={() => {
              setIsDetailVisible(false);
              setTimeout(() => openModal(selectedMoment), 300);
            }}
          />
        )}
      </Modal>
    </View>
  );
}
