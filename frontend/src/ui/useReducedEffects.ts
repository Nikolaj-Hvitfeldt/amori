import { useEffect, useState } from "react";
import { AccessibilityInfo, Platform } from "react-native";

type MediaQueryLike = {
  matches: boolean;
  addEventListener?: (type: "change", fn: () => void) => void;
  removeEventListener?: (type: "change", fn: () => void) => void;
};

function webQueries(): MediaQueryLike[] {
  const win = (globalThis as { window?: { matchMedia?: (q: string) => MediaQueryLike } }).window;
  if (!win?.matchMedia) return [];
  try {
    return [
      win.matchMedia("(prefers-reduced-transparency: reduce)"),
      win.matchMedia("(prefers-reduced-motion: reduce)"),
    ];
  } catch {
    return [];
  }
}

/**
 * True when atmosphere effects (grain, tint, vignette, shimmer, develop) should
 * be off [DESIGN §4]:
 *   - iOS: Reduce Transparency OR Reduce Motion;
 *   - Android: Reduce Motion;
 *   - web: prefers-reduced-transparency OR prefers-reduced-motion.
 * Subscribes to changes.
 */
export function useReducedEffects(): boolean {
  const [reduced, setReduced] = useState(() =>
    Platform.OS === "web" ? webQueries().some((q) => q.matches) : false
  );

  useEffect(() => {
    if (Platform.OS === "web") {
      const queries = webQueries();
      const update = () => setReduced(queries.some((q) => q.matches));
      update();
      queries.forEach((q) => q.addEventListener?.("change", update));
      return () => queries.forEach((q) => q.removeEventListener?.("change", update));
    }

    let motion = false;
    let transparency = false;
    let alive = true;
    const update = () => {
      if (alive) setReduced(motion || transparency);
    };
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        motion = v;
        update();
      })
      .catch(() => undefined);
    const subs = [
      AccessibilityInfo.addEventListener("reduceMotionChanged", (v: boolean) => {
        motion = v;
        update();
      }),
    ];
    if (Platform.OS === "ios") {
      AccessibilityInfo.isReduceTransparencyEnabled()
        .then((v) => {
          transparency = v;
          update();
        })
        .catch(() => undefined);
      subs.push(
        AccessibilityInfo.addEventListener("reduceTransparencyChanged", (v: boolean) => {
          transparency = v;
          update();
        })
      );
    }
    return () => {
      alive = false;
      subs.forEach((s) => s?.remove?.());
    };
  }, []);

  return reduced;
}
