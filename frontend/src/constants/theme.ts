/**
 * Theme colors for the application
 */

// Moment/Story colors
export const MOMENT_COLOR = "#FF6B9D";
export const MOMENT_BG = "#1a0f1a";
export const MOMENT_TEXT = "#ffd1e0";
export const MOMENT_GRADIENT = ["#FF6B9D", "#FF8E9D", "#FFB3C1"];

// Date colors
export const DATE_BG = "#0f172a";
export const DATE_BORDER = "#374151";
export const DATE_TEXT = "#e5d3ff";
export const DATE_TEXT_SECONDARY = "#a78bfa";

// Milestone colors
export const MILESTONE_BG = "#2d1810";
export const MILESTONE_BORDER = "#ffd70040";
export const MILESTONE_COLOR = "#ffd700";
export const MILESTONE_TEXT = "#ffd700";
export const MILESTONE_TEXT_SECONDARY = "#ffb84d";

// Timeline colors
export const TIMELINE_BG = "#F5E6D3"; // Warm beige/cream
export const ROPE_COLOR = "#FFD700"; // Gold
export const ROPE_COLOR_DARK = "#FFA500"; // Dark gold
export const ROPE_COLOR_LIGHT = "#FFED4E"; // Light gold

// Common colors
export const GOLD = "#FFD700";
export const GOLD_DARK = "#B8860B";
export const WHITE = "#ffffff";
export const BLACK = "#000000";
export const GRAY_LIGHT = "#f3f4f6";
export const GRAY_MEDIUM = "#9ca3af";
export const GRAY_DARK = "#666";
export const GRAY_DARKER = "#333";

// Text colors
export const TEXT_PRIMARY = "#333";
export const TEXT_SECONDARY = "#666";
export const TEXT_LIGHT = "#f3f4f6";
export const TEXT_DARK = "#1a0f1a";

// Date screen time-based themes
export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

export interface TimeTheme {
  gradient: string[];
  text: string;
  bg: string;
}

export const TIME_THEMES: Record<TimeOfDay, TimeTheme> = {
  morning: {
    gradient: ["#FFE5B4", "#FFD89B", "#FFC65D"],
    text: "#8B4513",
    bg: "#FFF8E7",
  },
  afternoon: {
    gradient: ["#87CEEB", "#B0E0E6", "#E0F6FF"],
    text: "#1E3A5F",
    bg: "#E8F4F8",
  },
  evening: {
    gradient: ["#FFB6C1", "#FFA07A", "#FF8C69"],
    text: "#8B0000",
    bg: "#FFE8E0",
  },
  night: {
    gradient: ["#1a1a2e", "#16213e", "#0f172a"],
    text: "#e5d3ff",
    bg: "#0f172a",
  },
};

// Additional date screen colors
export const DATE_SCREEN_BG = "#1a1a2e";
export const DATE_SCREEN_HEADER_GRADIENT = "linear-gradient(135deg, #16213e 0%, #0f172a 100%)";
export const DATE_SCREEN_BORDER_LIGHT = "#e5d3ff20";
export const DATE_SCREEN_PURPLE = "#7c3aed";
export const DATE_SCREEN_PURPLE_LIGHT = "#8b5cf6";
export const DATE_SCREEN_GRAY = "#6b7280";
export const DATE_SCREEN_GRAY_DARK = "#374151";
export const DATE_SCREEN_WHITE = "#ffffff";
export const DATE_SCREEN_TEXT_LIGHT = "#d1d5db";

// Milestone screen colors
export const MILESTONE_SCREEN_BG = "#1a0f00";
export const MILESTONE_BROWN_TEXT = "#8b7355";
export const MILESTONE_LIGHT_BROWN = "#d4a574";
export const MILESTONE_LIGHT_GOLD = "#ffb84d";
export const MILESTONE_BORDER_LIGHT = "#ffed4e";
export const MILESTONE_BORDER_OPACITY_30 = "#ffd70030";
export const MILESTONE_BORDER_OPACITY_40 = "#ffd70040";

