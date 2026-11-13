/**
 * Fail-closed fetch guard for mock mode [E2].
 *
 * Allowed: the blob:, data: and file: schemes, and http(s) to localhost,
 * 127.0.0.1 and [::1]. Everything else throws an Error naming the URL, so
 * nothing in mock mode can reach production.
 */

const ALLOWED_SCHEMES = /^(blob|data|file):/i;
const ALLOWED_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** Pure check, exported for tests. `base` resolves relative URLs (web: the page origin). */
export function isAllowedMockUrl(url: string, base?: string): boolean {
  const value = String(url).trim();
  if (ALLOWED_SCHEMES.test(value)) return true;

  if (/^[/\\]{2}/.test(value)) {
    // Protocol-relative (//host/...): check the host it points at.
    return isAllowedMockUrl("http://" + value.replace(/^[/\\]+/, ""));
  }
  if (!/^[a-z][a-z0-9+.-]*:/i.test(value)) {
    // Relative URL: allowed only when the page it resolves against is allowed.
    return !!base && isAllowedMockUrl(base);
  }

  // http(s)://[userinfo@]host[:port][/?#...]
  const match = /^https?:\/\/(?:[^@/?#]*@)?(\[[^\]]*\]|[^:/?#]*)(?::\d*)?(?:[/?#]|$)/i.exec(value);
  if (!match) return false;
  return ALLOWED_HOSTS.has(match[1].toLowerCase());
}

function urlOf(input: unknown): string {
  if (typeof input === "string") return input;
  if (input && typeof (input as { url?: unknown }).url === "string") {
    return (input as { url: string }).url;
  }
  return String(input);
}

let installed = false;

/** Wraps globalThis.fetch. Call only in mock mode. Idempotent. */
export function installGuardFetch(): void {
  if (installed) return;
  const g = globalThis as any;
  const original = g.fetch;
  if (typeof original !== "function") return;

  g.fetch = function guardedFetch(input: unknown, init?: unknown) {
    const url = urlOf(input);
    const base: string | undefined = g.window?.location?.href;
    if (!isAllowedMockUrl(url, base)) {
      throw new Error(
        `[mock mode] Blocked network request to ${url}. Only blob:, data:, file: and localhost are allowed.`
      );
    }
    return original.call(globalThis, input, init);
  };
  installed = true;
}
