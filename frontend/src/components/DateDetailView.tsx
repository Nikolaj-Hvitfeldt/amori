import React, { useState } from "react";
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ellipsis, Pencil, Trash2, X } from "lucide-react-native";
import { DateEntry } from "../types/dates";
import { color, gutter, hitTarget, polaroid, radius, space } from "../theme";
import { Button, ICON_STROKE, MoodTag, PhotoImage, Text, formatLongDate, iconSize, paperLift } from "../ui";
import { parseLocalDate } from "../utils/daysTogether";

interface DateDetailViewProps {
  dateEntry: DateEntry;
  onClose: () => void;
  onEdit: () => void;
  allowEdit?: boolean;
  /** Shown in the ⋯ menu next to Edit when given. The caller owns the confirmation. */
  onDelete?: () => void;
}

/** Hero photo aspect (width / height). */
const HERO_ASPECT = 4 / 3;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysSince(dateString: string): number {
  const d = parseLocalDate(dateString);
  const date = d ? new Date(d.year, d.month - 1, d.day) : new Date(dateString);
  const diff = Math.abs(Date.now() - date.getTime());
  return Math.floor(diff / MS_PER_DAY);
}

function daysAgo(dateString: string): string {
  const diffDays = daysSince(dateString);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? "month" : "months"} ago`;
  }
  const years = Math.floor(diffDays / 365);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
}

/**
 * Date detail [1A]: photo hero (all photos, swipeable), title, italic date,
 * mood tag, then place, highlights and weather, the favourite moment as a paper
 * note, and the description. Edit and Delete live in the ⋯ menu.
 */
export default function DateDetailView({ dateEntry, onClose, onEdit, allowEdit = true, onDelete }: DateDetailViewProps) {
  const [heroWidth, setHeroWidth] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  // Support both photos array and single image_url for backward compatibility
  const photos =
    dateEntry.photos && dateEntry.photos.length > 0
      ? dateEntry.photos
      : dateEntry.image_url
      ? [dateEntry.image_url]
      : [];

  const title = dateEntry.title || formatLongDate(dateEntry.date);
  const highlights = (dateEntry.highlights || []).filter((h) => h && h.trim() !== "");
  const showMenu = allowEdit;

  const onHeroScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!heroWidth) return;
    const i = Math.round(e.nativeEvent.contentOffset.x / heroWidth);
    if (i !== photoIndex) setPhotoIndex(i);
  };

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        <Button
          variant="icon"
          accessibilityLabel="Close"
          icon={<X size={iconSize.lg} color={color.text} strokeWidth={ICON_STROKE} />}
          onPress={onClose}
        />
        {showMenu ? (
          <Button
            variant="icon"
            accessibilityLabel="More options"
            accessibilityHint="Edit or delete this date"
            icon={<Ellipsis size={iconSize.lg} color={color.text} strokeWidth={ICON_STROKE} />}
            onPress={() => setMenuOpen((o) => !o)}
          />
        ) : null}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {photos.length > 0 ? (
          <View onLayout={(e) => setHeroWidth(e.nativeEvent.layout.width)}>
            {heroWidth === 0 ? <View style={styles.hero} /> : null}
            {heroWidth > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onHeroScroll}
              scrollEventThrottle={16}
            >
              {photos.map((photo, index) => (
                <PhotoImage
                  key={`${photo}-${index}`}
                  source={photo}
                  accessibilityLabel={`Photo ${index + 1} of ${photos.length} from ${title}`}
                  style={[styles.hero, { width: heroWidth }]}
                />
              ))}
            </ScrollView>
            ) : null}
            {photos.length > 1 ? (
              <Text variant="caption" tone="muted" style={styles.counter} accessibilityLiveRegion="polite">
                {`${photoIndex + 1} / ${photos.length}`}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.body}>
          <View style={styles.titleBlock}>
            <Text variant="title">{title}</Text>
            <Text variant="date" tone="muted">
              {`${formatLongDate(dateEntry.date)} · ${daysAgo(dateEntry.date)}`}
            </Text>
          </View>

          <MoodTag mood={dateEntry.mood} />

          {dateEntry.location ? (
            <Field label="Place">
              <Text variant="body">{dateEntry.location}</Text>
            </Field>
          ) : null}

          {highlights.length > 0 ? (
            <Field label="Highlights">
              <View style={styles.list}>
                {highlights.map((highlight, index) => (
                  <View key={index} style={styles.highlightRow}>
                    <View style={styles.bullet} />
                    <Text variant="body" style={styles.flex}>
                      {highlight}
                    </Text>
                  </View>
                ))}
              </View>
            </Field>
          ) : null}

          {dateEntry.weather ? (
            <Field label="Weather">
              <Text variant="body">{dateEntry.weather}</Text>
            </Field>
          ) : null}

          {dateEntry.favorite_moment ? (
            <View style={[styles.note, paperLift]}>
              <View pointerEvents="none" style={styles.tape} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
              <Text variant="caption" tone="inkMuted" uppercase>
                Favourite moment
              </Text>
              <Text variant="body" tone="ink">
                {dateEntry.favorite_moment}
              </Text>
            </View>
          ) : null}

          <Field label="Description">
            <Text variant="body" tone={dateEntry.description ? "text" : "muted"}>
              {dateEntry.description || "No story written for this date."}
            </Text>
          </Field>
        </View>
      </ScrollView>

      {menuOpen ? (
        <>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setMenuOpen(false)}
            accessible={false}
            focusable={false}
            importantForAccessibility="no"
          />
          <View style={styles.menu} accessibilityRole="menu">
            <MenuItem
              label="Edit"
              icon={<Pencil size={iconSize.md} color={color.text} strokeWidth={ICON_STROKE} />}
              onPress={() => {
                setMenuOpen(false);
                onEdit();
              }}
            />
            {onDelete ? (
              <MenuItem
                label="Delete"
                icon={<Trash2 size={iconSize.md} color={color.text} strokeWidth={ICON_STROKE} />}
                onPress={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
              />
            ) : null}
          </View>
        </>
      ) : null}
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text variant="caption" tone="muted" uppercase>
        {label}
      </Text>
      {children}
    </View>
  );
}

function MenuItem({ label, icon, onPress }: { label: string; icon: React.ReactNode; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="menuitem"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
    >
      {icon}
      <Text variant="body">{label}</Text>
    </Pressable>
  );
}

const MENU_WIDTH = 180;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.surface },
  bar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: space.sm,
    paddingVertical: space.sm,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: space.xxxl },
  hero: { width: "100%", aspectRatio: HERO_ASPECT },
  counter: { textAlign: "center", marginTop: space.sm },
  body: { paddingHorizontal: gutter, paddingTop: space.xl, gap: space.xl },
  titleBlock: { gap: space.xs },
  field: { gap: space.sm },
  list: { gap: space.sm },
  highlightRow: { flexDirection: "row", alignItems: "flex-start", gap: space.md },
  bullet: {
    width: space.sm,
    height: space.sm,
    borderRadius: radius.pill,
    marginTop: space.sm,
    backgroundColor: color.textMuted,
  },
  flex: { flex: 1 },
  note: {
    backgroundColor: color.paper,
    borderRadius: radius.print,
    paddingHorizontal: space.lg,
    paddingTop: space.xl,
    paddingBottom: space.lg,
    gap: space.sm,
  },
  tape: {
    position: "absolute",
    top: -polaroid.tape.height / 2,
    left: "50%",
    marginLeft: -polaroid.tape.width / 2,
    width: polaroid.tape.width,
    height: polaroid.tape.height,
    backgroundColor: color.tape,
  },
  menu: {
    position: "absolute",
    top: space.sm + hitTarget,
    right: space.sm,
    width: MENU_WIDTH,
    backgroundColor: color.surfaceRaised,
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: color.outline,
    paddingVertical: space.xs,
  },
  menuItem: {
    minHeight: hitTarget,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingHorizontal: space.lg,
  },
  menuItemPressed: { backgroundColor: color.outline },
});
