import type { Palette } from "./palette.functions";

export type Version = { palette: Palette; label: string };
export type Work = {
  id: string;
  name: string;
  intent: string;
  mode: "product" | "visual";
  history: Version[];
  savedAt: number;
};

const KEY = "intent-palette-works";

export function loadWorks(): Work[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Work[];
  } catch {
    return [];
  }
}

export function storeWorks(works: Work[]) {
  localStorage.setItem(KEY, JSON.stringify(works));
}

/** Insert or replace a work by id; newest first. */
export function upsertWork(works: Work[], w: Work): Work[] {
  return [w, ...works.filter((x) => x.id !== w.id)];
}

/** Remove a version, returning the new history and the index to show. */
export function removeVersion(history: Version[], current: number, idx: number) {
  const next = history.filter((_, i) => i !== idx);
  let cur = current;
  if (idx < current) cur = current - 1;
  else if (idx === current) cur = Math.min(current, next.length - 1);
  return { history: next, current: cur };
}
