import type { Palette } from "./palette.functions";
import { readableOn, slug } from "./color";

export type DSOptions = {
  headingFont: string;
  bodyFont: string;
  baseSize: number; // px
  ratio: number; // type scale ratio
  spaceUnit: number; // px
  radius: number; // px
};

export const FONT_PAIRS = [
  { label: "Fraunces + Inter", heading: "Fraunces", body: "Inter" },
  { label: "Inter only", heading: "Inter", body: "Inter" },
  { label: "Playfair + Source Sans", heading: "Playfair Display", body: "Source Sans 3" },
  { label: "Space Grotesk + IBM Plex", heading: "Space Grotesk", body: "IBM Plex Sans" },
  { label: "DM Serif + DM Sans", heading: "DM Serif Display", body: "DM Sans" },
];

export const RATIOS = [
  { label: "Minor third · 1.2", value: 1.2 },
  { label: "Major third · 1.25", value: 1.25 },
  { label: "Perfect fourth · 1.333", value: 1.333 },
  { label: "Golden · 1.618", value: 1.618 },
];

export const DEFAULT_OPTIONS: DSOptions = { headingFont: "Fraunces", bodyFont: "Inter", baseSize: 16, ratio: 1.25, spaceUnit: 4, radius: 8 };

const STEPS = ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl"] as const;

/** Modular type scale: base sits at index 2, each step multiplies by ratio. */
export function typeScale(base: number, ratio: number) {
  return STEPS.map((name, i) => ({ name, size: Math.round(base * Math.pow(ratio, i - 2) * 100) / 100 }));
}

/** Spacing multiples of the unit. */
export const SPACE_MULTS = [0, 1, 2, 3, 4, 6, 8, 12, 16, 24];
export function spacingScale(unit: number) {
  return SPACE_MULTS.map((m) => ({ name: String(m), value: m * unit }));
}

export function radiusScale(r: number) {
  return [
    { name: "sm", value: Math.round(r / 2) },
    { name: "md", value: r },
    { name: "lg", value: r * 2 },
    { name: "full", value: 9999 },
  ];
}

export function buildTokens(p: Palette, o: DSOptions) {
  const colors: Record<string, string> = {};
  p.colors.forEach((c) => {
    colors[slug(c.role)] = c.hex;
    colors[`${slug(c.role)}-foreground`] = readableOn(c.hex);
  });
  return {
    name: p.name,
    color: colors,
    font: { heading: o.headingFont, body: o.bodyFont },
    fontSize: Object.fromEntries(typeScale(o.baseSize, o.ratio).map((s) => [s.name, `${s.size / 16}rem`])),
    lineHeight: { tight: 1.15, normal: 1.5, relaxed: 1.7 },
    spacing: Object.fromEntries(spacingScale(o.spaceUnit).map((s) => [s.name, `${s.value / 16}rem`])),
    radius: Object.fromEntries(radiusScale(o.radius).map((r) => [r.name, r.value === 9999 ? "9999px" : `${r.value / 16}rem`])),
    shadow: {
      sm: "0 1px 2px rgb(0 0 0 / 0.06)",
      md: "0 4px 12px -2px rgb(0 0 0 / 0.10)",
      lg: "0 16px 40px -8px rgb(0 0 0 / 0.18)",
    },
  };
}

export type Tokens = ReturnType<typeof buildTokens>;

export function toCss(t: Tokens) {
  const lines: string[] = [];
  Object.entries(t.color).forEach(([k, v]) => lines.push(`  --color-${k}: ${v};`));
  lines.push(`  --font-heading: "${t.font.heading}", serif;`, `  --font-body: "${t.font.body}", sans-serif;`);
  Object.entries(t.fontSize).forEach(([k, v]) => lines.push(`  --text-${k}: ${v};`));
  Object.entries(t.spacing).forEach(([k, v]) => lines.push(`  --space-${k}: ${v};`));
  Object.entries(t.radius).forEach(([k, v]) => lines.push(`  --radius-${k}: ${v};`));
  Object.entries(t.shadow).forEach(([k, v]) => lines.push(`  --shadow-${k}: ${v};`));
  return `/* ${t.name} — design system */\n:root {\n${lines.join("\n")}\n}\n`;
}

export function toTailwind(t: Tokens) {
  const block = (prefix: string, o: Record<string, string>) => Object.entries(o).map(([k, v]) => `  --${prefix}-${k}: ${v};`).join("\n");
  return `/* ${t.name} — Tailwind v4 theme */\n@theme {\n${block("color", t.color)}\n  --font-heading: "${t.font.heading}", serif;\n  --font-body: "${t.font.body}", sans-serif;\n${block("text", t.fontSize)}\n${block("radius", t.radius)}\n${block("shadow", t.shadow)}\n  --spacing: ${t.spacing["1"]};\n}\n`;
}

export function downloadText(text: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
