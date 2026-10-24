const hex = (c: number[]) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();

/** Bucket RGB pixels (4 bits/channel), merge similar buckets, return top colors with share %. */
export function quantize(px: number[][], max = 10) {
  const map = new Map<number, { n: number; s: number[] }>();
  for (const [r = 0, g = 0, b = 0] of px) {
    const k = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const e = map.get(k) ?? { n: 0, s: [0, 0, 0] };
    e.n++; e.s[0]! += r; e.s[1]! += g; e.s[2]! += b;
    map.set(k, e);
  }
  const buckets = [...map.values()].map((e) => ({ n: e.n, c: e.s.map((v) => v / e.n) })).sort((a, b) => b.n - a.n);
  const picked: { n: number; c: number[] }[] = [];
  for (const b of buckets) {
    const near = picked.find((p) => Math.hypot(p.c[0]! - b.c[0]!, p.c[1]! - b.c[1]!, p.c[2]! - b.c[2]!) < 40);
    if (near) near.n += b.n; else picked.push({ ...b });
  }
  const total = px.length || 1;
  return picked.sort((a, b) => b.n - a.n).slice(0, max).map((p) => ({ hex: hex(p.c), share: Math.round((p.n / total) * 100) }));
}
