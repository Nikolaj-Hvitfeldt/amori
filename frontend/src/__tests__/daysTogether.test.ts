import { describe, expect, it } from "@jest/globals";
import {
  calendarDaysBetween,
  daysTogether,
  findMetDate,
  formatCount,
  parseLocalDate,
} from "../utils/daysTogether";

const met = (date: string, milestone_type = "met") => ({ milestone_type, date });
/** Local wall-clock date; month is 1–12. */
const local = (y: number, m: number, d: number, h = 12, min = 0) => new Date(y, m - 1, d, h, min);

describe("daysTogether", () => {
  it("returns null with no met milestone", () => {
    expect(daysTogether([], local(2026, 11, 13))).toBeNull();
    expect(daysTogether([met("2020-01-01", "first_date")], local(2026, 11, 13))).toBeNull();
  });

  it("ignores invalid met dates and returns null when none is valid", () => {
    expect(daysTogether([met("not a date"), met("2021-02-30")], local(2026, 11, 13))).toBeNull();
    expect(daysTogether([met("garbage"), met("2026-11-12")], local(2026, 11, 13))?.days).toBe(1);
  });

  it("uses the earliest of several met milestones", () => {
    const list = [met("2023-05-01"), met("2021-09-18"), met("2024-01-01"), met("2019-01-01", "custom")];
    expect(findMetDate(list)).toEqual({ year: 2021, month: 9, day: 18 });
    expect(daysTogether(list, local(2021, 9, 28))?.days).toBe(10);
  });

  it("treats the met day as day 0, shown as Today", () => {
    const r = daysTogether([met("2026-11-13")], local(2026, 11, 13, 23, 59));
    expect(r).toMatchObject({ days: 0, kind: "today", value: "Today", copy: "Today" });
    expect(r?.accessibilityLabel).toBe("0 days together");
  });

  it("returns null for a future met date", () => {
    expect(daysTogether([met("2026-11-14")], local(2026, 11, 13, 23, 59))).toBeNull();
  });

  it("counts plain days", () => {
    const r = daysTogether([met("2026-11-01")], local(2026, 11, 13));
    expect(r).toMatchObject({ days: 12, kind: "plain", value: "12", copy: "12 days together" });
    expect(r?.accessibilityLabel).toBe("12 days together");
  });

  it("marks a round 100", () => {
    // 2026-01-01 + 100 days = 2026-04-11
    const r = daysTogether([met("2026-01-01")], local(2026, 4, 11));
    expect(r).toMatchObject({ days: 100, kind: "round", copy: "100 days together, today" });
  });

  it("marks a round 1,000 with a thousands separator", () => {
    // 2024-01-01 + 1000 days = 2026-09-27
    const r = daysTogether([met("2024-01-01")], local(2026, 9, 27));
    expect(r).toMatchObject({ days: 1000, kind: "round", value: "1,000", copy: "1,000 days together, today" });
    expect(r?.accessibilityLabel).toBe("1,000 days together, today");
  });

  it("marks the anniversary in years", () => {
    const r = daysTogether([met("2021-09-18")], local(2026, 9, 18));
    expect(r).toMatchObject({ kind: "anniversary", value: "5", line: "years today", copy: "5 years today" });
    expect(r?.days).toBe(1826);
    expect(r?.accessibilityLabel).toBe("1,826 days together, 5 years today");
    expect(daysTogether([met("2025-09-18")], local(2026, 9, 18))?.copy).toBe("1 year today");
  });

  it("puts a Feb 29 anniversary on Feb 28 in non-leap years, Feb 29 in leap years", () => {
    const list = [met("2020-02-29")];
    expect(daysTogether(list, local(2021, 2, 28))?.kind).toBe("anniversary");
    expect(daysTogether(list, local(2021, 3, 1))?.kind).not.toBe("anniversary");
    expect(daysTogether(list, local(2024, 2, 28))?.kind).not.toBe("anniversary");
    expect(daysTogether(list, local(2024, 2, 29))).toMatchObject({ kind: "anniversary", copy: "4 years today" });
    expect(daysTogether(list, local(2020, 3, 1))?.days).toBe(1);
  });

  it("is timezone-safe: reads the met date as written and today as the local calendar day", () => {
    // A trailing UTC time must not move the met day.
    expect(parseLocalDate("2021-09-18T23:30:00.000Z")).toEqual({ year: 2021, month: 9, day: 18 });
    // Just after local midnight and just before the next one count the same day.
    expect(daysTogether([met("2026-11-01")], local(2026, 11, 13, 0, 1))?.days).toBe(12);
    expect(daysTogether([met("2026-11-01")], local(2026, 11, 13, 23, 59))?.days).toBe(12);
    // Across a DST change (Europe and the US both change in March) days stay whole.
    expect(calendarDaysBetween({ year: 2026, month: 3, day: 1 }, { year: 2026, month: 4, day: 1 })).toBe(31);
    expect(calendarDaysBetween({ year: 2026, month: 10, day: 1 }, { year: 2026, month: 11, day: 1 })).toBe(31);
  });

  it("formats counts", () => {
    expect(formatCount(7)).toBe("7");
    expect(formatCount(1234567)).toBe("1,234,567");
  });
});
