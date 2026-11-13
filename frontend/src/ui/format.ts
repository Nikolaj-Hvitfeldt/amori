/** Display formatting for dates in the UI ("24 October 2026"). Calendar dates, no timezone shift. */
import { parseLocalDate } from "../utils/daysTogether";

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** "2026-10-24" → "24 October 2026". Falls back to the input when it can't be parsed. */
export function formatLongDate(value: string): string {
  const d = parseLocalDate(value);
  return d ? `${d.day} ${MONTHS[d.month - 1]} ${d.year}` : value;
}

/** "2026-10-24" → "October 2026". */
export function formatMonth(value: string): string {
  const d = parseLocalDate(value);
  return d ? `${MONTHS[d.month - 1]} ${d.year}` : value;
}

/** "2026-10-24" → "2026-10" (sortable month key); "" when invalid. */
export function monthKey(value: string): string {
  const d = parseLocalDate(value);
  return d ? `${d.year}-${String(d.month).padStart(2, "0")}` : "";
}
