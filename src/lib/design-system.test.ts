import { describe, expect, it } from "vitest";
import { buildTokens, DEFAULT_OPTIONS, spacingScale, typeScale } from "./design-system";

describe("design system", () => {
  it("type scale puts the base size at 'base' and multiplies by the ratio", () => {
    const s = typeScale(16, 1.25);
    expect(s.find((x) => x.name === "base")!.size).toBe(16);
    expect(s.find((x) => x.name === "lg")!.size).toBe(20);
    expect(s.find((x) => x.name === "sm")!.size).toBe(12.8);
  });
  it("spacing is multiples of the unit", () => {
    expect(spacingScale(4).map((s) => s.value)).toEqual([0, 4, 8, 12, 16, 24, 32, 48, 64, 96]);
  });
  it("tokens include each palette role with a readable foreground", () => {
    const t = buildTokens({ name: "x", rationale: "", colors: [{ name: "Ink", hex: "#111111", role: "Primary", usage: [] }] }, DEFAULT_OPTIONS);
    expect(t.color['primary']).toBe("#111111");
    expect(t.color["primary-foreground"]).toBe("#FFFFFF");
  });
});

import { toDtcg, toSketchPalette } from "./design-system";
describe("design tool exports", () => {
  const p = { name: "x", rationale: "", colors: [{ name: "Ink", hex: "#FF0000", role: "Primary", usage: [] }] };
  it("DTCG tokens carry $type and $value", () => {
    expect(toDtcg(buildTokens(p, DEFAULT_OPTIONS)).color["primary"]).toEqual({ $type: "color", $value: "#FF0000" });
  });
  it("Sketch palette uses 0-1 channels", () => {
    expect(toSketchPalette(p).colors[0]).toMatchObject({ red: 1, green: 0, blue: 0, alpha: 1 });
  });
});
