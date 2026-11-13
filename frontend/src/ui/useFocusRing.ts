import { useCallback, useState } from "react";
import { Platform } from "react-native";
import { focusRing } from "./styles";

/**
 * Keyboard focus ring for web pressables (best effort). The ring shows when the
 * focused element matches :focus-visible, so mouse clicks don't draw it.
 * Native platforms draw nothing.
 */
export function useFocusRing() {
  const [visible, setVisible] = useState(false);
  const onFocus = useCallback((e: unknown) => {
    if (Platform.OS !== "web") return;
    const target = (e as { target?: { matches?: (q: string) => boolean } } | undefined)?.target;
    let focusVisible = true;
    try {
      focusVisible = target?.matches ? target.matches(":focus-visible") : true;
    } catch {
      focusVisible = true;
    }
    setVisible(focusVisible);
  }, []);
  const onBlur = useCallback(() => setVisible(false), []);
  return { onFocus, onBlur, ringStyle: visible ? focusRing : null };
}
