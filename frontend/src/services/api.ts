import { Platform } from "react-native";

// API URL configuration
// Priority: Environment variable > Production URL > Local development
// For production: Set EXPO_PUBLIC_API_URL in Vercel environment variables
// For local development: Falls back to localhost or network IP

const getApiUrl = () => {
  // Check for environment variable first (set in Vercel/Render)
  const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envApiUrl) {
    return envApiUrl;
  }

  // Production fallback (update this to your Render backend URL after deployment)
  const PRODUCTION_API_URL = "https://your-backend.onrender.com"; // Update after deployment

  if (Platform.OS === "web") {
    // Check if we're on a mobile device accessing via network IP (local dev)
    const win = globalThis as any;
    if (win.window && win.window.location) {
      const hostname = win.window.location.hostname;
      // If accessing via IP (not localhost), use that IP for API
      if (hostname !== "localhost" && hostname !== "127.0.0.1" && !hostname.includes("vercel.app")) {
        return `http://${hostname}:3000`;
      }
      // If on localhost, use localhost
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        return "http://localhost:3000";
      }
    }
    // Production web (Vercel)
    return PRODUCTION_API_URL;
  }
  
  // Native mobile apps - use production URL or network IP for local dev
  // For local testing, update this to your local IP
  // Run "npm run get:ip" in backend to find your current IP
  return PRODUCTION_API_URL; // Change to "http://YOUR_IP:3000" for local testing
};

export const API_BASE_URL = getApiUrl();
