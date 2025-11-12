import React, { useState, useEffect } from "react";
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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { DateEntry, CreateDateEntryDto, DateMood } from "../types/dates";
import { datesService } from "../services/dates";

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
  const [editingDate, setEditingDate] = useState<DateEntry | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [mood, setMood] = useState<DateMood>("romantic");
  const [highlights, setHighlights] = useState<string[]>([""]);
  const [weather, setWeather] = useState("");
  const [favoriteMoment, setFavoriteMoment] = useState("");
  const [imageUrl, setImageUrl] = useState("");

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
    setDate("");
    setLocation("");
    setDescription("");
    setMood("romantic");
    setHighlights([""]);
    setWeather("");
    setFavoriteMoment("");
    setImageUrl("");
    setEditingDate(null);
  };

  const openModal = (dateEntry?: DateEntry) => {
    if (dateEntry) {
      setEditingDate(dateEntry);
      setDate(dateEntry.date);
      setLocation(dateEntry.location);
      setDescription(dateEntry.description);
      setMood(dateEntry.mood);
      setHighlights(
        dateEntry.highlights.length > 0 ? dateEntry.highlights : [""]
      );
      setWeather(dateEntry.weather || "");
      setFavoriteMoment(dateEntry.favorite_moment || "");
      setImageUrl(dateEntry.image_url || "");
    } else {
      resetForm();
    }
    setIsModalVisible(true);
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

      const dateData: CreateDateEntryDto = {
        date,
        location,
        description,
        mood,
        highlights: filteredHighlights,
        weather: weather || undefined,
        favorite_moment: favoriteMoment || undefined,
        image_url: imageUrl || undefined,
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

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUrl(result.assets[0].uri);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
                }}
                onPress={() => openModal(dateEntry)}
                onLongPress={() => handleDeleteDate(dateEntry.id)}
              >
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
                        fontSize: 18,
                        fontWeight: "600",
                        color: "#e5d3ff",
                        marginBottom: 4,
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
                          color: "#a78bfa",
                          fontWeight: "500",
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
                    color: "#d1d5db",
                    marginBottom: 8,
                    fontWeight: "500",
                  }}
                >
                  📍 {dateEntry.location}
                </Text>

                <Text
                  style={{
                    fontSize: 15,
                    color: "#9ca3af",
                    lineHeight: 22,
                    marginBottom: 12,
                  }}
                >
                  {dateEntry.description}
                </Text>

                {dateEntry.highlights && dateEntry.highlights.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        color: "#a78bfa",
                        marginBottom: 6,
                        fontWeight: "500",
                      }}
                    >
                      ✨ Highlights
                    </Text>
                    {dateEntry.highlights.map((highlight, index) => (
                      <Text
                        key={index}
                        style={{
                          fontSize: 14,
                          color: "#d1d5db",
                          marginLeft: 12,
                          marginBottom: 2,
                        }}
                      >
                        • {highlight}
                      </Text>
                    ))}
                  </View>
                )}

                {dateEntry.favorite_moment && (
                  <View
                    style={{
                      backgroundColor: "#1e293b40",
                      padding: 12,
                      borderRadius: 12,
                      borderLeftWidth: 3,
                      borderLeftColor: "#a78bfa",
                      marginBottom: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        color: "#a78bfa",
                        marginBottom: 4,
                        fontWeight: "500",
                      }}
                    >
                      💫 Favorite Moment
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: "#e2e8f0",
                        fontStyle: "italic",
                        lineHeight: 20,
                      }}
                    >
                      "{dateEntry.favorite_moment}"
                    </Text>
                  </View>
                )}

                {dateEntry.weather && (
                  <Text
                    style={{
                      fontSize: 14,
                      color: "#94a3b8",
                      marginTop: 4,
                    }}
                  >
                    🌤️ {dateEntry.weather}
                  </Text>
                )}

                {dateEntry.image_url && (
                  <View style={{ marginTop: 12, alignItems: "center" }}>
                    <Image
                      source={{ uri: dateEntry.image_url }}
                      style={{
                        width: 120,
                        height: 90,
                        borderRadius: 12,
                        opacity: 0.8,
                      }}
                      resizeMode="cover"
                    />
                  </View>
                )}
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

      {/* Elegant Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="formSheet"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
            <View
              style={{
                paddingTop: 60,
                paddingBottom: 20,
                paddingHorizontal: 20,
                backgroundColor: "#16213e",
                borderBottomWidth: 1,
                borderBottomColor: "#374151",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <TouchableOpacity onPress={closeModal}>
                  <Text style={{ fontSize: 16, color: "#a78bfa" }}>Cancel</Text>
                </TouchableOpacity>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "500",
                    color: "#e5d3ff",
                    letterSpacing: 1,
                  }}
                >
                  {editingDate ? "Edit Date" : "New Date"}
                </Text>
                <TouchableOpacity onPress={handleSaveDate}>
                  <Text
                    style={{
                      fontSize: 16,
                      color: "#7c3aed",
                      fontWeight: "600",
                    }}
                  >
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={{ flex: 1, padding: 20 }}>
              {/* Date Input */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 16,
                    color: "#e5d3ff",
                    marginBottom: 8,
                    fontWeight: "500",
                  }}
                >
                  Date *
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: "#374151",
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    backgroundColor: "#1e293b",
                    color: "#e2e8f0",
                  }}
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#6b7280"
                />
              </View>

              {/* Location Input */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 16,
                    color: "#e5d3ff",
                    marginBottom: 8,
                    fontWeight: "500",
                  }}
                >
                  Location *
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: "#374151",
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    backgroundColor: "#1e293b",
                    color: "#e2e8f0",
                  }}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Where did this beautiful date take place?"
                  placeholderTextColor="#6b7280"
                />
              </View>

              {/* Mood Selection */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 16,
                    color: "#e5d3ff",
                    marginBottom: 12,
                    fontWeight: "500",
                  }}
                >
                  Mood
                </Text>
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                >
                  {MOOD_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 20,
                        backgroundColor:
                          mood === option.value ? "#7c3aed" : "#374151",
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                      onPress={() => setMood(option.value)}
                    >
                      <Text style={{ fontSize: 16, marginRight: 6 }}>
                        {option.icon}
                      </Text>
                      <Text
                        style={{
                          color: mood === option.value ? "white" : "#d1d5db",
                          fontSize: 14,
                          fontWeight: mood === option.value ? "600" : "400",
                        }}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Description */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 16,
                    color: "#e5d3ff",
                    marginBottom: 8,
                    fontWeight: "500",
                  }}
                >
                  Description *
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: "#374151",
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    backgroundColor: "#1e293b",
                    color: "#e2e8f0",
                    minHeight: 100,
                    textAlignVertical: "top",
                  }}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe this special date..."
                  placeholderTextColor="#6b7280"
                  multiline
                />
              </View>

              {/* Highlights */}
              <View style={{ marginBottom: 20 }}>
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
                      color: "#e5d3ff",
                      fontWeight: "500",
                    }}
                  >
                    Highlights
                  </Text>
                  <TouchableOpacity onPress={addHighlight}>
                    <Text style={{ fontSize: 24, color: "#7c3aed" }}>+</Text>
                  </TouchableOpacity>
                </View>
                {highlights.map((highlight, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: "row",
                      marginBottom: 8,
                      alignItems: "center",
                    }}
                  >
                    <TextInput
                      style={{
                        flex: 1,
                        borderWidth: 1,
                        borderColor: "#374151",
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 15,
                        backgroundColor: "#1e293b",
                        color: "#e2e8f0",
                      }}
                      value={highlight}
                      onChangeText={(value) => updateHighlight(index, value)}
                      placeholder={`Highlight ${index + 1}`}
                      placeholderTextColor="#6b7280"
                    />
                    {highlights.length > 1 && (
                      <TouchableOpacity
                        style={{ marginLeft: 10, padding: 8 }}
                        onPress={() => removeHighlight(index)}
                      >
                        <Text style={{ fontSize: 18, color: "#ef4444" }}>
                          ×
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>

              {/* Weather */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 16,
                    color: "#e5d3ff",
                    marginBottom: 8,
                    fontWeight: "500",
                  }}
                >
                  Weather
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: "#374151",
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    backgroundColor: "#1e293b",
                    color: "#e2e8f0",
                  }}
                  value={weather}
                  onChangeText={setWeather}
                  placeholder="How was the weather that day?"
                  placeholderTextColor="#6b7280"
                />
              </View>

              {/* Favorite Moment */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 16,
                    color: "#e5d3ff",
                    marginBottom: 8,
                    fontWeight: "500",
                  }}
                >
                  Favorite Moment
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: "#374151",
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    backgroundColor: "#1e293b",
                    color: "#e2e8f0",
                    minHeight: 80,
                    textAlignVertical: "top",
                  }}
                  value={favoriteMoment}
                  onChangeText={setFavoriteMoment}
                  placeholder="What was your favorite moment from this date?"
                  placeholderTextColor="#6b7280"
                  multiline
                />
              </View>

              {/* Image */}
              <View style={{ marginBottom: 30 }}>
                <Text
                  style={{
                    fontSize: 16,
                    color: "#e5d3ff",
                    marginBottom: 8,
                    fontWeight: "500",
                  }}
                >
                  Photo
                </Text>
                <TouchableOpacity
                  style={{
                    borderWidth: 1,
                    borderColor: "#374151",
                    borderRadius: 12,
                    padding: 20,
                    backgroundColor: "#1e293b",
                    alignItems: "center",
                  }}
                  onPress={pickImage}
                >
                  {imageUrl ? (
                    <View style={{ alignItems: "center" }}>
                      <Image
                        source={{ uri: imageUrl }}
                        style={{
                          width: 100,
                          height: 100,
                          borderRadius: 8,
                          marginBottom: 8,
                        }}
                        resizeMode="cover"
                      />
                      <Text style={{ color: "#7c3aed", fontSize: 14 }}>
                        Tap to change photo
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Text
                        style={{
                          fontSize: 24,
                          color: "#6b7280",
                          marginBottom: 8,
                        }}
                      >
                        📷
                      </Text>
                      <Text style={{ color: "#a78bfa", fontSize: 16 }}>
                        Add a photo
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
