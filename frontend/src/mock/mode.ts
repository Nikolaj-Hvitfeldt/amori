/**
 * Mock mode switch. This is the ONLY place that decides whether mock mode is on.
 *
 * Mock mode requires both:
 *   - a development build (__DEV__), so a production `expo export` can never enable it;
 *   - EXPO_PUBLIC_MOCK=1 at bundle time.
 *
 * In mock mode every API call is answered by the in-memory FakeBackend and
 * globalThis.fetch is wrapped so that anything except blob:/data:/file: and
 * localhost throws. See frontend/README.md, "Mock mode".
 */
export function isMockMode(): boolean {
  return __DEV__ && process.env.EXPO_PUBLIC_MOCK === "1";
}

export type MockScenario = "default" | "empty" | "error";

const SCENARIOS: readonly MockScenario[] = ["default", "empty", "error"];

function asScenario(value: unknown): MockScenario | null {
  return typeof value === "string" && (SCENARIOS as readonly string[]).includes(value)
    ? (value as MockScenario)
    : null;
}

/**
 * Which data set the FakeBackend serves:
 *   - default: the fixtures;
 *   - empty:   no entries (empty states);
 *   - error:   every request answers HTTP 500 (error states).
 *
 * On web, a `?mockScenario=` query parameter overrides EXPO_PUBLIC_MOCK_SCENARIO,
 * so each state can be opened without restarting the dev server.
 */
export function getMockScenario(): MockScenario {
  const win = (globalThis as any).window;
  const search: unknown = win?.location?.search;
  if (typeof search === "string" && search.length > 1) {
    const match = /[?&]mockScenario=([^&#]*)/.exec(search);
    const fromQuery = match ? asScenario(decodeURIComponent(match[1])) : null;
    if (fromQuery) return fromQuery;
  }
  return asScenario(process.env.EXPO_PUBLIC_MOCK_SCENARIO) ?? "default";
}
