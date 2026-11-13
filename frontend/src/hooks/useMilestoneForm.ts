/**
 * Form state for the Milestone create/edit sheet, extracted from MilestonesScreen
 * with no behaviour change (Allowed addition: form state in a hook).
 * Save, upload and load stay in the screen; this hook only owns the fields.
 */
import { useCallback, useRef, useState } from "react";
import { Platform } from "react-native";
import type { Milestone, MilestoneType } from "../types/milestones";
import { MILESTONE_CONFIG } from "../constants/milestoneConfig";

/** "YYYY-MM-DD" from a local Date (no timezone shift). */
export function formatDateForDb(dateObj: Date): string {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type Snapshot = {
  milestoneType: MilestoneType;
  title: string;
  date: string;
  description: string;
  photos: string[];
};

export function useMilestoneForm() {
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [milestoneType, setMilestoneType] = useState<MilestoneType>("met");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [datePickerValue, setDatePickerValue] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  /** The values the sheet opened with, for the "Discard this milestone?" check [7A]. */
  const initial = useRef<Snapshot | null>(null);

  const resetForm = useCallback(() => {
    const today = new Date();
    setMilestoneType("met");
    setTitle("");
    setDate(formatDateForDb(today)); // Default to today
    setDatePickerValue(today);
    setDescription("");
    setPhotos([]);
    setEditingMilestone(null);
    setShowDatePicker(false);
    initial.current = { milestoneType: "met", title: "", date: formatDateForDb(today), description: "", photos: [] };
  }, []);

  const loadMilestone = useCallback((milestone: Milestone) => {
    setEditingMilestone(milestone);
    setMilestoneType(milestone.milestone_type);
    setTitle(milestone.title);
    setDate(milestone.date);
    // Parse date manually to avoid timezone issues
    const [year, month, day] = milestone.date.split("-").map(Number);
    const parsedDate = new Date(year, month - 1, day);
    setDatePickerValue(isNaN(parsedDate.getTime()) ? new Date() : parsedDate);
    setDescription(milestone.description || "");
    // Don't filter photos when opening modal - use photos as-is from database
    // Filtering will happen on save and on load, not when editing
    setPhotos(milestone.photos || []);
    initial.current = {
      milestoneType: milestone.milestone_type,
      title: milestone.title,
      date: milestone.date,
      description: milestone.description || "",
      photos: milestone.photos || [],
    };
  }, []);

  /** Picking a type also fills the title while it is empty or still the previous type's label. */
  const selectType = useCallback(
    (type: MilestoneType) => {
      setMilestoneType(type);
      if (!title || title === MILESTONE_CONFIG[milestoneType].label) {
        setTitle(MILESTONE_CONFIG[type].label);
      }
    },
    [title, milestoneType]
  );

  const setPickedDate = useCallback((newDate: Date) => {
    setDatePickerValue(newDate);
    setDate(formatDateForDb(newDate));
  }, []);

  /** Native DateTimePicker onChange. */
  const handleDateChange = useCallback((event: any, pickedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (event.type === "set" && pickedDate) {
      setDatePickerValue(pickedDate);
      setDate(formatDateForDb(pickedDate));
    } else if (event.type === "dismissed") {
      setShowDatePicker(false);
    }
  }, []);

  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const s = initial.current;
  const isDirty =
    !!s &&
    (s.milestoneType !== milestoneType ||
      s.title !== title ||
      s.date !== date ||
      s.description !== description ||
      s.photos.length !== photos.length ||
      s.photos.some((p, i) => p !== photos[i]));

  return {
    editingMilestone,
    milestoneType,
    title,
    setTitle,
    date,
    setDate,
    datePickerValue,
    setDatePickerValue,
    showDatePicker,
    setShowDatePicker,
    description,
    setDescription,
    photos,
    setPhotos,
    resetForm,
    loadMilestone,
    selectType,
    setPickedDate,
    handleDateChange,
    removePhoto,
    isDirty,
  };
}
