import React, { useState } from "react";
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Ellipsis, Pencil, Trash2, X } from "lucide-react-native";
import { Moment } from "../types/moments";
import { color, field, gutter, hitTarget, radius, space } from "../theme";
import { Button, ICON_STROKE, PhotoImage, ScreenBackground, Text, formatLongDate, iconSize } from "../ui";
import { a11yHidden } from "../ui/styles";
import { filterValidPhotos } from "../hooks/useMomentForm";

interface MomentDetailViewProps {
  moment: Moment;
  onClose: () => void;
  onEdit: () => void;
  allowEdit?: boolean;
  /** Shown in the ⋯ menu next to Edit when given (and allowEdit). The caller owns the confirmation. */
  onDelete?: () => void;
}

/** Hero photo aspect (width / height). Matches the list print's cover photo. */
const HERO_ASPECT = 4 / 3;

/**
 * Moment detail [1A]: photo hero (every photo, paged; omitted without photos),
 * title, italic date, then the description. Edit and Delete live in a ⋯ menu.
 */
export default function MomentDetailView({
  moment,
  onClose,
  onEdit,
  allowEdit = true,
  onDelete,
}: MomentDetailViewProps) {
  const photos = filterValidPhotos(moment.photos || []);
  const [menuOpen, setMenuOpen] = useState(false);
  const showMenu = allowEdit;

  return (
    <ScreenBackground>
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
            accessibilityHint="Edit or delete this moment"
            icon={<Ellipsis size={iconSize.lg} color={color.text} strokeWidth={ICON_STROKE} />}
            onPress={() => setMenuOpen((o) => !o)}
          />
        ) : null}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {photos.length > 0 ? <PhotoHero photos={photos} title={moment.title} /> : null}
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
              Icon={Pencil}
              onPress={() => {
                setMenuOpen(false);
                onEdit();
              }}
            />
            {onDelete ? (
              <MenuItem
                label="Delete"
                Icon={Trash2}
                onPress={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
              />
            ) : null}
          </View>
        </>
      ) : null}
    </ScreenBackground>
  );
}

function MenuItem({
  label,
  Icon,
  onPress,
}: {
  label: string;
  Icon: typeof Pencil;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="menuitem"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
    >
      <Icon size={iconSize.md} color={color.text} strokeWidth={ICON_STROKE} />
      <Text variant="body">{label}</Text>
    </Pressable>
  );
}

/** Every photo of the moment, paged horizontally [4A]. */
function PhotoHero({ photos, title }: { photos: string[]; title: string }) {
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) return;
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== index) setIndex(next);
  };

  return (
    <View onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {photos.map((photo, i) => (
            <PhotoImage
              key={`${photo}-${i}`}
              source={photo}
              accessibilityLabel={
                photos.length > 1 ? `Photo ${i + 1} of ${photos.length} from ${title}` : `Photo from ${title}`
              }
              style={{ width, aspectRatio: HERO_ASPECT }}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.heroPlaceholder} />
      )}
      {photos.length > 1 ? (
        <View style={styles.dots} {...a11yHidden}>
          {photos.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const DOT = space.sm;

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
  heroPlaceholder: { aspectRatio: HERO_ASPECT },
  dots: { flexDirection: "row", justifyContent: "center", gap: space.sm, paddingTop: space.md },
  dot: { width: DOT, height: DOT, borderRadius: radius.pill, backgroundColor: color.outline },
  dotActive: { backgroundColor: color.accent },
  menu: {
    position: "absolute",
    top: space.sm + hitTarget,
    right: space.sm,
    minWidth: field.height * 3,
    backgroundColor: color.surfaceRaised,
    borderRadius: radius.field,
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
