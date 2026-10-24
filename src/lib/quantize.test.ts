import { expect, it } from "vitest";
import { quantize } from "./quantize";

it("returns the dominant color first with its share", () => {
  const px = [...Array(75).fill([200, 80, 40]), ...Array(25).fill([20, 40, 120])];
  const r = quantize(px);
  expect(r[0]).toEqual({ hex: "#C85028", share: 75 });
  expect(r[1]).toEqual({ hex: "#142878", share: 25 });
});
