import { Platform } from "react-native";

// Use localhost for web, current local IP for mobile
// Run "npm run get:ip" in backend to find your current IP
const API_URL =
  Platform.OS === "web"
    ? "http://localhost:3000" // Web browser
    : "http://192.168.0.92:3000"; // Mobile: local network IP

export const API_BASE_URL = API_URL;
