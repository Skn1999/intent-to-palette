import { readableOn, type Gradient } from "./color";

type P = { name: string; colors: { name: string; hex: string; role: string }[]; gradients?: Gradient[] };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const TILE = 160, GAP = 24, PAD = 40, LABEL = 56;

/** Swatch sheet as SVG; pastes into Figma/FigJam as editable, named layers. */
export function paletteToSvg(p: P) {
  const cols = Math.min(4, Math.max(1, p.colors.length));
  const grads = p.gradients ?? [];
  const rowH = TILE + LABEL + GAP;
  const colorRows = Math.ceil(p.colors.length / cols);
  const gradRows = Math.ceil(grads.length / 2);
  const width = PAD * 2 + cols * TILE + (cols - 1) * GAP;
  const gradW = (width - PAD * 2 - GAP) / 2;
  const top = PAD + 48;
  const height = top + colorRows * rowH + (grads.length ? 32 + gradRows * (100 + LABEL) : 0) + PAD - GAP;
  const font = `font-family="Inter, sans-serif"`;
  const parts: string[] = [];
  parts.push(`<rect width="${width}" height="${height}" fill="#FFFFFF"/>`);
  parts.push(`<text x="${PAD}" y="${PAD + 20}" ${font} font-size="24" font-weight="600" fill="#111111">${esc(p.name)}</text>`);
  p.colors.forEach((c, i) => {
    const x = PAD + (i % cols) * (TILE + GAP), y = top + Math.floor(i / cols) * rowH;
    parts.push(`<g id="${esc(c.name)}"><rect x="${x}" y="${y}" width="${TILE}" height="${TILE}" rx="16" fill="${c.hex}"/>` +
      `<text x="${x + 12}" y="${y + TILE - 14}" ${font} font-size="12" fill="${readableOn(c.hex)}">${esc(c.role)}</text>` +
      `<text x="${x}" y="${y + TILE + 22}" ${font} font-size="14" font-weight="600" fill="#111111">${esc(c.name)}</text>` +
      `<text x="${x}" y="${y + TILE + 42}" ${font} font-size="12" fill="#666666">${c.hex}</text></g>`);
  });
  if (grads.length) {
    const gy = top + colorRows * rowH + 8;
    const defs = grads.map((g, i) => {
      const stops = [...g.stops].sort((a, b) => a.position - b.position).map((s) => `<stop offset="${s.position}%" stop-color="${s.hex}"/>`).join("");
      if (g.type === "radial") return `<radialGradient id="g${i}">${stops}</radialGradient>`;
      const a = ((g.angle - 90) * Math.PI) / 180;
      const dx = Math.cos(a) / 2, dy = Math.sin(a) / 2;
      return `<linearGradient id="g${i}" x1="${0.5 - dx}" y1="${0.5 - dy}" x2="${0.5 + dx}" y2="${0.5 + dy}">${stops}</linearGradient>`;
    });
    parts.unshift(`<defs>${defs.join("")}</defs>`);
    grads.forEach((g, i) => {
      const x = PAD + (i % 2) * (gradW + GAP), y = gy + Math.floor(i / 2) * (100 + LABEL);
      parts.push(`<g id="${esc(g.name)}"><rect x="${x}" y="${y}" width="${gradW}" height="100" rx="16" fill="url(#g${i})"/>` +
        `<text x="${x}" y="${y + 122}" ${font} font-size="14" font-weight="600" fill="#111111">${esc(g.name)}</text></g>`);
    });
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join("")}</svg>`;
}

export async function svgToPng(svg: string): Promise<Blob> {
  const img = new Image();
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = img.width * 2; canvas.height = img.height * 2;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(2, 2); ctx.drawImage(img, 0, 0);
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("PNG failed"))), "image/png"));
}

export function download(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
