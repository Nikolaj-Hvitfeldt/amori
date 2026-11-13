import React, { useState } from "react";
import { View, ScrollView, StyleSheet, NativeSyntheticEvent, NativeScrollEvent, useWindowDimensions } from "react-native";
import { Ellipsis, Pencil, Trash2, X } from "lucide-react-native";
import { Milestone } from "../types/milestones";
import {
  Button,
  MilestoneTypeTag,
  PhotoImage,
  ScreenBackground,
  Sheet,
  Text,
  formatLongDate,
  ICON_STROKE,
  iconSize,
} from "../ui";
import { color, gutter, motion, radius, space, webFrame } from "../theme";

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

/** Photo hero aspect (width / height). */
const HERO_ASPECT = 4 / 3;
/** Page dot size. */
const DOT = space.sm;

/**
 * Milestone detail [1A]: photo hero (omitted without a photo), title, italic date,
 * the type chip, the "days since" stat, then the description. Edit and Delete
 * live in a ⋯ menu. Every photo stays available in the hero carousel [4A].
 */
export default function MilestoneDetailView({
  milestone,
  onClose,
  onEdit,
  onDelete,
  allowEdit = true,
}: MilestoneDetailViewProps) {
  const { width: windowWidth } = useWindowDimensions();
  const [heroWidth, setHeroWidth] = useState(Math.min(windowWidth, webFrame.column));
  const [page, setPage] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const photos = filterValidPhotos(milestone.photos || []);
  const daysSince = calculateDaysSince(milestone.date);
  const hasMenu = allowEdit;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!heroWidth) return;
    const next = Math.round(e.nativeEvent.contentOffset.x / heroWidth);
    if (next !== page) setPage(next);
  };

  const runFromMenu = (fn: () => void) => {
    setMenuOpen(false);
    // Let the menu sheet close first, so a native confirmation can present.
    setTimeout(fn, motion.sheetClose);
  };

  return (
    <ScreenBackground>
      <View style={styles.bar}>
        <Button
          variant="icon"
          accessibilityLabel="Close"
          icon={<X size={iconSize.lg} color={color.text} strokeWidth={ICON_STROKE} />}
          onPress={onClose}
        />
        {hasMenu ? (
          <Button
            variant="icon"
            accessibilityLabel="More options"
            icon={<Ellipsis size={iconSize.lg} color={color.text} strokeWidth={ICON_STROKE} />}
            onPress={() => setMenuOpen(true)}
          />
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {photos.length > 0 ? (
          <View
            style={styles.hero}
            onLayout={(e) => {
              const w = e.nativeEvent.layout.width;
              if (w && w !== heroWidth) setHeroWidth(w);
            }}
          >
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onScroll}
              scrollEventThrottle={16}
              accessibilityLabel={`${photos.length} ${photos.length === 1 ? "photo" : "photos"}`}
            >
              {photos.map((photo, index) => (
                <PhotoImage
                  key={`${photo}-${index}`}
                  source={photo}
                  style={{ width: heroWidth, aspectRatio: HERO_ASPECT }}
                  accessibilityLabel={`Photo ${index + 1} of ${photos.length}`}
                />
              ))}
            </ScrollView>
            {photos.length > 1 ? (
              <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                {photos.map((_, index) => (
                  <View
                    key={`dot-${index}`}
                    style={[styles.dot, { backgroundColor: index === page ? color.accent : color.outline }]}
                  />
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

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

      <Sheet visible={menuOpen} onRequestClose={() => setMenuOpen(false)} accessibilityLabel="Milestone options">
        <View style={styles.menu}>
          <Button
            variant="text"
            label="Edit"
            icon={<Pencil size={iconSize.md} color={color.text} strokeWidth={ICON_STROKE} />}
            onPress={() => runFromMenu(onEdit)}
            style={styles.menuItem}
          />
          {onDelete ? (
            <Button
              variant="text"
              label="Delete"
              icon={<Trash2 size={iconSize.md} color={color.text} strokeWidth={ICON_STROKE} />}
              onPress={() => runFromMenu(onDelete)}
              style={styles.menuItem}
            />
          ) : null}
          <Button variant="text" label="Cancel" onPress={() => setMenuOpen(false)} style={styles.menuItem} />
        </View>
      </Sheet>
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
  scroll: { paddingBottom: space.xxxl },
  hero: { width: "100%", overflow: "hidden" },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: space.sm,
    paddingTop: space.md,
  },
  dot: { width: DOT, height: DOT, borderRadius: radius.pill },
  content: { paddingHorizontal: gutter, paddingTop: space.xl, gap: space.sm },
  chip: { marginTop: space.xs },
  stat: { marginTop: space.lg, marginBottom: space.lg, gap: space.xs },
  menu: { paddingVertical: space.md, paddingHorizontal: space.sm },
  menuItem: { alignSelf: "stretch", justifyContent: "flex-start" },
});
