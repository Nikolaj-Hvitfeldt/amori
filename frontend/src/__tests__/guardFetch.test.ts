import { describe, expect, it } from "@jest/globals";
import { isAllowedMockUrl } from "../mock/guardFetch";

// Pure URL checks only: nothing here makes a request.
describe("isAllowedMockUrl (mock-mode fetch guard)", () => {
  it.each([
    "blob:http://localhost:8082/0b1c2d3e-4f50-6172-8394-a5b6c7d8e9f0",
    "data:image/png;base64,iVBORw0KGgo=",
    "file:///data/user/0/app/cache/picked.jpg",
    "http://localhost:3000/moments",
    "http://localhost:8082/assets/fixtures/photo-1.png?platform=web",
    "https://localhost/secure",
    "http://127.0.0.1:3000/dates",
    "http://[::1]:3000/milestones",
    "HTTP://LOCALHOST:3000/sync/last-updated",
  ])("allows %s", (url) => {
    expect(isAllowedMockUrl(url)).toBe(true);
  });

  it.each([
    "https://example.com",
    "https://amori-backend.onrender.com",
    "https://amori-backend.onrender.com/moments",
    "http://192.168.1.20:3000/moments",
    "http://localhost.example.com/",
    "http://localhost@example.com/",
    "//example.com/x.png",
    "ws://example.com/socket",
    "ftp://localhost/file",
    "",
  ])("blocks %s", (url) => {
    expect(isAllowedMockUrl(url)).toBe(false);
  });

  it("allows relative URLs only when the page itself is local", () => {
    expect(isAllowedMockUrl("/assets/x.png", "http://localhost:8082/")).toBe(true);
    expect(isAllowedMockUrl("/assets/x.png", "https://amori.example.com/")).toBe(false);
    expect(isAllowedMockUrl("/assets/x.png")).toBe(false);
  });
});
