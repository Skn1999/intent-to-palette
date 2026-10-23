import { describe, expect, it } from "vitest";
import { removeVersion, upsertWork, type Version, type Work } from "./works";

const v = (label: string): Version => ({ label, palette: { name: label, rationale: "", colors: [] } });

describe("removeVersion", () => {
  it("keeps the same version selected when an earlier one is deleted", () => {
    const r = removeVersion([v("a"), v("b"), v("c")], 2, 0);
    expect(r.history.map((h) => h.label)).toEqual(["b", "c"]);
    expect(r.current).toBe(1);
  });
  it("selects the previous one when the last selected version is deleted", () => {
    expect(removeVersion([v("a"), v("b")], 1, 1).current).toBe(0);
  });
  it("returns -1 when deleting the only version", () => {
    expect(removeVersion([v("a")], 0, 0)).toEqual({ history: [], current: -1 });
  });
});

describe("upsertWork", () => {
  it("replaces an existing work instead of duplicating it", () => {
    const w = (id: string, name: string): Work => ({ id, name, intent: "", mode: "product", history: [], savedAt: 0 });
    const out = upsertWork([w("1", "old"), w("2", "x")], w("1", "new"));
    expect(out.map((x) => x.name)).toEqual(["new", "x"]);
  });
});
