import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { scan, LEGACY } = require("../../scripts/check-tokens") as {
  scan: (root: string, opts?: { legacy?: string[] }) => {
    offenders: { file: string; line: number; kind: string }[];
    staleLegacy: string[];
  };
  LEGACY: string[];
};

let root: string;
const write = (rel: string, text: string) => {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, text);
};

beforeAll(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "check-tokens-"));
  // Colour values are allowed in theme.
  write("theme/colors.ts", 'export const a = "#241a16";\nexport const b = "rgba(1,2,3,0.5)";\n');
  // A clean ui file: tokens and a runtime-built colour.
  write("ui/Clean.tsx", "const c = color.accent;\nconst s = `rgba(${r}, ${g}, ${b}, 0.4)`;\n");
  // Offenders.
  write("ui/Bad.tsx", 'const x = 1;\nconst c = { color: "#fff" };\n');
  write("ui/Rgb.tsx", "const c = 'rgba(0, 0, 0, 0.5)';\n");
  write("ui/Emoji.tsx", "const label = 'Saved \u{1F496}';\n");
  // Tests are skipped.
  write("__tests__/x.test.ts", 'expect("#000000").toBe("#000000");\n');
  // Legacy files are allowed while listed, but never under ui/.
  write("screens/Old.tsx", 'const c = "#ff0000";\n');
});

afterAll(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe("check-tokens", () => {
  it("flags hex, rgb literals and emoji in ui, and passes theme and tests", () => {
    const { offenders } = scan(root, { legacy: ["screens/Old.tsx"] });
    const hits = offenders.map((o) => `${o.file}:${o.line}:${o.kind}`).sort();
    expect(hits).toEqual(["ui/Bad.tsx:2:hex", "ui/Emoji.tsx:1:emoji", "ui/Rgb.tsx:1:rgb"]);
  });

  it("flags legacy files once they leave the allowlist", () => {
    const { offenders } = scan(root, { legacy: [] });
    expect(offenders.some((o) => o.file === "screens/Old.tsx")).toBe(true);
  });

  it("reports stale legacy entries", () => {
    expect(scan(root, { legacy: ["screens/Old.tsx", "screens/Gone.tsx"] }).staleLegacy).toEqual([
      "screens/Gone.tsx",
    ]);
  });

  it("never allowlists new code", () => {
    expect(LEGACY.filter((f) => f.startsWith("ui/") || f === "utils/daysTogether.ts")).toEqual([]);
  });

  it("passes on the real src tree", () => {
    const { offenders } = scan(path.resolve(__dirname, ".."));
    expect(offenders).toEqual([]);
  });
});
