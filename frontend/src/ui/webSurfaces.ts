/**
 * Browser surfaces [6B]: amber caret and selection, themed scrollbars and the
 * amber :focus-visible ring. Web only; injected once at app start, built from
 * theme tokens (no colour literals here).
 */
import { Platform } from "react-native";
import { color, focus } from "../theme";
import { withAlpha } from "./styles";

const STYLE_ID = "amori-web-surfaces";
/** How strongly text selection is tinted amber. */
const SELECTION_ALPHA = 0.35;
/** Thin WebKit scrollbar, in px. */
const SCROLLBAR_SIZE = 8;

export function webSurfacesCss(): string {
  const selection = withAlpha(color.accent, SELECTION_ALPHA);
  return [
    `html, body { background-color: ${color.surface}; }`,
    `* { caret-color: ${color.accent}; scrollbar-width: thin; scrollbar-color: ${color.textMuted} ${color.surfaceChrome}; }`,
    `::selection { background-color: ${selection}; color: ${color.text}; }`,
    `::-webkit-scrollbar { width: ${SCROLLBAR_SIZE}px; height: ${SCROLLBAR_SIZE}px; }`,
    `::-webkit-scrollbar-track { background: ${color.surfaceChrome}; }`,
    `::-webkit-scrollbar-thumb { background: ${color.textMuted}; border-radius: ${SCROLLBAR_SIZE}px; }`,
    `:focus { outline: none; }`,
    `:focus-visible { outline: ${focus.width}px solid ${color.accent}; outline-offset: ${focus.offset}px; }`,
  ].join("\n");
}

/** Injects the browser-surface stylesheet once. No-op off web or without a document. */
export function installWebSurfaces(): void {
  if (Platform.OS !== "web") return;
  const doc = (globalThis as { document?: Document }).document;
  if (!doc || doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement("style");
  style.id = STYLE_ID;
  style.textContent = webSurfacesCss();
  doc.head.appendChild(style);
}
