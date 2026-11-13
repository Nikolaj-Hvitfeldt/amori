import { describe, expect, it, jest } from "@jest/globals";
import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { color, section, type } from "../theme";
import {
  Button,
  Chip,
  EmptySlip,
  ErrorSlip,
  Input,
  PaperPrint,
  Polaroid,
  SAVE_LABELS,
  Text,
  Thread,
  ThreadItem,
  groupByMonth,
  polaroidTilt,
} from "../ui";
import type { SaveState } from "../ui";

// jest-expo resolves lucide-react-native to its ESM build, which Jest doesn't
// transform (node_modules). Point it at the package's own CommonJS build instead.
jest.mock("lucide-react-native", () =>
  jest.requireActual(
    require("path").join(__dirname, "../../node_modules/lucide-react-native/dist/cjs/lucide-react-native.js")
  )
);

const flat =(style: unknown) => StyleSheet.flatten(style as never) as Record<string, unknown>;

describe("Text", () => {
  it.each(["display", "title", "heading"] as const)("%s is announced as a header", async (variant) => {
    await render(<Text variant={variant}>Our story</Text>);
    expect(screen.getByRole("header", { name: "Our story" })).toBeTruthy();
  });

  it("body is not a header and uses the body role", async () => {
    await render(<Text>Plain</Text>);
    expect(screen.queryByRole("header")).toBeNull();
    const style = flat(screen.getByText("Plain").props.style);
    expect(style.fontSize).toBe(type.body.fontSize);
    expect(style.color).toBe(color.text);
  });

  it("applies tones and the hero Dynamic Type cap", async () => {
    await render(
      <>
        <Text variant="hero" tone="accent">
          42
        </Text>
        <Text tone="section" section="dates" onPaper>
          Ink
        </Text>
      </>
    );
    const hero = screen.getByText("42");
    expect(flat(hero.props.style).color).toBe(color.accent);
    expect(hero.props.maxFontSizeMultiplier).toBe(type.hero.maxFontSizeMultiplier);
    expect(flat(screen.getByText("Ink").props.style).color).toBe(section.dates.onPaper);
  });
});

