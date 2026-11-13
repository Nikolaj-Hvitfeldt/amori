import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  clearAllCache,
  getCachePrefix,
  getCachedData,
  invalidateResourceCache,
  setCachedData,
} from "../utils/cache";

const ORIGINAL_MOCK = process.env.EXPO_PUBLIC_MOCK;

function setMode(mode: "mock" | "real") {
  if (mode === "mock") process.env.EXPO_PUBLIC_MOCK = "1";
  else delete process.env.EXPO_PUBLIC_MOCK;
}

describe("cache namespacing [E3]", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  afterEach(() => {
    if (ORIGINAL_MOCK === undefined) delete process.env.EXPO_PUBLIC_MOCK;
    else process.env.EXPO_PUBLIC_MOCK = ORIGINAL_MOCK;
  });

  it("prefixes keys with the mode and the API origin", () => {
    setMode("mock");
    expect(getCachePrefix()).toMatch(/^amori:mock:[a-z]+:\/\/[^/]+:$/);
    setMode("real");
    expect(getCachePrefix()).toMatch(/^amori:real:[a-z]+:\/\/[^/]+:$/);
  });

  it("a write in mock mode is invisible in real mode", async () => {
    setMode("mock");
    await setCachedData("moments_all", { data: [{ id: "fx" }], total: 1 });
    expect(await getCachedData("moments_all")).toEqual({ data: [{ id: "fx" }], total: 1 });

    setMode("real");
    expect(await getCachedData("moments_all")).toBeNull();

    setMode("mock");
    expect(await getCachedData("moments_all")).not.toBeNull();
  });

  it("invalidateResourceCache only touches the current namespace", async () => {
    setMode("real");
    await setCachedData("dates_all", "real");
    setMode("mock");
    await setCachedData("dates_all", "mock");

    await invalidateResourceCache("dates");
    expect(await getCachedData("dates_all")).toBeNull();

    setMode("real");
    expect(await getCachedData("dates_all")).toBe("real");
  });

  it("clearAllCache also removes legacy amori_cache_ keys", async () => {
    setMode("real");
    await AsyncStorage.setItem("amori_cache_moments_all", "{}");
    await AsyncStorage.setItem("unrelated_key", "keep");
    await setCachedData("moments_all", "x");

    await clearAllCache();

    expect(await AsyncStorage.getItem("amori_cache_moments_all")).toBeNull();
    expect(await getCachedData("moments_all")).toBeNull();
    expect(await AsyncStorage.getItem("unrelated_key")).toBe("keep");
  });
});
