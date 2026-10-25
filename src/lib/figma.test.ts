import { describe, expect, it } from "vitest";
import { paletteToSvg } from "./figma";

const p = {
  name: "Dune & Sea",
  colors: [
    { name: "Sand", hex: "#E8D5B7", role: "background" },
    { name: "Ink", hex: "#1A2B3C", role: "text" },
    { name: "Coral", hex: "#FF6F59", role: "accent" },
  ],
};

describe("paletteToSvg", () => {
  it("draws one named tile per color", () => {
    const svg = paletteToSvg(p);
    expect(svg.match(/rx="16" fill="#/g)?.length).toBe(3);
    expect(svg).toContain('id="Coral"');
    expect(svg).toContain("Dune &amp; Sea");
  });
  it("includes gradients when present", () => {
    const svg = paletteToSvg({ ...p, gradients: [{ name: "Dusk", type: "linear", angle: 90, stops: [{ hex: "#FF6F59", position: 0 }, { hex: "#1A2B3C", position: 100 }], usage: [] }] });
    expect(svg).toContain("<linearGradient");
    expect(svg).toContain('fill="url(#g0)"');
  });
});
