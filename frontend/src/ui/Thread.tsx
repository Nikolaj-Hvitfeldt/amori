import React, { useCallback, useMemo } from "react";
import {
  SectionList,
  SectionListData,
  SectionListRenderItemInfo,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import type { DateMood } from "../types/dates";
import type { MilestoneType } from "../types/milestones";
import { color, entrySection, radius, section as sectionColors, space } from "../theme";
import { calendarDaysBetween, parseLocalDate } from "../utils/daysTogether";
import { formatMonth, monthKey } from "./format";
import { EntryType, PaperPrint } from "./PaperPrint";
import type { PhotoSource } from "./PhotoImage";
import { a11yHidden } from "./styles";
import { MilestoneTypeTag, MoodTag } from "./Tags";
import { Text } from "./Text";

export type ThreadChip = { kind: "mood"; value: DateMood } | { kind: "milestone"; value: MilestoneType };

/** The generic thread item. Screens map Moments, Dates and Milestones onto this. */
export type ThreadItem = {
  id: string;
  type: EntryType;
  /** Calendar date, "YYYY-MM-DD". */
  date: string;
  title: string;
  coverPhoto?: PhotoSource | null;
  chip?: ThreadChip;
  body?: string;
};

export type ThreadSection = { key: string; title: string; data: ThreadItem[] };

const UNDATED = "Undated";
const EPOCH = { year: 1970, month: 1, day: 1 };

function sortValue(item: ThreadItem): number {
  const d = parseLocalDate(item.date);
  return d ? calendarDaysBetween(EPOCH, d) : Number.NEGATIVE_INFINITY;
}

/** Groups items by calendar month, newest first. Undated items go last. Pure, for tests. */
export function groupByMonth(items: ReadonlyArray<ThreadItem>): ThreadSection[] {
  const sorted = items
    .map((item, index) => ({ item, index, v: sortValue(item) }))
    .sort((a, b) => (b.v === a.v ? a.index - b.index : b.v - a.v))
    .map((x) => x.item);
  const sections: ThreadSection[] = [];
  for (const item of sorted) {
    const key = monthKey(item.date) || UNDATED;
    const last = sections[sections.length - 1];
    if (last && last.key === key) last.data.push(item);
    else sections.push({ key, title: key === UNDATED ? UNDATED : formatMonth(item.date), data: [item] });
  }
  return sections;
}

export type ThreadProps = {
  items: ReadonlyArray<ThreadItem>;
  onPressItem?: (item: ThreadItem) => void;
  ListHeaderComponent?: React.ComponentType | React.ReactElement | null;
  ListFooterComponent?: React.ComponentType | React.ReactElement | null;
  ListEmptyComponent?: React.ComponentType | React.ReactElement | null;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  scrollEnabled?: boolean;
  testID?: string;
};

/** Thread rail geometry. Not in theme yet (reported as a token gap). */
const THREAD_WIDTH = 2;
const RAIL = space.xl;
const DOT = space.md;

/**
 * The thread [1A, T3]: ONE component for Story and the Moments, Dates and
 * Milestones lists. Items are grouped by month (italic serif labels), newest
 * first, along a vertical amber thread with one dot per item in its section
 * colour. Each item is a PaperPrint. Wraps SectionList, so it virtualizes.
 */
export function Thread({
  items,
  onPressItem,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  onEndReached,
  onEndReachedThreshold = 0.5,
  refreshing,
  onRefresh,
  contentContainerStyle,
  style,
  scrollEnabled,
  testID,
}: ThreadProps) {
  const sections = useMemo(() => groupByMonth(items), [items]);

  const renderItem = useCallback(
    ({ item }: SectionListRenderItemInfo<ThreadItem, ThreadSection>) => (
      <View style={styles.row}>
        <View style={styles.rail} pointerEvents="none" {...a11yHidden}>
          <View style={styles.line} />
          <View style={[styles.dot, { backgroundColor: sectionColors[entrySection[item.type]].onSurface }]} />
        </View>
        <View style={styles.content}>
          <PaperPrint
            type={item.type}
            title={item.title}
            date={item.date}
            coverPhoto={item.coverPhoto}
            body={item.body}
            chip={renderChip(item.chip)}
            onPress={onPressItem ? () => onPressItem(item) : undefined}
            testID={`thread-item-${item.id}`}
          />
        </View>
      </View>
    ),
    [onPressItem]
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionListData<ThreadItem, ThreadSection> }) => (
      <View style={styles.row}>
        <View style={styles.rail} pointerEvents="none" {...a11yHidden}>
          <View style={styles.line} />
        </View>
        <View style={styles.monthLabel}>
          <Text variant="date" tone="muted" accessibilityRole="header" testID={`thread-month-${section.key}`}>
            {section.title}
          </Text>
        </View>
      </View>
    ),
    []
  );

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => `${item.type}-${item.id}`}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      refreshing={onRefresh ? !!refreshing : undefined}
      onRefresh={onRefresh}
      contentContainerStyle={contentContainerStyle}
      style={style}
      scrollEnabled={scrollEnabled}
      initialNumToRender={8}
      windowSize={7}
      testID={testID}
    />
  );
}

function renderChip(chip: ThreadChip | undefined): React.ReactNode {
  if (!chip) return null;
  return chip.kind === "mood" ? <MoodTag mood={chip.value} onPaper /> : <MilestoneTypeTag type={chip.value} onPaper />;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row" },
  rail: { width: RAIL, alignItems: "center" },
  line: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: THREAD_WIDTH,
    backgroundColor: color.thread,
  },
  dot: {
    marginTop: space.xl,
    width: DOT,
    height: DOT,
    borderRadius: radius.pill,
  },
  content: { flex: 1, paddingLeft: space.md, paddingBottom: space.xl },
  monthLabel: { flex: 1, paddingLeft: space.md, paddingTop: space.sm, paddingBottom: space.md },
});
