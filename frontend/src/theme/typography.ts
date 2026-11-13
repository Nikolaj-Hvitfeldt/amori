/**
 * Type scale [5A] and voice rules [4C].
 * Instrument Serif: display, titles, dates, taglines (italic = the "voice").
 * Figtree: all UI text. Families are the @expo-google-fonts export names; they
 * are loaded with expo-font at app start (Phase 2).
 */

export const fontFamily = {
  serif: "InstrumentSerif_400Regular",
  serifItalic: "InstrumentSerif_400Regular_Italic",
  sans: "Figtree_400Regular",
  sansMedium: "Figtree_500Medium",
  sansSemiBold: "Figtree_600SemiBold",
} as const;

type TextRole = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  /** Cap for Dynamic Type [6B]; undefined = scales freely. */
  maxFontSizeMultiplier?: number;
};

export const type = {
  hero: { fontFamily: fontFamily.serif, fontSize: 56, lineHeight: 56, maxFontSizeMultiplier: 1.3 },
  display: { fontFamily: fontFamily.serif, fontSize: 34, lineHeight: 38 },
  title: { fontFamily: fontFamily.serif, fontSize: 24, lineHeight: 30 },
  heading: { fontFamily: fontFamily.sansSemiBold, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: fontFamily.sans, fontSize: 16, lineHeight: 24 },
  date: { fontFamily: fontFamily.serifItalic, fontSize: 15, lineHeight: 20 },
  caption: { fontFamily: fontFamily.sansMedium, fontSize: 12, lineHeight: 16 },
  tabLabel: { fontFamily: fontFamily.sansMedium, fontSize: 12, lineHeight: 16, maxFontSizeMultiplier: 1.3 },
} as const satisfies Record<string, TextRole>;

export type TypeRole = keyof typeof type;
