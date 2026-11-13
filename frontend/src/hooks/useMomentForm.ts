import { useCallback, useRef, useState } from "react";
import { Platform } from "react-native";
import type { CreateMomentDto, Moment } from "../types/moments";

/** "YYYY-MM-DD" in local time, the format the API stores. */
export function formatDateForDatabase(dateObj: Date): string {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Only http(s) URLs are real uploaded photos; blob/data URIs and junk are dropped. */
export function filterValidPhotos(photoUrls: string[]): string[] {
  return photoUrls.filter(
    (url) => url && typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://"))
  );
}

function snapshot(title: string, storyDate: string, description: string, photos: string[]): string {
  return JSON.stringify([title, storyDate, description, photos]);
}

/**
 * Moment create/edit form state, extracted from MomentsScreen with no behaviour
 * change. Adds `isDirty` (for the "Discard this moment?" dialog [7A]).
 */
export function useMomentForm() {
  const [editingMoment, setEditingMoment] = useState<Moment | null>(null);
  const [title, setTitle] = useState("");
  const [storyDate, setStoryDate] = useState("");
  const [datePickerValue, setDatePickerValue] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const initialRef = useRef(snapshot("", "", "", []));

  const resetForm = useCallback(() => {
    const today = new Date();
    const todayStr = formatDateForDatabase(today); // Default to today
    setTitle("");
    setStoryDate(todayStr);
    setDatePickerValue(today);
    setDescription("");
    setPhotos([]);
    setEditingMoment(null);
    setShowDatePicker(false);
    initialRef.current = snapshot("", todayStr, "", []);
  }, []);

  const loadMoment = useCallback((moment: Moment) => {
    const validPhotos = filterValidPhotos(moment.photos || []);
    setEditingMoment(moment);
    setTitle(moment.title);
    setStoryDate(moment.story_date);
    // Parse date manually to avoid timezone issues
    const [year, month, day] = moment.story_date.split("-").map(Number);
    const parsedDate = new Date(year, month - 1, day);
    setDatePickerValue(isNaN(parsedDate.getTime()) ? new Date() : parsedDate);
    setDescription(moment.description || "");
    setPhotos(validPhotos);
    initialRef.current = snapshot(moment.title, moment.story_date, moment.description || "", validPhotos);
  }, []);

  /** A date chosen from WebDatePicker or the iOS "Done" button. */
  const pickDate = useCallback((picked: Date) => {
    setDatePickerValue(picked);
    setStoryDate(formatDateForDatabase(picked));
  }, []);

  /** Native DateTimePicker onChange. */
  const handleDateChange = useCallback((event: any, pickedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (event.type === "set" && pickedDate) {
      setDatePickerValue(pickedDate);
      setStoryDate(formatDateForDatabase(pickedDate));
    } else if (event.type === "dismissed") {
      setShowDatePicker(false);
    }
  }, []);

  const addPhotos = useCallback((urls: string[]) => {
    // Functional update to avoid a stale closure
    setPhotos((prev) => [...prev, ...urls]);
  }, []);

  const removePhoto = useCallback((indexToRemove: number) => {
    setPhotos((prev) => prev.filter((_, index) => index !== indexToRemove));
  }, []);

  const isValid = !!storyDate && !!description && !!title.trim();

  const buildDto = (): CreateMomentDto => {
    const validPhotos = filterValidPhotos(photos);
    return {
      title: title.trim(),
      story_date: storyDate,
      description,
      photos: validPhotos.length > 0 ? validPhotos : [],
    };
  };

  const isDirty = snapshot(title, storyDate, description, photos) !== initialRef.current;

  return {
    editingMoment,
    title,
    setTitle,
    storyDate,
    datePickerValue,
    setDatePickerValue,
    showDatePicker,
    setShowDatePicker,
    description,
    setDescription,
    photos,
    addPhotos,
    removePhoto,
    pickDate,
    handleDateChange,
    resetForm,
    loadMoment,
    isValid,
    isDirty,
    buildDto,
  };
}
