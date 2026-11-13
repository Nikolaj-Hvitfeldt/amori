import { MilestoneType } from "../types/milestones";

/**
 * Default milestone titles. Non-visual data only: picking a type in the form
 * pre-fills the title with this label (useMilestoneForm), and that title is saved
 * with the milestone, so these strings must not change. The visual side (Lucide
 * icon + short word per type) lives in src/ui/icons.ts [5B].
 */
export const MILESTONE_CONFIG: Record<MilestoneType, { label: string }> = {
  met: { label: "We Met" },
  first_date: { label: "First Date" },
  official: { label: "Became Official" },
  moved_in: { label: "Moved In Together" },
  engagement: { label: "Engagement" },
  wedding: { label: "Wedding" },
  kid: { label: "Kid" },
  custom: { label: "Custom Milestone" },
};