describe("Button", () => {
  it.each(["idle", "saving", "saved", "error"] as SaveState[])("renders saveState %s", async (s) => {
    await render(<Button variant="primary" saveState={s} onPress={() => undefined} />);
    expect(screen.getByRole("button", { name: SAVE_LABELS[s] })).toBeTruthy();
  });

  it("maps the four save states to Save / Saving… / Saved / Retry", () => {
    expect(SAVE_LABELS).toEqual({ idle: "Save", saving: "Saving…", saved: "Saved", error: "Retry" });
  });

  it("has no guard of its own: presses while saving still reach the screen", async () => {
    const onPress = jest.fn();
    await render(<Button variant="primary" saveState="saving" onPress={onPress} />);
    await fireEvent.press(screen.getByRole("button"));
    await fireEvent.press(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it("renders primary, secondary, text and icon variants", async () => {
    await render(
      <>
        <Button variant="primary" label="Primary" />
        <Button variant="secondary" label="Secondary" />
        <Button variant="text" label="Text" />
        <Button variant="icon" accessibilityLabel="Close" icon={null} />
      </>
    );
    for (const name of ["Primary", "Secondary", "Text", "Close"]) {
      expect(screen.getByRole("button", { name })).toBeTruthy();
    }
    expect(flat(screen.getByText("Primary").props.style).color).toBe(color.onAccent);
  });
});

describe("Input", () => {
  it("renders the label above the field", async () => {
    await render(<Input label="Title" placeholder="Pasta night" />);
    const label = screen.getByText("Title");
    const field = screen.getByPlaceholderText("Pasta night");
    // Label and field share one container, label first.
    const container = label.parent!;
    expect(field.parent).toBe(container);
    const kids = container.children as unknown[];
    expect(kids.indexOf(label)).toBe(0);
    expect(kids.indexOf(field)).toBeGreaterThan(0);
    expect(field.props.accessibilityLabel).toBe("Title");
  });

  it("shows an inline error", async () => {
    await render(<Input label="Location" error="Couldn't find that place." />);
    expect(screen.getByText("Couldn't find that place.")).toBeTruthy();
  });
});

describe("Chip", () => {
  it("selected is filled with the section accent and onAccent text", async () => {
    await render(<Chip label="Cozy" section="dates" selected onPress={() => undefined} />);
    const chip = screen.getByRole("button", { name: "Cozy" });
    expect(flat(chip.props.style).backgroundColor).toBe(section.dates.onSurface);
    expect(flat(screen.getByText("Cozy").props.style).color).toBe(color.onAccent);
    expect(chip.props.accessibilityState).toMatchObject({ selected: true });
  });

  it("unselected is an outline in the accent", async () => {
    await render(<Chip label="Met" section="milestones" />);
    expect(flat(screen.getByText("Met").props.style).color).toBe(section.milestones.onSurface);
  });
});

describe("PaperPrint", () => {
  it("is one button with a combined label, and no photo block without a photo", async () => {
    await render(<PaperPrint type="date" title="Pasta night" date="2026-10-24" onPress={() => undefined} />);
    expect(screen.getByRole("button", { name: "Date, Pasta night, 24 October 2026" })).toBeTruthy();
    expect(screen.queryByTestId("print-photo")).toBeNull();
  });

  it("shows the cover photo above the text", async () => {
    await render(
      <PaperPrint type="moment" title="Paper boats" date="2026-08-21" coverPhoto="file:///boat.png" onPress={() => undefined} />
    );
    expect(screen.getByRole("button", { name: "Moment, Paper boats, 21 August 2026" })).toBeTruthy();
    const photo = screen.getByTestId("print-photo");
    const title = screen.getByText("Paper boats");
    expect(photo).toBeTruthy();
    expect(title.props.numberOfLines).toBe(2);
  });
});

describe("Polaroid", () => {
  it("tilt is stable for the same id and within ±2°", () => {
    const ids = Array.from({ length: 200 }, (_, i) => `fx-date-${i}`);
    for (const id of ids) {
      const t = polaroidTilt(id);
      expect(polaroidTilt(id)).toBe(t);
      expect(Math.abs(t)).toBeLessThanOrEqual(2);
    }
    expect(new Set(ids.map(polaroidTilt)).size).toBeGreaterThan(10);
  });

  it("is a button labelled with the title and date", async () => {
    await render(<Polaroid id="fx-date-1" title="Pasta night" date="2026-10-24" photo="file:///p.png" onPress={() => undefined} />);
    expect(screen.getByRole("button", { name: "Photo from Pasta night, 24 October 2026" })).toBeTruthy();
  });
});

describe("Thread", () => {
  const items: ThreadItem[] = [
    { id: "a", type: "moment", date: "2026-08-21", title: "Boats" },
    { id: "b", type: "date", date: "2026-10-18", title: "Lanterns", chip: { kind: "mood", value: "magical" } },
    { id: "c", type: "milestone", date: "2025-06-21", title: "Wedding", chip: { kind: "milestone", value: "wedding" } },
    { id: "d", type: "date", date: "2026-10-02", title: "Soup" },
    { id: "e", type: "moment", date: "2026-08-30", title: "Fort" },
  ];

  it("groups by month, newest first", () => {
    const sections = groupByMonth(items);
    expect(sections.map((s) => s.title)).toEqual(["October 2026", "August 2026", "June 2025"]);
    expect(sections.map((s) => s.data.map((i) => i.id))).toEqual([["b", "d"], ["e", "a"], ["c"]]);
  });

  it("renders month labels and one print per item", async () => {
    const onPress = jest.fn();
    await render(<Thread items={items} onPressItem={onPress} />);
    expect(screen.getByText("October 2026")).toBeTruthy();
    expect(screen.getByText("August 2026")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Date, Lanterns, 18 October 2026" }));
    expect(onPress).toHaveBeenCalledWith(items[1]);
  });
});

describe("EmptySlip and ErrorSlip", () => {
  it("EmptySlip shows the copy and an Add button", async () => {
    const onAction = jest.fn();
    await render(<EmptySlip message="No dates yet. The next one goes here." actionLabel="Add a date" onAction={onAction} />);
    expect(screen.getByText("No dates yet. The next one goes here.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Add a date" }));
    expect(onAction).toHaveBeenCalled();
  });

  it("ErrorSlip shows the message, Try again, and the saved-copy note", async () => {
    const onRetry = jest.fn();
    await render(<ErrorSlip what="your story" onRetry={onRetry} showingSavedCopy />);
    expect(screen.getByText("Couldn't reach your story. Check your connection.")).toBeTruthy();
    expect(screen.getByText("Showing your saved copy")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalled();
  });
});

describe("DaysTogetherHero", () => {
  it("reads N days together and hides without a met milestone", async () => {
    const { DaysTogetherHero } = require("../ui") as typeof import("../ui");
    await render(<DaysTogetherHero milestones={[{ milestone_type: "met", date: "2026-11-01" }]} today={new Date(2026, 10, 13)} />);
    expect(screen.getByLabelText("12 days together")).toBeTruthy();
    expect(screen.getByText("12")).toBeTruthy();
    await render(<DaysTogetherHero milestones={[]} today={new Date(2026, 10, 13)} />);
    expect(screen.queryByTestId("days-together-hero")).toBeNull();
  });
});

describe("useNavLock", () => {
  it("ignores repeat calls inside the lock window", async () => {
    const { useNavLock } = require("../ui") as typeof import("../ui");
    jest.useFakeTimers();
    const fn = jest.fn();
    let guarded: () => void = () => undefined;
    function Probe() {
      guarded = useNavLock()(fn);
      return null;
    }
    await render(<Probe />);
    guarded();
    guarded();
    expect(fn).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(600);
    guarded();
    expect(fn).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });
});
