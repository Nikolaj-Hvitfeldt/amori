/**
 * Semantic haptics (Allowed addition #2). Each call is a no-op on web and never
 * throws: haptics are a nicety, not a dependency.
 */
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

function run(fn: () => Promise<void>): void {
  if (Platform.OS === "web") return;
  try {
    fn().catch(() => undefined);
  } catch {
    // Haptics unavailable (simulator, old device): ignore.
  }
}

/** A choice changed: chip, option, toggle. */
export function select(): void {
  run(() => Haptics.selectionAsync());
}

/** A save or create succeeded. */
export function success(): void {
  run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

/** A destructive or risky step: delete, discard. */
export function warning(): void {
  run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
}

/** Opening a detail view or switching tabs. */
export function navigate(): void {
  run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

export const haptics = { select, success, warning, navigate };
