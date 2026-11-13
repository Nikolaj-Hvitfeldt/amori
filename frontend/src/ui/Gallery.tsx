/**
 * Dev-only primitives gallery (Phase 2). Open the web dev server with ?gallery=1.
 *
 * Loaded ONLY through the __DEV__-guarded require in App.tsx and never exported
 * from ./index, so production bundles don't contain it. Uses synthetic data and
 * the bundled fixture photos only; nothing here touches the network.
 */
import React, { useMemo, useRef, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { color, gutter, motion, radius, space, webFrame } from "../theme";
import type { SectionKey } from "../theme";
import type { DateMood } from "../types/dates";
import { FIXTURE_PHOTO_PREFIX, FixturePhotoName, fixtureDates, fixtureMilestones, fixtureMoments } from "../fixtures";
import { fixturePhotoModules } from "../fixtures/assets";
import {
  AddButton,
  Button,
  Chip,
  Collapsible,
  ConfirmDialog,
  DaysTogetherHero,
  EMPTY_COPY,
  EmptySlip,
  ErrorSlip,
  FormSheet,
  Header,
  ImageOff,
  Input,
  MILESTONE_TYPES,
  MilestoneTypeTag,
  MOODS,
  MoodTag,
  moodIcons,
  PaperPrint,
  Polaroid,
  SavedCopyNote,
  SaveState,
  ScreenBackground,
  SelectSheet,
  Skeleton,
  Text,
  Thread,
  ThreadItem,
  UploadRing,
  haptics,
  useNavLock,
  useReducedEffects,
} from "./index";
import type { PhotoSource } from "./PhotoImage";
import type { TextTone } from "./Text";
import type { TypeRole } from "../theme";
import { X, Ellipsis } from "lucide-react-native";
import { ICON_STROKE, iconSize } from "./icons";

const GALLERY_TITLE = "Primitives gallery";

function fixturePhoto(ref: string | undefined): PhotoSource | null {
  if (!ref || !ref.startsWith(FIXTURE_PHOTO_PREFIX)) return null;
  const name = ref.slice(FIXTURE_PHOTO_PREFIX.length) as FixturePhotoName;
  return fixturePhotoModules[name] ?? null;
}

/** Fixture entries mapped onto the generic thread item: a mix of photo and text-only prints. */
function threadItems(): ThreadItem[] {
  return [
    ...fixtureMoments.map<ThreadItem>((m) => ({
      id: m.id ?? m.title,
      type: "moment",
      date: m.story_date,
      title: m.title,
      coverPhoto: fixturePhoto(m.photos?.[0]),
      body: m.description,
    })),
    ...fixtureDates.map<ThreadItem>((d) => ({
      id: d.id,
      type: "date",
      date: d.date,
      title: d.title ?? d.location,
      coverPhoto: fixturePhoto(d.photos?.[0]),
      chip: { kind: "mood", value: d.mood },
    })),
    ...fixtureMilestones.map<ThreadItem>((m) => ({
      id: m.id,
      type: "milestone",
      date: m.date,
      title: m.title,
      coverPhoto: fixturePhoto(m.photos?.[0]),
      chip: { kind: "milestone", value: m.milestone_type },
    })),
  ];
}

const TYPE_ROLES: TypeRole[] = ["hero", "display", "title", "heading", "body", "date", "caption", "tabLabel"];
const TONES: TextTone[] = ["text", "muted", "accent"];
const SECTIONS: SectionKey[] = ["story", "moments", "dates", "milestones"];
const SAVE_STATES: SaveState[] = ["idle", "saving", "saved", "error"];

function GallerySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="heading" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

function Paper({ children }: { children: React.ReactNode }) {
  return <View style={styles.paper}>{children}</View>;
}

export default function Gallery() {
  const { width } = useWindowDimensions();
  const reduced = useReducedEffects();
  const guard = useNavLock();
  const [taps, setTaps] = useState(0);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const [mood, setMood] = useState<DateMood>("cozy");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [chipOn, setChipOn] = useState<Record<string, boolean>>({ dates: true });
  const [demoState, setDemoState] = useState<SaveState>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const items = useMemo(threadItems, []);
  const dirty = title.length > 0 || notes.length > 0;

  const closeSheet = () => {
    timers.current.forEach(clearTimeout);
    setSheetOpen(false);
    setConfirmOpen(false);
    setSaveState("idle");
    setTitle("");
    setNotes("");
  };

  // Simulated save. The screen (here: the gallery) owns the guard, not Button.
  const save = () => {
    if (saveState === "saving") return;
    if (!title.trim()) {
      setSaveState("error");
      return;
    }
    setSaveState("saving");
    timers.current.push(
      setTimeout(() => {
        setSaveState("saved");
        haptics.success();
        timers.current.push(setTimeout(closeSheet, motion.savedHold));
      }, 900)
    );
  };

  const cycleDemo = () => setDemoState((s) => SAVE_STATES[(SAVE_STATES.indexOf(s) + 1) % SAVE_STATES.length]);

  const header = (
    <View>
      <Header
        title={GALLERY_TITLE}
        tagline={`Candlelit Scrapbook, ${Math.round(width)}px${reduced ? ", reduced effects" : ""}`}
        section="story"
      />

      <GallerySection title="Days-together hero">
        <DaysTogetherHero milestones={fixtureMilestones} />
        <DaysTogetherHero milestones={[{ milestone_type: "met", date: "2021-09-18" }]} today={new Date(2026, 8, 18)} />
        <DaysTogetherHero milestones={[{ milestone_type: "met", date: "2024-01-01" }]} today={new Date(2026, 8, 27)} />
        <DaysTogetherHero milestones={[{ milestone_type: "met", date: "2026-11-13" }]} today={new Date(2026, 10, 13)} />
        <Text variant="caption" tone="muted" style={styles.pad}>
          Today, an anniversary, a round 1,000 and day 0. No met milestone renders nothing.
        </Text>
      </GallerySection>

      <GallerySection title="Headers">
        {(["story", "moments", "dates", "milestones", "wall"] as SectionKey[]).map((s) => (
          <Header
            key={s}
            section={s}
            title={{ story: "Our story", moments: "Moments", dates: "Dates", milestones: "Milestones", wall: "Memory wall" }[s]}
            tagline={s === "story" ? "Every little chapter, kept" : undefined}
            right={
              s === "dates" ? (
                <Button
                  variant="icon"
                  accessibilityLabel="More options"
                  icon={<Ellipsis size={iconSize.lg} color={color.text} strokeWidth={ICON_STROKE} />}
                />
              ) : undefined
            }
          />
        ))}
      </GallerySection>

      <GallerySection title="Text">
        {TYPE_ROLES.map((v) => (
          <Text key={v} variant={v} numberOfLines={1}>
            {v === "hero" ? "1,882" : `${v}: The quiet hour`}
          </Text>
        ))}
        <Row>
          {TONES.map((t) => (
            <Text key={t} variant="body" tone={t}>
              {t}
            </Text>
          ))}
          {SECTIONS.map((s) => (
            <Text key={s} variant="body" tone="section" section={s}>
              {s}
            </Text>
          ))}
        </Row>
        <Paper>
          <Text variant="title" tone="ink">
            Ink on paper
          </Text>
          <Text variant="date" tone="inkMuted">
            24 October 2026
          </Text>
          <Row>
            {SECTIONS.map((s) => (
              <Text key={s} variant="body" tone="section" section={s} onPaper>
                {s}
              </Text>
            ))}
          </Row>
        </Paper>
        <Text variant="caption" tone="muted" uppercase>
          Field label
        </Text>
      </GallerySection>

      <GallerySection title="Buttons">
        <Row>
          <Button variant="primary" label="Primary" onPress={() => undefined} />
          <Button variant="secondary" label="Secondary" onPress={() => undefined} />
          <Button variant="text" label="Text" onPress={() => undefined} />
          <Button
            variant="icon"
            accessibilityLabel="Close"
            icon={<X size={iconSize.lg} color={color.text} strokeWidth={ICON_STROKE} />}
            onPress={() => undefined}
          />
          <Button variant="primary" label="Disabled" disabled />
        </Row>
        <Text variant="caption" tone="muted">
          saveState
        </Text>
        <Row>
          {SAVE_STATES.map((s) => (
            <Button key={s} variant="primary" saveState={s} onPress={() => undefined} />
          ))}
        </Row>
        <Row>
          <Button variant="primary" saveState={demoState} onPress={cycleDemo} />
          <Text variant="caption" tone="muted">
            Tap to cycle
          </Text>
        </Row>
        <Row>
          <Button
            variant="secondary"
            label={`Nav-locked (${taps})`}
            onPress={guard(() => {
              haptics.navigate();
              setTaps((n) => n + 1);
            })}
          />
          <Text variant="caption" tone="muted">
            Double-tap counts once
          </Text>
        </Row>
      </GallerySection>

      <GallerySection title="Inputs">
        <Input label="Title" placeholder="Pasta night" />
        <Input label="Description" placeholder="What happened?" multiline />
        <Input label="Location" value="Willowmere Canal" error="Couldn't find that place. Check the spelling." onChangeText={() => undefined} />
      </GallerySection>

      <GallerySection title="Chips">
        <Row>
          {SECTIONS.map((s) => (
            <Chip
              key={s}
              label={s}
              section={s}
              selected={!!chipOn[s]}
              onPress={() => setChipOn((c) => ({ ...c, [s]: !c[s] }))}
            />
          ))}
        </Row>
        <Text variant="caption" tone="muted">
          Moods (Dates, lavender)
        </Text>
        <Row>
          {MOODS.map((m) => (
            <MoodTag key={m} mood={m} selected={m === mood} role="radio" onPress={() => setMood(m)} />
          ))}
        </Row>
        <Text variant="caption" tone="muted">
          Milestone types (Milestones, sage)
        </Text>
        <Row>
          {MILESTONE_TYPES.map((t, i) => (
            <MilestoneTypeTag key={t} type={t} selected={i === 0} />
          ))}
        </Row>
        <Paper>
          <Row>
            {MOODS.map((m) => (
              <MoodTag key={m} mood={m} onPaper />
            ))}
            {MILESTONE_TYPES.map((t) => (
              <MilestoneTypeTag key={t} type={t} onPaper />
            ))}
          </Row>
        </Paper>
      </GallerySection>

      <GallerySection title="Collapsible">
        <Collapsible summary="Location, highlights, weather, favourite moment">
          <Input label="Location" placeholder="Where were you?" />
          <Input label="Weather" placeholder="Clear and cold" />
        </Collapsible>
      </GallerySection>

      <GallerySection title="Sheets and dialog">
        <Row>
          <Button variant="primary" label="Open form sheet" onPress={() => setSheetOpen(true)} />
          <Button variant="secondary" label="Open select sheet" onPress={() => setSelectOpen(true)} />
          <Button variant="secondary" label="Open dialog" onPress={() => setDialogOpen(true)} />
        </Row>
        <Text variant="caption" tone="muted">
          {`Mood: ${moodIcons[mood].label}. Save with an empty title shows Retry.`}
        </Text>
      </GallerySection>

      <GallerySection title="Polaroids">
        <View style={styles.polaroids}>
          {fixtureDates
            .filter((d) => d.photos && d.photos.length > 0)
            .map((d) => (
              <View key={d.id} style={styles.polaroidCell}>
                <Polaroid
                  id={d.id}
                  title={d.title ?? d.location}
                  date={d.date}
                  photo={fixturePhoto(d.photos?.[0]) as PhotoSource}
                  onPress={() => undefined}
                />
              </View>
            ))}
        </View>
      </GallerySection>

      <GallerySection title="Paper print">
        <PaperPrint
          type="date"
          title="Pasta night"
          date="2026-10-24"
          body="Text-only print: no photo, so no photo block."
          chip={<MoodTag mood="romantic" onPaper />}
          onPress={() => undefined}
        />
      </GallerySection>

      <GallerySection title="Thread">
        <Text variant="caption" tone="muted">
          Moments, dates and milestones from the fixtures, newest first.
        </Text>
      </GallerySection>
    </View>
  );

  const footer = (
    <View>
      <GallerySection title="States: loading">
        <Skeleton count={3} />
      </GallerySection>
      <GallerySection title="States: empty">
        <EmptySlip message={EMPTY_COPY.story.message} actionLabel={EMPTY_COPY.story.action} onAction={() => undefined} />
        <EmptySlip message={EMPTY_COPY.dates.message} actionLabel={EMPTY_COPY.dates.action} onAction={() => undefined} />
      </GallerySection>
      <GallerySection title="States: error">
        <ErrorSlip what="your story" onRetry={() => undefined} showingSavedCopy />
        <SavedCopyNote />
      </GallerySection>
      <GallerySection title="States: partial and upload">
        <Row>
          <ImageOff style={styles.thumb} />
          <UploadRing photo={fixturePhotoModules["photo-2"]} progress={0.35} />
          <UploadRing photo={fixturePhotoModules["photo-5"]} progress={0.8} />
        </Row>
      </GallerySection>
      <View style={styles.bottomSpace} />
    </View>
  );

  return (
    <ScreenBackground>
      <Thread
        items={items}
        onPressItem={guard(() => haptics.navigate())}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        contentContainerStyle={styles.column}
      />
      <AddButton accessibilityLabel="Add a moment" onPress={() => setSheetOpen(true)} />

      <FormSheet
        visible={sheetOpen}
        title="New date"
        saveState={saveState}
        error={saveState === "error" ? "Give it a title before saving." : null}
        onSave={save}
        onRequestClose={() => (dirty && saveState !== "saved" ? setConfirmOpen(true) : closeSheet())}
      >
        <Input label="Title" placeholder="Pasta night" value={title} onChangeText={setTitle} />
        <View>
          <Text variant="caption" tone="muted" uppercase style={styles.labelGap}>
            Mood
          </Text>
          <Row>
            {MOODS.map((m) => (
              <MoodTag key={m} mood={m} selected={m === mood} role="radio" onPress={() => setMood(m)} />
            ))}
          </Row>
        </View>
        <Input label="Description" multiline value={notes} onChangeText={setNotes} />
        <Collapsible summary="Location, highlights, weather, favourite moment">
          <Input label="Location" />
          <Input label="Highlights" />
          <Input label="Weather" />
          <Input label="Favourite moment" multiline />
        </Collapsible>
      </FormSheet>

      <ConfirmDialog
        visible={confirmOpen}
        title="Discard this date?"
        message="Your changes won't be saved."
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          haptics.warning();
          closeSheet();
        }}
      />
      <ConfirmDialog
        visible={dialogOpen}
        title="Discard this moment?"
        onCancel={() => setDialogOpen(false)}
        onConfirm={() => setDialogOpen(false)}
      />
      <SelectSheet
        visible={selectOpen}
        title="Mood"
        value={mood}
        options={MOODS.map((m) => ({ value: m, label: moodIcons[m].label, icon: moodIcons[m].Icon }))}
        onSelect={(m) => {
          setMood(m);
          setSelectOpen(false);
        }}
        onRequestClose={() => setSelectOpen(false)}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  column: {
    width: "100%",
    maxWidth: webFrame.column,
    alignSelf: "center",
    paddingHorizontal: gutter,
  },
  section: { gap: space.md, paddingVertical: space.xl, borderTopWidth: 1, borderTopColor: color.hairline },
  sectionTitle: { marginBottom: space.xs },
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: space.sm },
  paper: { backgroundColor: color.paper, padding: space.lg, gap: space.sm, borderRadius: radius.print },
  polaroids: { flexDirection: "row", flexWrap: "wrap", gap: space.xl, paddingTop: space.md },
  polaroidCell: { width: "45%" },
  thumb: { width: space.xxxl + space.xl },
  pad: { paddingHorizontal: gutter },
  labelGap: { marginBottom: space.sm },
  bottomSpace: { height: space.xxxl * 2 },
});
