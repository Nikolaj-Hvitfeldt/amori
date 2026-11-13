/**
 * Candlelit Scrapbook colour tokens (dark theme, the only theme in this effort).
 * Source of truth: DESIGN.md. Hex literals live ONLY in frontend/src/theme [E6].
 *
 * Layers: `palette` holds raw values; `color` maps them to roles. Screens and
 * primitives use `color.*` / `section.*`, never `palette.*`, so a later light
 * theme can swap the role map without touching components.
 */

export const palette = {
  cocoa900: "#120c0a", // sheet backdrop behind a raised sheet
  cocoa850: "#0f0b0a", // lightbox backdrop [7B]
  cocoa800: "#1b1310", // chrome: tab bar
  cocoa700: "#241a16", // surface
  cocoa600: "#2f2420", // raised fields [7A]
  cream100: "#f1e4d1", // paper and primary text
  taupe400: "#b09a85", // muted text on dark
  ink900: "#3a2a22", // text on paper
  ink600: "#6b5547", // muted text on paper
  amber400: "#e7a660", // candle amber, the brand accent
  amberInk: "#8a5414",
  rose400: "#e08a9b",
  roseInk: "#a3485c",
  lavender400: "#b8a0c9",
  lavenderInk: "#6e5390",
  sage400: "#9fb89a",
  sageInk: "#4f6b4a",
  black: "#000000",
} as const;

export const color = {
  surface: palette.cocoa700,
  surfaceChrome: palette.cocoa800,
  surfaceRaised: palette.cocoa600,
  sheetBackdrop: palette.cocoa900,
  lightboxBackdrop: palette.cocoa850,
  paper: palette.cream100,
  text: palette.cream100,
  textMuted: palette.taupe400,
  ink: palette.ink900,
  inkMuted: palette.ink600,
  accent: palette.amber400,
  onAccent: palette.cocoa700,
  /** Thread line, at reduced opacity over surface. */
  thread: "rgba(231,166,96,0.5)",
  /** Hairline borders on dark surfaces. */
  hairline: "rgba(241,228,209,0.08)",
  /** Outline for unselected chips and secondary controls. */
  outline: "rgba(241,228,209,0.12)",
  /** Tape strips on polaroids (static layout, always on). */
  tape: "rgba(176,154,133,0.55)",
  /** Dim layer under the upload ring on a thumbnail. */
  scrim: "rgba(36,26,22,0.45)",
} as const;

export type SectionKey = "story" | "moments" | "dates" | "milestones" | "wall";

/**
 * Per-section accent [Section accents table]. `onSurface` is for dots, outlines
 * and dates on the dark surface; `onPaper` is the ink variant for paper.
 * The Wall has no accent of its own: the photos carry the colour.
 */
export const section: Record<SectionKey, { onSurface: string; onPaper: string }> = {
  story: { onSurface: palette.amber400, onPaper: palette.amberInk },
  moments: { onSurface: palette.rose400, onPaper: palette.roseInk },
  dates: { onSurface: palette.lavender400, onPaper: palette.lavenderInk },
  milestones: { onSurface: palette.sage400, onPaper: palette.sageInk },
  wall: { onSurface: palette.amber400, onPaper: palette.ink600 },
};

/** Entry type → section, for timeline dots [5B]. */
export const entrySection = {
  moment: "moments",
  date: "dates",
  milestone: "milestones",
} as const satisfies Record<string, SectionKey>;

/**
 * Text/background pairs that must meet WCAG AA 4.5:1.
 * Checked by src/__tests__/contrast.test.ts; add a pair here whenever a new
 * text-on-background combination is introduced.
 */
export const contrastPairs: ReadonlyArray<{ name: string; fg: string; bg: string }> = [
  { name: "text on surface", fg: color.text, bg: color.surface },
  { name: "textMuted on surface", fg: color.textMuted, bg: color.surface },
  { name: "textMuted on chrome (inactive tab)", fg: color.textMuted, bg: color.surfaceChrome },
  { name: "text on surfaceRaised (field)", fg: color.text, bg: color.surfaceRaised },
  { name: "textMuted on surfaceRaised", fg: color.textMuted, bg: color.surfaceRaised },
  { name: "ink on paper", fg: color.ink, bg: color.paper },
  { name: "inkMuted on paper", fg: color.inkMuted, bg: color.paper },
  { name: "accent on surface", fg: color.accent, bg: color.surface },
  { name: "accent on chrome (active tab)", fg: color.accent, bg: color.surfaceChrome },
  { name: "onAccent on accent (Save pill)", fg: color.onAccent, bg: color.accent },
  { name: "text on lightbox backdrop", fg: color.text, bg: color.lightboxBackdrop },
  { name: "textMuted on lightbox backdrop", fg: color.textMuted, bg: color.lightboxBackdrop },
  ...(["story", "moments", "dates", "milestones"] as const).flatMap((k) => [
    { name: `${k} accent on surface`, fg: section[k].onSurface, bg: color.surface },
    { name: `${k} ink on paper`, fg: section[k].onPaper, bg: color.paper },
    { name: `onAccent on ${k} accent (selected chip)`, fg: color.onAccent, bg: section[k].onSurface },
  ]),
];
