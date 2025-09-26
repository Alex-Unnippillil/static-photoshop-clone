import {
  contrastRatio,
  relativeLuminance,
  suggestContrastColor,
} from "../src/core/contrast.js";

describe("contrast utilities", () => {
  it("computes relative luminance per WCAG", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#ffffff")).toBe(1);
  });

  it("calculates contrast ratios with two decimal precision", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBe(21);
    expect(contrastRatio("#ff0000", "#ffffff")).toBeCloseTo(4, 1);
  });

  it("suggests adjustments that satisfy the requested threshold", () => {
    const suggestion = suggestContrastColor("#f2f2f2", "#ffffff");
    expect(suggestion).not.toBeNull();
    expect(suggestion?.ratio ?? 0).toBeGreaterThanOrEqual(4.5);
  });

  it("returns null when the color already passes the threshold", () => {
    expect(suggestContrastColor("#000000", "#ffffff")).toBeNull();
  });
});
