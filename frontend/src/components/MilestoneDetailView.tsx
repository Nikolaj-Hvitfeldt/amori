import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Pencil, Trash2, X } from "lucide-react-native";
import { Milestone } from "../types/milestones";
import {
  ActionMenu,
  ActionMenuItem,
  Button,
  MilestoneTypeTag,
  PhotoPager,
  ScreenBackground,
  Text,
  formatLongDate,
  ICON_STROKE,
  iconSize,
} from "../ui";
import { color, gutter, space } from "../theme";

interface MilestoneDetailViewProps {
  milestone: Milestone;
  onClose: () => void;
  onEdit: () => void;
  /** Optional: shown in the ⋯ menu next to Edit. The caller owns the confirmation. */
  onDelete?: () => void;
  allowEdit?: boolean;
}

const filterValidPhotos = (photoUrls: string[]): string[] => {
  if (!photoUrls || !Array.isArray(photoUrls)) {
    return [];
  }
  return photoUrls.filter(
    (url) =>
      url &&
      typeof url === "string" &&
      (url.startsWith("http://") || url.startsWith("https://"))
  );
};

const calculateDaysSince = (dateString: string): number => {
  const milestoneDate = new Date(dateString);
  const today = new Date();
  const diffTime = today.getTime() - milestoneDate.getTime();
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
};

/**
 * Milestone detail [1A]: photo hero (omitted without a photo), title, italic date,
 * the type chip, the "days since" stat, then the description. Edit and Delete
 * live in the shared ⋯ ActionMenu. Every photo stays available in the PhotoPager
 * hero [4A]. Renders inside any container (the tall Sheet on Milestones, the
 * Story/Wall modal).
 */
export default function MilestoneDetailView({
  milestone,
  onClose,
  onEdit,
  onDelete,
  allowEdit = true,
}: MilestoneDetailViewProps) {
  const photos = filterValidPhotos(milestone.photos || []);
  const daysSince = calculateDaysSince(milestone.date);
  const actions: ActionMenuItem[] = [{ label: "Edit", icon: Pencil, onPress: onEdit }];
  if (onDelete) actions.push({ label: "Delete", icon: Trash2, onPress: onDelete, destructive: true });

  return (
    <ScreenBackground>
      <View style={styles.bar}>
        <Button
          variant="icon"
          accessibilityLabel="Close"
          icon={<X size={iconSize.lg} color={color.text} strokeWidth={ICON_STROKE} />}
          onPress={onClose}
        />
        {allowEdit ? (
          <ActionMenu actions={actions} accessibilityHint="Edit or delete this milestone" menuLabel="Milestone options" />
        ) : null}
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <PhotoPager photos={photos} title={milestone.title} />

        <View style={styles.content}>
          <Text variant="title">{milestone.title}</Text>
          <Text variant="date" tone="muted">
            {formatLongDate(milestone.date)}
          </Text>
          <MilestoneTypeTag type={milestone.milestone_type} style={styles.chip} />

          <View style={styles.stat} accessible accessibilityLabel={`${daysSince} days since`}>
            <Text variant="caption" tone="muted" uppercase>
              Days since
            </Text>
            <Text variant="heading">{String(daysSince)}</Text>
          </View>

          {milestone.description ? (
            <Text variant="body">{milestone.description}</Text>
          ) : (
            <Text variant="body" tone="muted">
              No description added yet.
            </Text>
          )}
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: space.sm,
    paddingVertical: space.sm,
  },
  flex: { flex: 1 },
  scroll: { paddingBottom: space.xxxl },
  content: { paddingHorizontal: gutter, paddingTop: space.xl, gap: space.sm },
  chip: { marginTop: space.xs },
  stat: { marginTop: space.lg, marginBottom: space.lg, gap: space.xs },
});
