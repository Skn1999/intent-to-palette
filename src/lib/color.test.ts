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
