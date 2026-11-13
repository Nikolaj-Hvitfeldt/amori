import React from "react";
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from "react-native";
import { color, section as sectionColors, SectionKey, type, TypeRole } from "../theme";

export type TextTone = "text" | "muted" | "ink" | "inkMuted" | "accent" | "section";

export type TextProps = RNTextProps & {
  /** Type role [5A]. Default "body". */
  variant?: TypeRole;
  /** Colour role. Default "text" on dark surfaces; use "ink"/"inkMuted" on paper. */
  tone?: TextTone;
  /** For tone="section": which section's accent. */
  section?: SectionKey;
  /** For tone="section": use the ink-on-paper variant of the accent. */
  onPaper?: boolean;
  /** Caption-style field labels: uppercase with 0.04em tracking [DESIGN §2]. */
  uppercase?: boolean;
};

const HEADER_ROLES: ReadonlySet<TypeRole> = new Set<TypeRole>(["display", "title", "heading"]);

/** Tracking for uppercase field labels, in em [DESIGN §2]. */
const LABEL_TRACKING_EM = 0.04;

export function toneColor(tone: TextTone, sectionKey: SectionKey = "story", onPaper = false): string {
  switch (tone) {
    case "muted":
      return color.textMuted;
    case "ink":
      return color.ink;
    case "inkMuted":
      return color.inkMuted;
    case "accent":
      return color.accent;
    case "section":
      return onPaper ? sectionColors[sectionKey].onPaper : sectionColors[sectionKey].onSurface;
    default:
      return color.text;
  }
}

/**
 * The only text primitive. Display, title and heading are announced as headers.
 * Dynamic Type is capped where the role has a maxFontSizeMultiplier (hero, tab label).
 */
export function Text({
  variant = "body",
  tone = "text",
  section,
  onPaper,
  uppercase,
  style,
  accessibilityRole,
  maxFontSizeMultiplier,
  ...rest
}: TextProps) {
  const role = type[variant];
  const cap = "maxFontSizeMultiplier" in role ? role.maxFontSizeMultiplier : undefined;
  return (
    <RNText
      accessibilityRole={accessibilityRole ?? (HEADER_ROLES.has(variant) ? "header" : undefined)}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? cap}
      style={[
        {
          fontFamily: role.fontFamily,
          fontSize: role.fontSize,
          lineHeight: role.lineHeight,
          color: toneColor(tone, section, onPaper),
        },
        uppercase && { textTransform: "uppercase", letterSpacing: role.fontSize * LABEL_TRACKING_EM },
        styles.reset,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  // Fonts carry their own weight/style; don't let the platform synthesise them.
  reset: { fontWeight: "normal", fontStyle: "normal" },
});
