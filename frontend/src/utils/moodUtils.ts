import { DateMood } from "../types/dates";

/**
 * Mood-based accent colors
 */
export const MOOD_COLORS: Record<DateMood, string> = {
  magical: "#DDA0DD",
  romantic: "#FFB6C1",
  adventurous: "#FFD700",
  cozy: "#FFA07A",
  spontaneous: "#FF69B4",
  dreamy: "#DDA0DD",
};

/**
 * Mood options with labels and icons
 */
export const MOOD_OPTIONS: { value: DateMood; label: string; icon: string }[] = [
  { value: "magical", label: "Magical", icon: "✨" },
  { value: "romantic", label: "Romantic", icon: "💕" },
  { value: "adventurous", label: "Adventurous", icon: "🌟" },
  { value: "cozy", label: "Cozy", icon: "🕯️" },
  { value: "spontaneous", label: "Spontaneous", icon: "🎈" },
  { value: "dreamy", label: "Dreamy", icon: "🌙" },
];

/**
 * Get mood information by value
 */
export const getMoodInfo = (moodValue: DateMood) => {
  return (
    MOOD_OPTIONS.find((option) => option.value === moodValue) || MOOD_OPTIONS[1]
  );
};

