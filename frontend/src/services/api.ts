import { Platform } from "react-native";

// API URL configuration
// For testing on iPhone: Update this to use your local IP address
// Run "npm run get:ip" in backend to find your current IP
// Example: "http://192.168.1.100:3000"

// Detect if we're accessing from a mobile device on the network
const getApiUrl = () => {
  if (Platform.OS === "web") {
    // Check if we're on a mobile device accessing via network IP
    const win = globalThis as any;
    if (win.window && win.window.location) {
      const hostname = win.window.location.hostname;
      // If accessing via IP (not localhost), use that IP for API
      if (hostname !== "localhost" && hostname !== "127.0.0.1") {
        return `http://${hostname}:3000`;
      }
    }
    return "http://localhost:3000"; // Local development
  }
  // Native mobile apps - use network IP
  return "http://192.168.0.92:3000"; // Update this to your local IP
};

export const API_BASE_URL = getApiUrl();
