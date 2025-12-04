import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
  Platform,
} from "react-native";
import { momentsService } from "../services/moments";
import { datesService } from "../services/dates";
import { milestonesService } from "../services/milestones";
import { Moment } from "../types/moments";
import { DateEntry } from "../types/dates";
import { Milestone } from "../types/milestones";
import MomentDetailView from "../components/MomentDetailView";
import DateDetailView from "../components/DateDetailView";
import MilestoneDetailView from "../components/MilestoneDetailView";
import AnimatedPolaroid from "../components/AnimatedPolaroid";
import AnimatedCard from "../components/AnimatedCard";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const POLAROID_WIDTH = (SCREEN_WIDTH - 60) / 2;

// Photo item with source info
interface PhotoItem {
  id: string;
  url: string;
  sourceType: "moment" | "date" | "milestone";
  sourceId: string;
  sourceTitle: string;
  sourceDate: string;
  rotation: number;
  offsetX: number;
  offsetY: number;
}

// Decorative tape styles
const TAPE_STYLES = [
  { rotation: -12, color: "rgba(255, 200, 200, 0.85)" },
  { rotation: 8, color: "rgba(200, 230, 255, 0.85)" },
  { rotation: -5, color: "rgba(255, 240, 200, 0.85)" },
  { rotation: 15, color: "rgba(220, 255, 220, 0.85)" },
  { rotation: -18, color: "rgba(255, 220, 240, 0.85)" },
];

// Pin colors for variety
const PIN_COLORS = ["#e74c3c", "#3498db", "#f39c12", "#9b59b6", "#1abc9c"];

