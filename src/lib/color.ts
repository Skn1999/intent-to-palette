export function luminance(hex: string) {
  const h = hex.replace("#", "");
  const [r = 0, g = 0, b = 0] = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string) {
  const [l1 = 0, l2 = 0] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

export function readableOn(hex: string) {
  return contrast(hex, "#FFFFFF") >= contrast(hex, "#111111") ? "#FFFFFF" : "#111111";
}

export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function toRgb(hex: string) {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
function toHex(rgb: number[]) {
  return "#" + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("").toUpperCase();
}

/** Shift fg toward black or white (whichever helps) until it reaches `target` contrast against bg. */
export function ensureContrast(fg: string, bg: string, target = 4.5) {
  if (contrast(fg, bg) >= target) return fg;
  const towardWhite = luminance(bg) < 0.18;
  const end = towardWhite ? [255, 255, 255] : [0, 0, 0];
  const start = toRgb(fg);
  for (let t = 0.02; t <= 1; t += 0.02) {
    const c = toHex(start.map((v, i) => v + ((end[i] ?? 0) - v) * t));
    if (contrast(c, bg) >= target) return c;
  }
  return toHex(end);
}

type C = { hex: string; role: string };
export function findRole(colors: C[], ...keys: string[]) {
  for (const k of keys) {
    const i = colors.findIndex((c) => c.role.toLowerCase().includes(k));
    if (i >= 0) return i;
  }
  return -1;
}

/** Returns a copy where text, accent and primary meet WCAG AA (4.5:1) against background and surface. */
export function fixWcag<T extends C>(colors: T[]): T[] {
  const out = colors.map((c) => ({ ...c }));
  const bgI = findRole(out, "background", "light");
  const bg = bgI >= 0 ? out[bgI]!.hex : "#FFFFFF";
  const sI = findRole(out, "surface");
  const surface = sI >= 0 ? out[sI]!.hex : bg;
  const worst = (hex: string) => (contrast(hex, bg) < contrast(hex, surface) ? bg : surface);
  for (const keys of [["text", "dark"], ["accent"], ["success"], ["error"]]) {
    const i = findRole(out, ...keys);
    if (i >= 0 && i !== bgI && i !== sI) out[i]!.hex = ensureContrast(out[i]!.hex, worst(out[i]!.hex));
  }
  const pI = findRole(out, "primary", "dominant");
  if (pI >= 0 && pI !== bgI) {
    const p = out[pI]!.hex;
    const label = readableOn(p);
    if (contrast(label, p) < 4.5) out[pI]!.hex = ensureContrast(p, label);
  }
  return out;
}

export type Gradient = { name: string; type: "linear" | "radial"; angle: number; stops: { hex: string; position: number }[]; usage: string[] };

export function gradientCss(g: Gradient) {
  const stops = [...g.stops].sort((a, b) => a.position - b.position).map((s) => `${s.hex} ${Math.round(s.position)}%`).join(", ");
  return g.type === "radial" ? `radial-gradient(circle, ${stops})` : `linear-gradient(${Math.round(g.angle)}deg, ${stops})`;
}

/** Replace gradient stop colors that were changed in the palette (old hex -> new hex). */
export function syncGradients(gradients: Gradient[] | undefined, before: C[], after: C[]) {
  if (!gradients) return gradients;
  const map = new Map(before.map((c, i) => [c.hex.toUpperCase(), after[i]?.hex ?? c.hex]));
  return gradients.map((g) => ({ ...g, stops: g.stops.map((s) => ({ ...s, hex: map.get(s.hex.toUpperCase()) ?? s.hex })) }));
}
