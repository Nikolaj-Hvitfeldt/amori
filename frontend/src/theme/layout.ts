/** Spacing, radius, geometry, elevation and motion tokens [5A, 4B, 5C, 6A]. */
import { palette } from "./colors";

/** 4-pt steps. The side gutter is 16. */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export const gutter = space.lg;

export const radius = {
  print: 3, // paper prints, thumbnails
  field: 12, // inputs and chips
  sheet: 20, // sheets, top corners only
  pill: 999, // buttons
} as const;

/** Minimum touch target. */
export const hitTarget = 44;

/** Form field geometry [7A]. Fields sit on color.surfaceRaised. */
export const field = { height: 52 } as const;

/**
 * Focus indication. Native fields: a 2px amber outline [7A].
 * Web keyboard focus: 2px amber ring with a 2px offset [6B].
 */
export const focus = { width: 2, offset: 2 } as const;

export const polaroid = {
  frame: 8,
  caption: 28,
  /** Tilt is seeded from the entry id, within ±maxTiltDeg. Never Math.random per render. */
  maxTiltDeg: 2,
  tape: { width: 36, height: 12, opacity: 0.55 },
} as const;

/**
 * The only elevation token [4B]. Used on paper prints, polaroids and the "+" button.
 * Everything else is flat; there are no coloured glows.
 */
export const shadow = {
  paperLift: {
    color: palette.black,
    offset: { width: 0, height: 6 },
    blur: 14,
    opacity: 0.45,
    /** Android elevation approximation. */
    elevation: 6,
  },
} as const;

/** Durations in ms [5C]. Banned: looping pulses/rotations, bounce, spring overshoot. */
export const motion = {
  tabIndicator: 220, // ease-out cubic
  sheetOpen: 260, // ease-out
  sheetClose: 220, // ease-in
  contentFade: 160, // from an already visible state
  develop: 600, // polaroid "develop", once per photo per session
  savedHold: 480, // "Saved" state before the sheet closes [2A]
} as const;

/**
 * Easing curves as cubic-bezier control points, e.g. Easing.bezier(...easing.out).
 * out = ease-out cubic (tab indicator, sheet open), in = ease-in cubic (sheet close).
 */
export const easing = {
  out: [0.33, 1, 0.68, 1] as const,
  in: [0.32, 0, 0.67, 0] as const,
} as const;

/** Web frame at 768px and wider [6A]. */
export const webFrame = {
  breakpoint: 768,
  column: 560,
  wallColumn: 840,
  wallColumns: 3,
} as const;
