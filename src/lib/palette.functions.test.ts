import { asSchema } from "ai";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => ({
    inputValidator: () => ({ handler: vi.fn() }),
  }),
}));

import { PaletteSchema } from "./palette.functions";

describe("palette AI output schema", () => {
  it("requires every object property in the emitted strict JSON schema", async () => {
    const schema = await asSchema(PaletteSchema).jsonSchema;
    let objects = 0;
    function check(value: unknown) {
      if (!value || typeof value !== "object") return;
      if (Array.isArray(value)) {
        value.forEach(check);
        return;
      }
      const node = value as Record<string, unknown>;
      if (node["type"] === "object") {
        objects++;
        expect(node["additionalProperties"]).toBe(false);
        expect(node["required"]).toEqual(Object.keys(node["properties"] as object));
      }
      Object.values(node).forEach(check);
    }
    check(schema);
    expect(objects).toBe(4);
  });

  it("accepts an empty gradients array but rejects an omitted gradients field", () => {
    const palette = { name: "Calm", rationale: "Quiet tones", colors: [] };
    expect(PaletteSchema.safeParse({ ...palette, gradients: [] }).success).toBe(true);
    expect(PaletteSchema.safeParse(palette).success).toBe(false);
  });

  it("accepts requested gradients with color stops", () => {
    const gradients = [{
      name: "Dawn", type: "linear", angle: 90,
      stops: [{ hex: "#F08080", position: 0 }, { hex: "#FFD700", position: 100 }],
      usage: ["Poster background"],
    }];
    expect(PaletteSchema.parse({ name: "Dawn", rationale: "Warm", colors: [], gradients }).gradients).toEqual(gradients);
  });
});