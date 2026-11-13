/**
 * Atmosphere: lighting and material effects [Material and atmosphere].
 * The owner chose the "Dusk" vignette (2026-11-13), from the lighthouse mood image:
 * a pale-blue-to-blush sky fading into the cocoa surface.
 *
 * Grain, photo tint and vignette turn OFF under Reduce Transparency / Reduce Motion
 * (see DESIGN.md). Tape and tilt are static layout and stay on.
 */

/** Top vignette for expo-linear-gradient (top → bottom), pointerEvents="none". */
export const vignette = {
  colors: ["rgba(150,178,212,0.22)", "rgba(224,138,155,0.16)", "rgba(36,26,22,0)"] as const,
  locations: [0, 0.4, 0.85] as const,
  /** Height of the vignette band, in px from the top of the screen. */
  height: 420,
} as const;

/** Film grain: a bundled 128×128 noise PNG tiled as an overlay. */
export const grain = { opacity: 0.06, tile: 128 } as const;

/** Sepia warmth over photos in lists and on the Wall. Never in the lightbox [7B]. */
export const photoTint = "rgba(231,166,96,0.08)";
