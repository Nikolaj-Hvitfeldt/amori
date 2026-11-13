/** Small style helpers built only from theme tokens. */
import { Platform, ViewStyle } from "react-native";
import { color, focus, shadow } from "../theme";

/** A "#rrggbb" token plus alpha → an rgba() string, built at runtime from the token. */
export function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const lift = shadow.paperLift;

/** shadow.paperLift: prints, polaroids and the "+" button only [4B]. */
export const paperLift: ViewStyle =
  Platform.OS === "web"
    ? { boxShadow: `0px ${lift.offset.height}px ${lift.blur}px ${withAlpha(lift.color, lift.opacity)}` }
    : {
        shadowColor: lift.color,
        shadowOffset: lift.offset,
        shadowOpacity: lift.opacity,
        shadowRadius: lift.blur / 2,
        elevation: lift.elevation,
      };

/** Web keyboard focus ring: 2px amber with a 2px offset [6B]. */
export const focusRing: ViewStyle = {
  outlineColor: color.accent,
  outlineStyle: "solid",
  outlineWidth: focus.width,
  outlineOffset: focus.offset,
};

/** Spread onto decorative layers (tape, grain, vignette, tint) to hide them from assistive tech. */
export const a11yHidden = {
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants" as const,
  "aria-hidden": true,
};
