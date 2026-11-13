import { Platform } from "react-native";
import { isMockMode } from "../mock/mode";
import type { FakeBackend, MockResponse } from "../mock/FakeBackend";

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

/** scheme://host[:port] of the API, e.g. "http://localhost:3000". */
export function getApiOrigin(baseUrl: string = API_BASE_URL): string {
  const match = /^[a-z][a-z0-9+.-]*:\/\/[^/?#]*/i.exec(baseUrl);
  return match ? match[0] : baseUrl;
}

/** Appends ?limit=&offset= exactly as URL.searchParams.set would for numbers. */
export function withPagination(path: string, limit?: number, offset?: number): string {
  const params: string[] = [];
  if (limit !== undefined) params.push(`limit=${limit.toString()}`);
  if (offset !== undefined) params.push(`offset=${offset.toString()}`);
  return params.length > 0 ? `${path}?${params.join("&")}` : path;
}

let fakeBackend: FakeBackend | undefined;

function getFakeBackend(): FakeBackend | undefined {
  // The __DEV__ guard lets Metro drop this require (and the fixtures behind it)
  // from production bundles.
  if (__DEV__) {
    if (!fakeBackend) {
      fakeBackend = require("../mock").createMockBackend() as FakeBackend;
    }
    return fakeBackend;
  }
  return undefined;
}

/**
 * The single network choke point for API calls [E1].
 * `path` is relative to API_BASE_URL, e.g. "/moments/123".
 *
 * Real mode: fetch(`${API_BASE_URL}${path}`, init), unchanged from before.
 * Mock mode: answered in memory by the FakeBackend; nothing leaves the device.
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  if (isMockMode()) {
    const backend = getFakeBackend();
    if (backend) {
      const response: MockResponse = await backend.handle(path, init);
      return response as unknown as Response;
    }
  }
  const url = `${API_BASE_URL}${path}`;
  return init === undefined ? fetch(url) : fetch(url, init);
}
