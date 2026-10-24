import { quantize } from "./quantize";

function pixels(src: string): Promise<number[][]> {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      const s = 96;
      const r = Math.min(1, s / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.width * r));
      c.height = Math.max(1, Math.round(img.height * r));
      const ctx = c.getContext("2d");
      if (!ctx) return res([]);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      const out: number[][] = [];
      for (let i = 0; i < d.length; i += 4) if ((d[i + 3] ?? 0) > 200) out.push([d[i]!, d[i + 1]!, d[i + 2]!]);
      res(out);
    };
    img.onerror = () => res([]);
    img.src = src;
  });
}

/** Silently samples dominant colors from images (hidden from the UI; sent to the AI as grounding). */
export async function extractColors(images: string[]) {
  const all = (await Promise.all(images.map(pixels))).flat();
  return quantize(all, 10);
}
