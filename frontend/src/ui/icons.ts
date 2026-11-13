/**
 * Icon map [5B, T2]: moods and milestone types → Lucide line icon + word.
 * Always shown together, in the section colour (Dates lavender, Milestones sage).
 * Default milestone titles (non-visual) live in constants/milestoneConfig.ts.
 */
import type { LucideIcon } from "lucide-react-native";
import {
  Baby,
  Church,
  Flame,
  Gem,
  Handshake,
  Heart,
  HeartHandshake,
  House,
  Moon,
  Mountain,
  Sparkles,
  Star,
  Wine,
  Zap,
} from "lucide-react-native";
import type { DateMood } from "../types/dates";
import type { MilestoneType } from "../types/milestones";

/**
 * Lucide stroke width [5B]. Not in theme yet (reported as a token gap).
 */
export const ICON_STROKE = 1.75;

/** Icon sizes. Not in theme yet (reported as a token gap). */
export const iconSize = { sm: 16, md: 20, lg: 24 } as const;

export type IconEntry = { Icon: LucideIcon; label: string };

export const MOODS: readonly DateMood[] = ["magical", "romantic", "adventurous", "cozy", "spontaneous", "dreamy"];

export const moodIcons: Record<DateMood, IconEntry> = {
  magical: { Icon: Sparkles, label: "Magical" },
  romantic: { Icon: Heart, label: "Romantic" },
  adventurous: { Icon: Mountain, label: "Adventurous" },
  cozy: { Icon: Flame, label: "Cozy" },
  spontaneous: { Icon: Zap, label: "Spontaneous" },
  dreamy: { Icon: Moon, label: "Dreamy" },
};

export const MILESTONE_TYPES: readonly MilestoneType[] = [
  "met",
  "first_date",
  "official",
  "moved_in",
  "engagement",
  "wedding",
  "kid",
  "custom",
];

export const milestoneTypeIcons: Record<MilestoneType, IconEntry> = {
  met: { Icon: Handshake, label: "We met" },
  first_date: { Icon: Wine, label: "First date" },
  official: { Icon: HeartHandshake, label: "Official" },
  moved_in: { Icon: House, label: "Moved in" },
  engagement: { Icon: Gem, label: "Engagement" },
  wedding: { Icon: Church, label: "Wedding" },
  kid: { Icon: Baby, label: "Kid" },
  custom: { Icon: Star, label: "Custom" },
};
