import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Pencil, Trash2, X } from "lucide-react-native";
import { Moment } from "../types/moments";
import { color, gutter, space } from "../theme";
import {
  ActionMenu,
  ActionMenuItem,
  Button,
  ICON_STROKE,
  PhotoPager,
  ScreenBackground,
  Text,
  formatLongDate,
  iconSize,
} from "../ui";
import { filterValidPhotos } from "../hooks/useMomentForm";

interface MomentDetailViewProps {
  moment: Moment;
  onClose: () => void;
  onEdit: () => void;
  allowEdit?: boolean;
  /** Shown in the ⋯ menu next to Edit when given (and allowEdit). The caller owns the confirmation. */
  onDelete?: () => void;
}

/**
 * Moment detail [1A]: photo hero (PhotoPager: every photo, paged; omitted without
 * photos), title, italic date, then the description. Edit and Delete live in the
 * shared ⋯ ActionMenu. Renders inside any container (the tall Sheet on Moments,
 * the Story/Wall modal).
 */
export default function MomentDetailView({
  moment,
  onClose,
  onEdit,
  allowEdit = true,
  onDelete,
}: MomentDetailViewProps) {
  const photos = filterValidPhotos(moment.photos || []);
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
          <ActionMenu actions={actions} accessibilityHint="Edit or delete this moment" menuLabel="Moment options" />
        ) : null}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <PhotoPager photos={photos} title={moment.title} />
        <View style={styles.text}>
          <Text variant="title" accessibilityRole="header">
            {moment.title}
          </Text>
          <Text variant="date" tone="muted">
            {formatLongDate(moment.story_date)}
          </Text>
          <Text variant="body" tone={moment.description ? "text" : "muted"} style={styles.description}>
            {moment.description || "No description for this moment yet."}
          </Text>
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
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: space.xxxl },
  text: { paddingHorizontal: gutter, paddingTop: space.xl, gap: space.xs },
  description: { marginTop: space.lg },
});
