import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { API_BASE_URL, apiFetch, withPagination } from "../services/api";

const ORIGINAL_MOCK = process.env.EXPO_PUBLIC_MOCK;
const realFetch = globalThis.fetch;
let fetchSpy: jest.Mock<(...args: unknown[]) => Promise<unknown>>;

describe("apiFetch [E1]", () => {
  beforeEach(() => {
    fetchSpy = jest.fn(async () => ({ ok: true, status: 200, json: async () => ({}) }));
    (globalThis as any).fetch = fetchSpy;
  });

  afterEach(() => {
    (globalThis as any).fetch = realFetch;
    if (ORIGINAL_MOCK === undefined) delete process.env.EXPO_PUBLIC_MOCK;
    else process.env.EXPO_PUBLIC_MOCK = ORIGINAL_MOCK;
  });

  it("builds the same query string URL.searchParams did", () => {
    const url = new URL(`${API_BASE_URL}/dates`);
    url.searchParams.set("limit", (10).toString());
    url.searchParams.set("offset", (20).toString());
    expect(`${API_BASE_URL}${withPagination("/dates", 10, 20)}`).toBe(url.toString());
    expect(withPagination("/dates")).toBe("/dates");
    expect(withPagination("/dates", 5)).toBe("/dates?limit=5");
  });

  it("real mode: calls fetch with the API URL and the init unchanged", async () => {
    delete process.env.EXPO_PUBLIC_MOCK;
    await apiFetch("/moments/42");
    expect(fetchSpy).toHaveBeenCalledWith(`${API_BASE_URL}/moments/42`);

    const init = { method: "DELETE" };
    await apiFetch("/moments/42", init);
    expect(fetchSpy).toHaveBeenLastCalledWith(`${API_BASE_URL}/moments/42`, init);
  });

  it("mock mode: answers from the FakeBackend without calling fetch", async () => {
    process.env.EXPO_PUBLIC_MOCK = "1";
    const response = await apiFetch("/moments?limit=2&offset=0");
    expect(response.ok).toBe(true);
    const body = await response.json();
    expect(body.data).toHaveLength(2);
    expect(body.total).toBeGreaterThan(2);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
