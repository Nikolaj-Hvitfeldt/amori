/**
 * "Days together" hero math [3A, T6]. Pure; `today` is injectable for tests.
 *
 * Rules (plan, "Days together" hero):
 * - Source: the earliest milestone with milestone_type === "met". Milestones whose
 *   date can't be parsed are ignored. No met milestone, or an earliest met date in
 *   the future, returns null and the hero is hidden.
 * - Count: whole local calendar days between the met date and today. The met day
 *   is day 0 and shows as "Today".
 * - Copy: on the anniversary, "N years today"; on a multiple of 100 (which covers
 *   every multiple of 1,000), "N days together, today"; otherwise "N days together".
 *   The anniversary wins when both apply.
 *
 * Dates are calendar dates, never instants. A milestone date is read from its
 * leading YYYY-MM-DD as written (a trailing time or "Z" is ignored), so a met date
 * never shifts by a day with the device's timezone. `today` is read with the local
 * getters (getFullYear/getMonth/getDate), i.e. the device's own calendar day, and
 * the difference is taken between UTC midnights built from those components, so
 * DST changes can't produce a 23- or 25-hour "day".
 *
 * Feb 29 choice: a met date of Feb 29 has its anniversary on Feb 28 in non-leap
 * years (the last day of February that exists), and on Feb 29 in leap years.
 */

export type LocalDate = { year: number; month: number; day: number }; // month 1–12

const MS_PER_DAY = 86_400_000;

/** Parses the leading YYYY-MM-DD of a date string. Returns null when invalid. */
export function parseLocalDate(value: string | null | undefined): LocalDate | null {
  if (typeof value !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

export function toLocalDate(d: Date): LocalDate {
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function dayNumber(d: LocalDate): number {
  return Math.round(Date.UTC(d.year, d.month - 1, d.day) / MS_PER_DAY);
}

/** Whole calendar days from `from` to `to` (negative when `to` is earlier). */
export function calendarDaysBetween(from: LocalDate, to: LocalDate): number {
  return dayNumber(to) - dayNumber(from);
}

/** True when `today` is an anniversary (1 year or more) of `start`. */
export function isAnniversary(start: LocalDate, today: LocalDate): boolean {
  if (today.year <= start.year) return false;
  if (start.month === 2 && start.day === 29 && !isLeapYear(today.year)) {
    return today.month === 2 && today.day === 28;
  }
  return today.month === start.month && today.day === start.day;
}

/** Earliest valid "met" date, or null. */
export function findMetDate(
  milestones: ReadonlyArray<{ milestone_type: string; date: string }>
): LocalDate | null {
  let earliest: LocalDate | null = null;
  for (const m of milestones) {
    if (m.milestone_type !== "met") continue;
    const d = parseLocalDate(m.date);
    if (d && (!earliest || dayNumber(d) < dayNumber(earliest))) earliest = d;
  }
  return earliest;
}

/** 1234567 → "1,234,567" (no Intl dependency). */
export function formatCount(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export type DaysTogetherKind = "today" | "anniversary" | "round" | "plain";

export type DaysTogether = {
  /** Whole days since the met day (0 on the met day). */
  days: number;
  kind: DaysTogetherKind;
  /** The big hero figure: "Today", "1,000" or, on an anniversary, the years. */
  value: string;
  /** The italic line next to the figure; empty on day 0. */
  line: string;
  /** The full sentence, e.g. "1,000 days together, today" or "5 years today". */
  copy: string;
  /** Screen-reader label; always starts with "N days together". */
  accessibilityLabel: string;
};

export function daysTogether(
  milestones: ReadonlyArray<{ milestone_type: string; date: string }>,
  today: Date = new Date()
): DaysTogether | null {
  const met = findMetDate(milestones);
  if (!met) return null;
  const now = toLocalDate(today);
  const days = calendarDaysBetween(met, now);
  if (days < 0) return null;

  const count = formatCount(days);
  const base = `${count} days together`;

  if (days === 0) {
    return { days, kind: "today", value: "Today", line: "", copy: "Today", accessibilityLabel: base };
  }
  if (isAnniversary(met, now)) {
    const years = now.year - met.year;
    const line = years === 1 ? "year today" : "years today";
    const copy = `${formatCount(years)} ${line}`;
    return { days, kind: "anniversary", value: formatCount(years), line, copy, accessibilityLabel: `${base}, ${copy}` };
  }
  if (days % 100 === 0) {
    const copy = `${base}, today`;
    return { days, kind: "round", value: count, line: "days together, today", copy, accessibilityLabel: copy };
  }
  return { days, kind: "plain", value: count, line: "days together", copy: base, accessibilityLabel: base };
}
