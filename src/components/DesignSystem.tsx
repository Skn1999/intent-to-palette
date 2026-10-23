import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Palette } from "@/lib/palette.functions";
import { readableOn, slug } from "@/lib/color";
import {
  buildTokens, DEFAULT_OPTIONS, downloadText, FONT_PAIRS, radiusScale, RATIOS, spacingScale, toCss, toTailwind, typeScale, type DSOptions,
} from "@/lib/design-system";

const sel = "h-8 w-full rounded-md border border-input bg-muted/50 px-2 text-sm outline-none focus:border-ring";

export function DesignSystem({ palette }: { palette: Palette }) {
  const [o, setO] = useState<DSOptions>(DEFAULT_OPTIONS);
  const set = <K extends keyof DSOptions>(k: K, v: DSOptions[K]) => setO((p) => ({ ...p, [k]: v }));
  const tokens = useMemo(() => buildTokens(palette, o), [palette, o]);
  const file = slug(palette.name) || "design-system";

  const role = (r: string) => palette.colors.find((c) => c.role.toLowerCase().includes(r))?.hex;
  const bg = role("background") ?? palette.colors.at(-1)!.hex;
  const surface = role("surface") ?? bg;
  const text = role("text") ?? readableOn(bg);
  const primary = role("primary") ?? palette.colors[0]!.hex;
  const secondary = role("secondary") ?? surface;
  const accent = role("accent") ?? primary;
  const success = role("success") ?? "#16A34A";
  const error = role("error") ?? "#DC2626";
  const r = o.radius;
  const H = { fontFamily: `"${o.headingFont}", serif` };
  const B = { fontFamily: `"${o.bodyFont}", sans-serif` };

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="space-y-1 text-xs text-muted-foreground lg:col-span-2">Fonts
          <select className={sel} value={`${o.headingFont}|${o.bodyFont}`}
            onChange={(e) => { const [h, b] = e.target.value.split("|"); setO((p) => ({ ...p, headingFont: h!, bodyFont: b! })); }}>
            {FONT_PAIRS.map((f) => <option key={f.label} value={`${f.heading}|${f.body}`}>{f.label}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-xs text-muted-foreground">Type scale
          <select className={sel} value={o.ratio} onChange={(e) => set("ratio", Number(e.target.value))}>
            {RATIOS.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-xs text-muted-foreground">Spacing unit
          <select className={sel} value={o.spaceUnit} onChange={(e) => set("spaceUnit", Number(e.target.value))}>
            {[4, 6, 8].map((x) => <option key={x} value={x}>{x}px</option>)}
          </select>
        </label>
        <label className="space-y-1 text-xs text-muted-foreground">Corner radius · {o.radius}px
          <input type="range" min={0} max={20} value={o.radius} onChange={(e) => set("radius", Number(e.target.value))} className="h-8 w-full accent-primary" />
        </label>
      </div>

      {/* Typography */}
      <section>
        <h3 className="mb-3 text-lg">Typography</h3>
        <div className="divide-y divide-border rounded-lg border border-border bg-card">
          {typeScale(o.baseSize, o.ratio).slice().reverse().map((s) => (
            <div key={s.name} className="flex items-baseline gap-4 px-4 py-3">
              <span className="w-20 shrink-0 font-mono text-[11px] text-muted-foreground">{s.name} · {Math.round(s.size)}px</span>
              <span className="truncate" style={{ ...(s.size >= 20 ? H : B), fontSize: s.size, lineHeight: 1.2 }}>
                {s.size >= 20 ? palette.name : "The quick brown fox jumps over the lazy dog"}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Spacing + radius */}
      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="mb-3 text-lg">Spacing</h3>
          <div className="space-y-1.5 rounded-lg border border-border bg-card p-4">
            {spacingScale(o.spaceUnit).slice(1).map((s) => (
              <div key={s.name} className="flex items-center gap-3">
                <span className="w-16 font-mono text-[11px] text-muted-foreground">{s.name} · {s.value}</span>
                <div className="h-3 rounded-sm" style={{ width: s.value, background: primary }} />
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-lg">Radius & elevation</h3>
          <div className="grid grid-cols-4 gap-3 rounded-lg border border-border bg-card p-4">
            {radiusScale(o.radius).map((x) => (
              <div key={x.name} className="text-center">
                <div className="mx-auto h-14 w-14 border-2" style={{ borderRadius: Math.min(x.value, 28), borderColor: accent }} />
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">{x.name}</p>
              </div>
            ))}
            {Object.entries(tokens.shadow).map(([k, v]) => (
              <div key={k} className="col-span-4 sm:col-span-1 text-center">
                <div className="mx-auto h-14 w-14 bg-card" style={{ boxShadow: v, borderRadius: r }} />
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">shadow-{k}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Components */}
      <section>
        <h3 className="mb-3 text-lg">Components</h3>
        <div className="space-y-6 rounded-lg p-6" style={{ background: bg, color: text, ...B }}>
          <div className="flex flex-wrap items-center gap-3">
            <button style={{ background: primary, color: readableOn(primary), borderRadius: r, padding: `${o.spaceUnit * 2}px ${o.spaceUnit * 4}px` }} className="text-sm font-semibold">Primary</button>
            <button style={{ background: secondary, color: readableOn(secondary), borderRadius: r, padding: `${o.spaceUnit * 2}px ${o.spaceUnit * 4}px` }} className="text-sm font-semibold">Secondary</button>
            <button style={{ border: `1px solid ${text}33`, color: text, borderRadius: r, padding: `${o.spaceUnit * 2}px ${o.spaceUnit * 4}px` }} className="text-sm font-semibold">Outline</button>
            <button style={{ color: accent, padding: `${o.spaceUnit * 2}px ${o.spaceUnit * 2}px` }} className="text-sm font-semibold">Ghost link</button>
            <span style={{ background: accent, color: readableOn(accent), borderRadius: 9999 }} className="px-2.5 py-0.5 text-xs font-semibold">Badge</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div style={{ background: surface, borderRadius: r * 1.5, padding: o.spaceUnit * 5, boxShadow: tokens.shadow.md }}>
              <p style={H} className="text-xl">Card title</p>
              <p className="mt-1 text-sm opacity-75">Cards group related content using the surface color and medium elevation.</p>
              <label className="mt-4 block text-xs font-semibold opacity-80">Email</label>
              <input placeholder="you@example.com" style={{ background: bg, border: `1px solid ${text}26`, borderRadius: r, color: text }} className="mt-1 h-9 w-full px-3 text-sm outline-none" />
              <div className="mt-3 flex items-center gap-2 text-sm">
                <span className="inline-block h-4 w-4" style={{ background: primary, borderRadius: Math.max(2, r / 3) }} /> Remember me
              </div>
            </div>
            <div className="space-y-3">
              <div style={{ background: `${success}1F`, border: `1px solid ${success}55`, borderRadius: r, padding: o.spaceUnit * 3 }} className="text-sm">
                <strong style={{ color: success }}>Success</strong> — Your changes were saved.
              </div>
              <div style={{ background: `${error}1F`, border: `1px solid ${error}55`, borderRadius: r, padding: o.spaceUnit * 3 }} className="text-sm">
                <strong style={{ color: error }}>Error</strong> — Something needs your attention.
              </div>
              <div className="flex overflow-hidden text-sm" style={{ border: `1px solid ${text}26`, borderRadius: r }}>
                {["Overview", "Activity", "Settings"].map((t, i) => (
                  <span key={t} className="flex-1 py-2 text-center" style={i === 0 ? { background: primary, color: readableOn(primary) } : {}}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Export */}
      <section className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p4 px-4 py-3">
        <span className="mr-auto text-sm">Download design system</span>
        <Button size="sm" onClick={() => downloadText(JSON.stringify(tokens, null, 2), `${file}.tokens.json`, "application/json")}><Download className="h-3.5 w-3.5" />Tokens JSON</Button>
        <Button size="sm" variant="secondary" onClick={() => downloadText(toCss(tokens), `${file}.css`, "text/css")}><Download className="h-3.5 w-3.5" />CSS variables</Button>
        <Button size="sm" variant="secondary" onClick={() => downloadText(toTailwind(tokens), `${file}.tailwind.css`, "text/css")}><Download className="h-3.5 w-3.5" />Tailwind theme</Button>
      </section>
    </div>
  );
}
