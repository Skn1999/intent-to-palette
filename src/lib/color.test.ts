import { describe, expect, it } from "vitest";
import { contrast } from "./color";

describe("contrast", () => {
  it("black on white is 21:1", () => expect(contrast("#000000", "#FFFFFF")).toBeCloseTo(21, 1));
  it("#777777 on white fails AA (below 4.5)", () => expect(contrast("#777777", "#FFFFFF")).toBeLessThan(4.5));
});
