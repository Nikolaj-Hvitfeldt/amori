import React, { useEffect, useState } from "react";
import { Platform, StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "./src/navigation/AppNavigator";
import { isMockMode } from "./src/mock/mode";
import { useFonts } from "expo-font";
import { InstrumentSerif_400Regular } from "@expo-google-fonts/instrument-serif/400Regular";
import { InstrumentSerif_400Regular_Italic } from "@expo-google-fonts/instrument-serif/400Regular_Italic";
import { Figtree_400Regular } from "@expo-google-fonts/figtree/400Regular";
import { Figtree_500Medium } from "@expo-google-fonts/figtree/500Medium";
import { Figtree_600SemiBold } from "@expo-google-fonts/figtree/600SemiBold";
import { color, fontFamily } from "./src/theme";
import { installWebSurfaces } from "./src/ui/webSurfaces";

// Browser surfaces [6B] (web only): amber caret, selection and focus ring, themed scrollbars.
installWebSurfaces();

// Mock mode only (EXPO_PUBLIC_MOCK=1 in a dev build): make fetch fail closed so
// nothing can reach a non-local host. The __DEV__ guard keeps it out of production.
if (__DEV__ && isMockMode()) {
  require("./src/mock/guardFetch").installGuardFetch();
}

// Dev-only primitives gallery: web dev server with ?gallery=1. The __DEV__ guard
// lets Metro drop this require (and the gallery behind it) from production builds.
let Gallery: React.ComponentType | null = null;
if (__DEV__ && Platform.OS === "web" && /[?&]gallery=1(&|#|$)/.test(String((globalThis as any).window?.location?.search ?? ""))) {
  Gallery = require("./src/ui/Gallery").default;
}

// The legacy screens don't use the redesign fonts, so never wait on them for long.
const FONT_TIMEOUT_MS = 2500;

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    [fontFamily.serif]: InstrumentSerif_400Regular,
    [fontFamily.serifItalic]: InstrumentSerif_400Regular_Italic,
    [fontFamily.sans]: Figtree_400Regular,
    [fontFamily.sansMedium]: Figtree_500Medium,
    [fontFamily.sansSemiBold]: Figtree_600SemiBold,
  });
  const [fontWaitOver, setFontWaitOver] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFontWaitOver(true), FONT_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    // Add Apple Touch Icon for iOS PWA home screen
    if (Platform.OS === "web" && typeof document !== "undefined") {
      // Remove existing apple-touch-icon if any
      const existingIcons = document.querySelectorAll('link[rel="apple-touch-icon"]');
      existingIcons.forEach((icon) => icon.remove());

      // Add new apple-touch-icon with cache-busting
      // Icon should be in public folder and accessible at /icon.png
      const iconPath = "/icon.png";
      const timestamp = Date.now();
      
      const icon = document.createElement("link");
      icon.rel = "apple-touch-icon";
      icon.href = iconPath + "?v=" + timestamp;
      document.head.appendChild(icon);

      const icon180 = document.createElement("link");
      icon180.rel = "apple-touch-icon";
      icon180.sizes = "180x180";
      icon180.href = iconPath + "?v=" + timestamp;
      document.head.appendChild(icon180);
      
      const icon1024 = document.createElement("link");
      icon1024.rel = "apple-touch-icon";
      icon1024.sizes = "1024x1024";
      icon1024.href = iconPath + "?v=" + timestamp;
      document.head.appendChild(icon1024);

      // Add to manifest as well
      const manifest = document.createElement("link");
      manifest.rel = "manifest";
      manifest.href = "/manifest.json";
      if (!document.querySelector('link[rel="manifest"]')) {
        document.head.appendChild(manifest);
      }
    }
  }, []);

  if (!fontsLoaded && !fontError && !fontWaitOver) return null;
  return (
    <SafeAreaProvider style={{ backgroundColor: color.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={color.surface} />
      {Gallery ? <Gallery /> : <AppNavigator />}
    </SafeAreaProvider>
  );
}
