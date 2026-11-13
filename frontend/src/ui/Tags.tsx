import React from "react";
import type { DateMood } from "../types/dates";
import type { MilestoneType } from "../types/milestones";
import { Chip, ChipProps } from "./Chip";
import { milestoneTypeIcons, moodIcons } from "./icons";

type TagProps = Omit<ChipProps, "label" | "icon" | "section">;

/** Mood as icon + word, in the Dates accent (lavender) [5B]. */
export function MoodTag({ mood, ...rest }: TagProps & { mood: DateMood }) {
  const { Icon, label } = moodIcons[mood];
  return <Chip label={label} icon={Icon} section="dates" {...rest} />;
}

/** Milestone type as icon + word, in the Milestones accent (sage) [5B]. */
export function MilestoneTypeTag({ type, ...rest }: TagProps & { type: MilestoneType }) {
  const { Icon, label } = milestoneTypeIcons[type];
  return <Chip label={label} icon={Icon} section="milestones" {...rest} />;
}
