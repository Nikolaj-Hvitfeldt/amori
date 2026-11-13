import { describe, expect, it } from "@jest/globals";
import * as fixtures from "../fixtures";
import { fixtureDates, fixtureMilestones, fixtureMoments } from "../fixtures";

function allStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => allStrings(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => allStrings(v, out));
  return out;
}

describe("fixtures [E4]", () => {
  it("contain no http(s) URLs", () => {
    const offenders = allStrings(fixtures).filter((s) => /https?:\/\//i.test(s));
    expect(offenders).toEqual([]);
  });

  it("reference only bundled fixture photos", () => {
    const photos = [...fixtureMoments, ...fixtureDates, ...fixtureMilestones].flatMap(
      (entry) => entry.photos ?? []
    );
    expect(photos.length).toBeGreaterThan(0);
    for (const photo of photos) {
      expect(photo).toMatch(/^fixture:(photo-[1-6]|placeholder)$/);
    }
  });

  it("cover every mood, every milestone type and a 'met' milestone years back", () => {
    expect(new Set(fixtureDates.map((d) => d.mood)).size).toBe(6);
    expect(new Set(fixtureMilestones.map((m) => m.milestone_type)).size).toBe(8);
    const met = fixtureMilestones.find((m) => m.milestone_type === "met");
    expect(met && new Date(met.date).getFullYear()).toBeLessThanOrEqual(2023);
  });

  it("include entries with and without photos", () => {
    for (const list of [fixtureMoments, fixtureDates, fixtureMilestones]) {
      expect(list.some((e) => (e.photos ?? []).length > 0)).toBe(true);
      expect(list.some((e) => (e.photos ?? []).length === 0)).toBe(true);
    }
  });
});