export default function PicturesScreen() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailData, setDetailData] = useState<{
    type: "moment" | "date" | "milestone";
    data: Moment | DateEntry | Milestone;
  } | null>(null);

  // Store fetched data for detail views
  const [momentsData, setMomentsData] = useState<Moment[]>([]);
  const [datesData, setDatesData] = useState<DateEntry[]>([]);
  const [milestonesData, setMilestonesData] = useState<Milestone[]>([]);

  const loadAllPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const [momentsResult, datesResult, milestonesResult] = await Promise.all([
        momentsService.getAllMoments(),
        datesService.getAll(),
        milestonesService.getAll(),
      ]);

      const moments = momentsResult.data || [];
      const dates = datesResult.data || [];
      const milestones = milestonesResult.data || [];

      setMomentsData(moments);
      setDatesData(dates);
      setMilestonesData(milestones);

      const allPhotos: PhotoItem[] = [];

      // Extract photos from moments
      moments.forEach((moment) => {
        const momentId = moment.id;
        if (!momentId) return;
        (moment.photos || []).forEach((url, index) => {
          if (url && typeof url === "string" && url.startsWith("http")) {
            allPhotos.push({
              id: `moment-${momentId}-${index}`,
              url,
              sourceType: "moment",
              sourceId: momentId,
              sourceTitle: moment.title,
              sourceDate: moment.story_date,
              rotation: (Math.random() - 0.5) * 12,
              offsetX: (Math.random() - 0.5) * 8,
              offsetY: (Math.random() - 0.5) * 8,
            });
          }
        });
      });

      // Extract photos from dates
      dates.forEach((dateEntry) => {
        const dateId = dateEntry.id;
        if (!dateId) return;
        (dateEntry.photos || []).forEach((url, index) => {
          if (url && typeof url === "string" && url.startsWith("http")) {
            allPhotos.push({
              id: `date-${dateId}-${index}`,
              url,
              sourceType: "date",
              sourceId: dateId,
              sourceTitle: dateEntry.title || dateEntry.location || "Date",
              sourceDate: dateEntry.date,
              rotation: (Math.random() - 0.5) * 12,
              offsetX: (Math.random() - 0.5) * 8,
              offsetY: (Math.random() - 0.5) * 8,
            });
          }
        });
      });

      // Extract photos from milestones
      milestones.forEach((milestone) => {
        const milestoneId = milestone.id;
        if (!milestoneId) return;
        (milestone.photos || []).forEach((url, index) => {
          if (url && typeof url === "string" && url.startsWith("http")) {
            allPhotos.push({
              id: `milestone-${milestoneId}-${index}`,
              url,
              sourceType: "milestone",
              sourceId: milestoneId,
              sourceTitle: milestone.title,
              sourceDate: milestone.date,
              rotation: (Math.random() - 0.5) * 12,
              offsetX: (Math.random() - 0.5) * 8,
              offsetY: (Math.random() - 0.5) * 8,
            });
          }
        });
      });

      // Shuffle photos for a natural feel
      const shuffled = allPhotos.sort(() => Math.random() - 0.5);
      setPhotos(shuffled);
    } catch (error) {
      console.error("Error loading photos:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllPhotos();
  }, [loadAllPhotos]);

  const handlePhotoPress = (photo: PhotoItem) => {
    setSelectedPhoto(photo);
  };

  const handleViewEntry = () => {
    if (!selectedPhoto) return;

    let data: Moment | DateEntry | Milestone | undefined;

    if (selectedPhoto.sourceType === "moment") {
      data = momentsData.find((m) => m.id === selectedPhoto.sourceId);
    } else if (selectedPhoto.sourceType === "date") {
      data = datesData.find((d) => d.id === selectedPhoto.sourceId);
    } else if (selectedPhoto.sourceType === "milestone") {
      data = milestonesData.find((m) => m.id === selectedPhoto.sourceId);
    }

    if (data) {
      setDetailData({ type: selectedPhoto.sourceType, data });
      setSelectedPhoto(null);
      setShowDetailModal(true);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getSourceIcon = (type: "moment" | "date" | "milestone") => {
    switch (type) {
      case "moment":
        return "💕";
      case "date":
        return "📅";
      case "milestone":
        return "⭐";
    }
  };

  const getSourceColor = (type: "moment" | "date" | "milestone") => {
    switch (type) {
      case "moment":
        return "#FF6B9D";
      case "date":
        return "#7c3aed";
      case "milestone":
        return "#ffd700";
    }
  };

  const renderPolaroid = (photo: PhotoItem, index: number) => {
    const tapeStyle = TAPE_STYLES[index % TAPE_STYLES.length];
    const pinColor = PIN_COLORS[index % PIN_COLORS.length];
    const usePin = index % 3 === 0;

    return (
      <AnimatedCard
        key={photo.id}
        index={index}
        animationType="fade-scale"
        staggerDelay={50}
        style={{ width: POLAROID_WIDTH }}
      >
        <AnimatedPolaroid
          width={POLAROID_WIDTH}
          initialRotation={photo.rotation}
          initialOffsetX={photo.offsetX}
          initialOffsetY={photo.offsetY}
          onTap={() => handlePhotoPress(photo)}
        >
          {/* Polaroid frame */}
          <View
            style={{
              backgroundColor: "#fefefe",
              padding: 8,
              paddingBottom: 36,
              borderRadius: 2,
            }}
          >
          {/* Photo */}
          <Image
            source={{ uri: photo.url }}
            style={{
              width: POLAROID_WIDTH - 16,
              height: POLAROID_WIDTH - 16,
              backgroundColor: "#e8e8e8",
            }}
            resizeMode="cover"
          />

          {/* Caption area */}
          <View
            style={{
              position: "absolute",
              bottom: 8,
              left: 8,
              right: 8,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontFamily: Platform.select({
                  ios: "Noteworthy-Bold",
                  android: "serif",
                  default: "cursive",
                }),
                fontSize: 11,
                color: "#555",
                textAlign: "center",
              }}
              numberOfLines={1}
            >
              {formatDate(photo.sourceDate)}
            </Text>
          </View>

          {/* Source type indicator */}
          <View
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              backgroundColor: getSourceColor(photo.sourceType),
              borderRadius: 12,
              width: 24,
              height: 24,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 2,
              elevation: 3,
            }}
          >
            <Text style={{ fontSize: 12 }}>{getSourceIcon(photo.sourceType)}</Text>
          </View>
        </View>

        {/* Decorative tape or pin */}
        {usePin ? (
          <View
            style={{
              position: "absolute",
              top: -8,
              left: "50%",
              marginLeft: -8,
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: pinColor,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 2,
              elevation: 4,
              // Pin highlight
              borderWidth: 2,
              borderColor: "rgba(255,255,255,0.4)",
            }}
          />
        ) : (
          <View
            style={{
              position: "absolute",
              top: -6,
              left: "50%",
              marginLeft: -20,
              width: 40,
              height: 14,
              backgroundColor: tapeStyle.color,
              transform: [{ rotate: `${tapeStyle.rotation}deg` }],
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 1,
              elevation: 2,
            }}
          />
        )}
        </AnimatedPolaroid>
      </AnimatedCard>
    );
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#2A1F1A",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#D4A574" />
        <Text
          style={{
            marginTop: 16,
            color: "#D4A574",
            fontSize: 16,
            fontFamily: Platform.select({ ios: "Georgia", android: "serif" }),
          }}
        >
          Gathering your memories...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#2A1F1A" }}>
      {/* Vintage photo album texture background */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#2A1F1A",
          opacity: 1,
        }}
      >
        {/* Subtle texture dots */}
        {Array.from({ length: 50 }).map((_, i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: 2 + Math.random() * 3,
              height: 2 + Math.random() * 3,
              borderRadius: 2,
              backgroundColor: `rgba(212, 165, 116, ${0.05 + Math.random() * 0.1})`,
            }}
          />
        ))}
      </View>

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 16,
          borderBottomWidth: 0,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            color: "#8B7355",
            textAlign: "center",
            fontFamily: Platform.select({ ios: "Georgia", android: "serif" }),
            letterSpacing: 0.5,
            fontStyle: "italic",
          }}
        >
          {photos.length === 0
            ? "Your story awaits..."
            : photos.length === 1
            ? "Where it all began"
            : photos.length <= 5
            ? "The first chapters of us"
            : photos.length <= 15
            ? "A growing collection of us"
            : photos.length <= 30
            ? "So many beautiful moments"
            : "A lifetime of memories together"}
        </Text>
        <Text
          style={{
            fontSize: 22,
            color: "#D4A574",
            textAlign: "center",
            fontFamily: Platform.select({ ios: "Georgia", android: "serif" }),
            letterSpacing: 1,
            marginTop: 4,
          }}
        >
          {photos.length > 0 && `✦ ${photos.length} ✦`}
        </Text>
      </View>

      {photos.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 40,
          }}
        >
          <Text style={{ fontSize: 64, marginBottom: 20 }}>📷</Text>
          <Text
            style={{
              fontSize: 20,
              color: "#D4A574",
              textAlign: "center",
              fontFamily: Platform.select({ ios: "Georgia", android: "serif" }),
              marginBottom: 8,
            }}
          >
            Your memory wall is empty
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#8B7355",
              textAlign: "center",
              lineHeight: 22,
            }}
          >
            Add photos to your moments, dates, and milestones to see them here
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-around",
            padding: 15,
            paddingTop: 25,
          }}
          showsVerticalScrollIndicator={false}
        >
          {photos.map((photo, index) => renderPolaroid(photo, index))}
          {/* Bottom padding */}
          <View style={{ width: "100%", height: 30 }} />
        </ScrollView>
      )}

      {/* Photo preview modal */}
      <Modal
        visible={selectedPhoto !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.85)",
            justifyContent: "center",
            alignItems: "center",
          }}
          activeOpacity={1}
          onPress={() => setSelectedPhoto(null)}
        >
          {selectedPhoto && (
            <View style={{ alignItems: "center", width: "100%" }}>
              {/* Large polaroid */}
              <View
                style={{
                  backgroundColor: "#fefefe",
                  padding: 12,
                  paddingBottom: 60,
                  marginHorizontal: 20,
                  maxWidth: SCREEN_WIDTH - 40,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.5,
                  shadowRadius: 20,
                  elevation: 20,
                }}
              >
                <Image
                  source={{ uri: selectedPhoto.url }}
                  style={{
                    width: SCREEN_WIDTH - 64,
                    height: SCREEN_WIDTH - 64,
                    backgroundColor: "#e8e8e8",
                  }}
                  resizeMode="cover"
                />
                <View
                  style={{
                    position: "absolute",
                    bottom: 12,
                    left: 12,
                    right: 12,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: Platform.select({
                        ios: "Noteworthy-Bold",
                        android: "serif",
                        default: "cursive",
                      }),
                      fontSize: 16,
                      color: "#333",
                      textAlign: "center",
                      marginBottom: 4,
                    }}
                    numberOfLines={1}
                  >
                    {selectedPhoto.sourceTitle}
                  </Text>
                  <Text
                    style={{
                      fontFamily: Platform.select({
                        ios: "Noteworthy",
                        android: "serif",
                        default: "cursive",
                      }),
                      fontSize: 13,
                      color: "#666",
                      textAlign: "center",
                    }}
                  >
                    {formatDate(selectedPhoto.sourceDate)}
                  </Text>
                </View>
              </View>

              {/* View entry button */}
              <TouchableOpacity
                onPress={handleViewEntry}
                style={{
                  marginTop: 24,
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: getSourceColor(selectedPhoto.sourceType),
                  paddingHorizontal: 24,
                  paddingVertical: 14,
                  borderRadius: 30,
                  gap: 8,
                }}
              >
                <Text style={{ fontSize: 18 }}>
                  {getSourceIcon(selectedPhoto.sourceType)}
                </Text>
                <Text
                  style={{
                    color: selectedPhoto.sourceType === "milestone" ? "#1a0f00" : "#fff",
                    fontSize: 16,
                    fontWeight: "600",
                  }}
                >
                  View {selectedPhoto.sourceType === "date" ? "Date" : selectedPhoto.sourceType === "milestone" ? "Milestone" : "Moment"}
                </Text>
              </TouchableOpacity>

              {/* Close hint */}
              <Text
                style={{
                  marginTop: 20,
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 13,
                }}
              >
                Tap anywhere to close
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Modal>

      {/* Entry detail modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowDetailModal(false)}
      >
        {detailData?.type === "moment" && (
          <MomentDetailView
            moment={detailData.data as Moment}
            onClose={() => setShowDetailModal(false)}
            onEdit={() => {}}
            allowEdit={false}
          />
        )}
        {detailData?.type === "date" && (
          <DateDetailView
            dateEntry={detailData.data as DateEntry}
            onClose={() => setShowDetailModal(false)}
            onEdit={() => {}}
            allowEdit={false}
          />
        )}
        {detailData?.type === "milestone" && (
          <MilestoneDetailView
            milestone={detailData.data as Milestone}
            onClose={() => setShowDetailModal(false)}
            onEdit={() => {}}
            allowEdit={false}
          />
        )}
      </Modal>
    </View>
  );
}
