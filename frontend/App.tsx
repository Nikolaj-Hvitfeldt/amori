import React, { useEffect } from "react";
import { Platform } from "react-native";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
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

  return <AppNavigator />;
}
