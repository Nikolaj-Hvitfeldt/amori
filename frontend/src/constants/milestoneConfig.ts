import { MilestoneType } from "../types/milestones";

type MilestoneVisualConfig = {
  icon: string;
  label: string;
  color: string;
  gradient: string[];
};

export const MILESTONE_CONFIG: Record<MilestoneType, MilestoneVisualConfig> = {
  met: {
    icon: "👋",
    label: "We Met",
    color: "#FF6B9D",
    gradient: ["#FF6B9D", "#FF8E9D", "#FFB3C1"],
  },
  first_date: {
    icon: "🌹",
    label: "First Date",
    color: "#FF69B4",
    gradient: ["#FF69B4", "#FF8EC8", "#FFB3DC"],
  },
  official: {
    icon: "💕",
    label: "Became Official",
    color: "#FF1493",
    gradient: ["#FF1493", "#FF6EC7", "#FFB3E6"],
  },
  moved_in: {
    icon: "🏠",
    label: "Moved In Together",
    color: "#C71585",
    gradient: ["#C71585", "#DA70D6", "#EE82EE"],
  },
  engagement: {
    icon: "💍",
    label: "Engagement",
    color: "#BA55D3",
    gradient: ["#BA55D3", "#DDA0DD", "#E6E6FA"],
  },
  wedding: {
    icon: "💒",
    label: "Wedding",
    color: "#9370DB",
    gradient: ["#9370DB", "#B19CD9", "#D8BFD8"],
  },
  kid: {
    icon: "👶",
    label: "Kid",
    color: "#FFB6C1",
    gradient: ["#FFB6C1", "#FFC0CB", "#FFD1DC"],
  },
  custom: {
    icon: "⭐",
    label: "Custom Milestone",
    color: "#FFD700",
    gradient: ["#FFD700", "#FFE44D", "#FFF59D"],
  },
};

export const getMilestoneConfig = (type: MilestoneType) => MILESTONE_CONFIG[type];

