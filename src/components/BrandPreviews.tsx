import { useState } from "react";
import { findRole, gradientCss, readableOn } from "@/lib/color";
import type { Palette } from "@/lib/palette.functions";

const TABS = ["Poster", "Business card", "Social post", "Packaging", "Pattern"] as const;

export function BrandPreviews({ palette }: { palette: Palette }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Poster");
  const cs = palette.colors;
  const pick = (keys: string[], fb: number) => {
    const i = findRole(cs, ...keys);
    return (cs[i >= 0 ? i : Math.min(fb, cs.length - 1)] ?? cs[0]!).hex;
  };
  const dom = pick(["dominant", "primary"], 0);
  const sec = pick(["secondary"], 1);
  const acc = pick(["accent"], 2);
  const hi = pick(["highlight"], 3);
  const light = pick(["light", "background"], 4);
  const dark = pick(["dark", "text"], 5);
  const grad = palette.gradients?.[0] ? gradientCss(palette.gradients[0]) : undefined;
  const brand = palette.name.split(" ")[0] ?? "Brand";

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">Brand preview</p>
        <div className="flex flex-wrap gap-1 rounded-md bg-secondary p-0.5">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded px-2.5 py-1 text-xs transition-colors ${tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{t}</button>
          ))}
        </div>
      </div>

      <div className="flex min-h-[340px] items-center justify-center rounded-md bg-secondary/50 p-6">
        {tab === "Poster" && (
          <div className="relative flex aspect-[3/4] w-60 flex-col justify-between overflow-hidden rounded p-5 shadow-lg" style={{ background: grad ?? dom, color: readableOn(dom) }}>
            <div className="absolute -right-10 top-16 h-40 w-40 rounded-full" style={{ background: acc }} />
            <div className="absolute -left-6 bottom-24 h-20 w-32" style={{ background: hi }} />
            <p className="relative text-[10px] uppercase tracking-[0.25em] opacity-80">Vol. 01</p>
            <div className="relative">
              <h3 className="text-4xl leading-none">{brand}</h3>
              <p className="mt-3 text-[10px] opacity-80">{palette.rationale.slice(0, 80)}…</p>
            </div>
          </div>
        )}

        {tab === "Business card" && (
          <div className="flex flex-wrap justify-center gap-5">
            <div className="flex h-36 w-64 items-center justify-center rounded-md shadow-lg" style={{ background: grad ?? dom, color: readableOn(dom) }}>
              <span className="font-display text-3xl italic">{brand}</span>
            </div>
            <div className="flex h-36 w-64 flex-col justify-between rounded-md p-4 shadow-lg" style={{ background: light, color: dark }}>
              <div>
                <p className="font-display text-lg">Alex Morgan</p>
                <p className="text-[11px]" style={{ color: acc }}>Creative Director</p>
              </div>
              <div className="flex items-end justify-between text-[10px] opacity-80">
                <span>hello@{brand.toLowerCase()}.studio<br />+1 555 0123</span>
                <span className="h-5 w-5 rounded-full" style={{ background: acc }} />
              </div>
            </div>
          </div>
        )}

        {tab === "Social post" && (
          <div className="flex aspect-square w-72 flex-col justify-between rounded-md p-6 shadow-lg" style={{ background: grad ?? sec, color: readableOn(sec) }}>
            <div className="flex items-center gap-2">
              <span className="h-7 w-7 rounded-full" style={{ background: acc }} />
              <span className="text-xs font-medium">@{brand.toLowerCase()}</span>
            </div>
            <p className="font-display text-2xl leading-tight">“Design is how it feels, not just how it looks.”</p>
            <div className="flex gap-1.5">{cs.map((c, i) => <span key={i} className="h-2 flex-1 rounded-full" style={{ background: c.hex }} />)}</div>
          </div>
        )}

        {tab === "Packaging" && (
          <div className="flex items-end gap-4">
            <div className="flex h-64 w-40 flex-col overflow-hidden rounded-md shadow-lg" style={{ background: light, color: dark }}>
              <div className="h-16" style={{ background: grad ?? dom }} />
              <div className="flex flex-1 flex-col items-center justify-center gap-1 p-3 text-center">
                <span className="font-display text-2xl">{brand}</span>
                <span className="text-[10px] uppercase tracking-widest" style={{ color: acc }}>Small batch</span>
              </div>
              <div className="flex h-6">{[sec, acc, hi, dom].map((h, i) => <span key={i} className="flex-1" style={{ background: h }} />)}</div>
            </div>
            <div className="flex h-44 w-28 flex-col items-center justify-center rounded-t-[40px] rounded-b-md shadow-lg" style={{ background: dark, color: readableOn(dark) }}>
              <span className="h-10 w-10 rounded-full" style={{ background: hi }} />
              <span className="mt-3 font-display text-sm">{brand}</span>
            </div>
          </div>
        )}

        {tab === "Pattern" && (
          <div className="grid w-full max-w-md grid-cols-6 overflow-hidden rounded-md shadow-lg">
            {Array.from({ length: 36 }, (_, i) => {
              const c = cs[(i * 7 + Math.floor(i / 6)) % cs.length]!.hex;
              const d = cs[(i * 3 + 1) % cs.length]!.hex;
              const shape = i % 4;
              return (
                <div key={i} className="relative aspect-square overflow-hidden" style={{ background: c }}>
                  {shape === 0 && <span className="absolute inset-2 rounded-full" style={{ background: d }} />}
                  {shape === 1 && <span className="absolute -bottom-1/2 -left-1/2 h-full w-full rounded-full" style={{ background: d }} />}
                  {shape === 2 && <span className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${d} 50%, transparent 50%)` }} />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
