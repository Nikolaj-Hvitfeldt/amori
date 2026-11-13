import { describe, expect, it } from "@jest/globals";
import { contrastPairs, contrastRatio } from "../theme";

describe("theme contrast (WCAG AA 4.5:1 for every text pair)", () => {
  it("computes known ratios correctly", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
  });

  it.each(contrastPairs.map((p) => [p.name, p.fg, p.bg] as const))(
    "%s (%s on %s) is at least 4.5:1",
    (_name, fg, bg) => {
      expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
    }
  );
});
