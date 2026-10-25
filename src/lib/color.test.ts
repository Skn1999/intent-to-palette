import { describe, expect, it } from "vitest";
import { contrast, fixWcag, readableOn } from "./color";

describe("contrast", () => {
  it("black on white is 21:1", () => expect(contrast("#000000", "#FFFFFF")).toBeCloseTo(21, 1));
  it("#777777 on white fails AA (below 4.5)", () => expect(contrast("#777777", "#FFFFFF")).toBeLessThan(4.5));
});

describe("fixWcag", () => {
  const colors = [
    { hex: "#7FB8B0", role: "primary" },
    { hex: "#D49368", role: "accent" },
    { hex: "#F7F8F4", role: "background" },
    { hex: "#FFFFFF", role: "surface" },
    { hex: "#999999", role: "text" },
  ];
  const fixed = fixWcag(colors);
  const hex = (r: string) => fixed.find((c) => c.role === r)!.hex;
  it("text meets 4.5:1 on background and surface", () => {
    expect(contrast(hex("text"), "#F7F8F4")).toBeGreaterThanOrEqual(4.5);
    expect(contrast(hex("text"), "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
  });
  it("accent meets 4.5:1 on background", () => expect(contrast(hex("accent"), "#F7F8F4")).toBeGreaterThanOrEqual(4.5));
  it("primary label meets 4.5:1", () => expect(contrast(readableOn(hex("primary")), hex("primary"))).toBeGreaterThanOrEqual(4.5));
  it("leaves background untouched", () => expect(hex("background")).toBe("#F7F8F4"));
});

import { gradientCss, syncGradients } from "./color";
describe("gradients", () => {
  it("builds linear css with sorted stops", () => {
    expect(gradientCss({ name: "a", type: "linear", angle: 90, usage: [], stops: [{ hex: "#FFFFFF", position: 100 }, { hex: "#000000", position: 0 }] }))
      .toBe("linear-gradient(90deg, #000000 0%, #FFFFFF 100%)");
  });
  it("syncs stops to fixed colors", () => {
    const g = [{ name: "a", type: "radial" as const, angle: 0, usage: [], stops: [{ hex: "#aaaaaa", position: 0 }] }];
    expect(syncGradients(g, [{ hex: "#AAAAAA", role: "text" }], [{ hex: "#555555", role: "text" }])![0]!.stops[0]!.hex).toBe("#555555");
  });
});
