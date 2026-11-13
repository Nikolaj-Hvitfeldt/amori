import { useCallback, useRef, useState } from "react";
import { Alert, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { CreateDateEntryDto, DateEntry, DateMood } from "../types/dates";
import { datesService } from "../services/dates";
import { filterValidPhotos } from "../utils/imageUtils";

/** "YYYY-MM-DD" in local time, as the API stores it. */
export function formatDateForDb(dateObj: Date): string {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Message shown when the required fields are missing (same rule and copy as before the redesign). */
export const MISSING_FIELDS_MESSAGE = "Please fill in the date, location, and description";

type Snapshot = {
  title: string;
  date: string;
  location: string;
  description: string;
  mood: DateMood;
  highlights: string[];
  weather: string;
  favoriteMoment: string;
  photos: string[];
};

/** Reads an image URI as a base64 data URL and uploads it (unchanged from the pre-redesign screen). */
async function uploadImage(uri: string): Promise<string> {
  try {
    let base64: string;
    let mimeType: string;

    const readBlob = async (src: string) => {
      const response = await fetch(src);
      const blob = await response.blob();
      const type = blob.type || "image/jpeg";
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      return { type, data };
    };

    if (Platform.OS === "web") {
      if (uri.startsWith("data:")) {
        const matches = uri.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          base64 = matches[2];
        } else {
          throw new Error("Invalid data URL format");
        }
      } else {
        // blob:, file:// or anything else: fetch and convert
        const { type, data } = await readBlob(uri);
        mimeType = type;
        base64 = data;
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

    return await datesService.uploadImage(`data:${mimeType};base64,${base64}`);
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
}

/**
 * Create/edit form state for a date [Allowed addition: form state in a hook].
 * Same fields, defaults, validation and DTO as the pre-redesign DatesScreen.
 */
export function useDateForm() {
  const [editingDate, setEditingDate] = useState<DateEntry | null>(null);
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
  const [uploadingCount, setUploadingCount] = useState(0);
  /** The values the form opened with, to tell whether there are unsaved edits. */
  const initialRef = useRef<string>("");

  const snapshot = (s: Snapshot) => JSON.stringify(s);

  const resetForm = useCallback(() => {
    const today = new Date();
    const todayDb = formatDateForDb(today);
    setTitle("");
    setDate(todayDb); // Default to today
    setDatePickerValue(today);
    setLocation("");
    setDescription("");
    setMood("romantic");
    setHighlights([""]);
    setWeather("");
    setFavoriteMoment("");
    setPhotos([]);
    setEditingDate(null);
    setShowDatePicker(false);
    initialRef.current = snapshot({
      title: "",
      date: todayDb,
      location: "",
      description: "",
      mood: "romantic",
      highlights: [""],
      weather: "",
      favoriteMoment: "",
      photos: [],
    });
  }, []);

  const loadEntry = useCallback((dateEntry: DateEntry) => {
    setEditingDate(dateEntry);
    setTitle(dateEntry.title || "");
    setDate(dateEntry.date);
    // Parse date manually to avoid timezone issues
    const [year, month, day] = dateEntry.date.split("-").map(Number);
    const parsedDate = new Date(year, month - 1, day);
    setDatePickerValue(isNaN(parsedDate.getTime()) ? new Date() : parsedDate);
    setLocation(dateEntry.location);
    setDescription(dateEntry.description);
    setMood(dateEntry.mood);
    const hl = dateEntry.highlights.length > 0 ? dateEntry.highlights : [""];
    setHighlights(hl);
    setWeather(dateEntry.weather || "");
    setFavoriteMoment(dateEntry.favorite_moment || "");
    // Support both photos array and legacy image_url. Not filtered here:
    // filtering happens on save and on load, not when editing.
    const allPhotos =
      dateEntry.photos && dateEntry.photos.length > 0
        ? dateEntry.photos
        : dateEntry.image_url
        ? [dateEntry.image_url]
        : [];
    setPhotos(allPhotos);
    setShowDatePicker(false);
    initialRef.current = snapshot({
      title: dateEntry.title || "",
      date: dateEntry.date,
      location: dateEntry.location,
      description: dateEntry.description,
      mood: dateEntry.mood,
      highlights: hl,
      weather: dateEntry.weather || "",
      favoriteMoment: dateEntry.favorite_moment || "",
      photos: allPhotos,
    });
  }, []);

  const isDirty =
    snapshot({ title, date, location, description, mood, highlights, weather, favoriteMoment, photos }) !==
    initialRef.current;

  /** Native date picker callback (iOS spinner, Android dialog). */
  const handleDateChange = (event: { type: string }, pickedDate?: Date) => {
    // On Android, always close the picker after the event
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (event.type === "set" && pickedDate) {
      setDatePickerValue(pickedDate);
      setDate(formatDateForDb(pickedDate));
    } else if (event.type === "dismissed") {
      setShowDatePicker(false);
    }
  };

  /** Web date picker and the iOS "Done" button. */
  const pickDate = (value: Date) => {
    setDatePickerValue(value);
    setDate(formatDateForDb(value));
  };

  const addHighlight = () => setHighlights((h) => [...h, ""]);
  const updateHighlight = (index: number, value: string) =>
    setHighlights((h) => {
      const next = [...h];
      next[index] = value;
      return next;
    });
  const removeHighlight = (index: number) =>
    setHighlights((h) => (h.length > 1 ? h.filter((_, i) => i !== index) : h));

  const removePhoto = (index: number) => setPhotos((p) => p.filter((_, i) => i !== index));

  const pickImage = async () => {
    try {
      // Request permissions (skip on web as it's handled by browser)
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Required", "Please grant permission to access your photos.");
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploadingCount(result.assets.length);
        try {
          const uploadedUrls = await Promise.all(result.assets.map((asset) => uploadImage(asset.uri)));
          setPhotos((p) => [...p, ...uploadedUrls]);
        } catch (uploadError) {
          console.error("Error uploading images:", uploadError);
          Alert.alert(
            "Upload Error",
            `Failed to upload images: ${uploadError instanceof Error ? uploadError.message : "Unknown error"}`
          );
        } finally {
          setUploadingCount(0);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", `Failed to pick image: ${error instanceof Error ? error.message : "Unknown error"}`);
      setUploadingCount(0);
    }
  };

  /** Same required fields as before: date, location and description. */
  const isValid = !!date && !!location && !!description;

  const toDto = (): CreateDateEntryDto => ({
    title: title.trim() || undefined,
    date,
    location,
    description,
    mood,
    highlights: highlights.filter((h) => h.trim() !== ""),
    weather: weather || undefined,
    favorite_moment: favoriteMoment || undefined,
    photos: filterValidPhotos(photos),
  });

  return {
    editingDate,
    title,
    setTitle,
    date,
    datePickerValue,
    showDatePicker,
    setShowDatePicker,
    location,
    setLocation,
    description,
    setDescription,
    mood,
    setMood,
    highlights,
    addHighlight,
    updateHighlight,
    removeHighlight,
    weather,
    setWeather,
    favoriteMoment,
    setFavoriteMoment,
    photos,
    removePhoto,
    pickImage,
    uploadingCount,
    handleDateChange,
    pickDate,
    resetForm,
    loadEntry,
    isDirty,
    isValid,
    toDto,
  };
}

export type DateForm = ReturnType<typeof useDateForm>;
