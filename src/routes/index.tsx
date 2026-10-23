import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Copy, ImagePlus, Loader2, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generatePalette, type Palette } from "@/lib/palette.functions";
import { contrast, fixWcag, readableOn, slug } from "@/lib/color";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Intent to Palette — AI color palettes from your design intent" },
      { name: "description", content: "Describe a mood, add reference images, and get an AI-crafted color palette for product or visual design." },
      { property: "og:title", content: "Intent to Palette" },
      { property: "og:description", content: "Turn design intent and reference images into a usable color palette." },
    ],
  }),
  component: Index,
});

const REFINES = ["Warmer", "Cooler", "More muted", "More vibrant", "Higher contrast"];

function readFile(f: File) {
  return new Promise<string>((res, rej) => {
    const img = new Image();
    const url = URL.createObjectURL(f);
    img.onload = () => {
      const max = 1024;
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = img.width * k;
      c.height = img.height * k;
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      res(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = rej;
    img.src = url;
  });
}

function Index() {
  const gen = useServerFn(generatePalette);
  const [intent, setIntent] = useState("");
  const [mode, setMode] = useState<"product" | "visual">("product");
  const [images, setImages] = useState<string[]>([]);
  const [history, setHistory] = useState<{ palette: Palette; label: string }[]>([]);
  const [current, setCurrent] = useState(-1);
  const palette = current >= 0 ? history[current].palette : null;
  const push = (p: Palette, label: string) => {
    setHistory((h) => [...h, { palette: p, label }]);
    setCurrent(history.length);
  };
  const [loading, setLoading] = useState(false);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function addFiles(files: FileList | null) {
    if (!files) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, 6 - images.length);
    const urls = await Promise.all(list.map(readFile));
    setImages((p) => [...p, ...urls].slice(0, 6));
  }

  async function run(refine?: string) {
    setLoading(true);
    try {
      const p = await gen({
        data: { intent, mode, images, refine, previous: refine && palette ? JSON.stringify(palette) : undefined },
      });
      push(p, refine ?? (history.length ? "Regenerated" : "Original"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const copy = (t: string, label = t) => {
    navigator.clipboard.writeText(t);
    toast.success(`Copied ${label}`);
  };

  function fixAccess() {
    if (!palette) return;
    const fixed = { ...palette, colors: fixWcag(palette.colors) };
    if (fixed.colors.every((c, i) => c.hex === palette.colors[i]?.hex)) return toast.success("Already WCAG AA compliant");
    push(fixed, "WCAG fixed");
    toast.success("Adjusted colors to meet WCAG AA");
  }

  const byRole = (r: string) => palette?.colors.find((c) => c.role.toLowerCase().includes(r))?.hex;
  const bg = byRole("background") ?? palette?.colors.at(-1)?.hex ?? "#FFFFFF";
  const text = byRole("text") ?? byRole("dark") ?? readableOn(bg);
  const primary = byRole("primary") ?? byRole("dominant") ?? palette?.colors[0]?.hex ?? "#000000";
  const surface = byRole("surface") ?? byRole("light") ?? bg;
  const accent = byRole("accent") ?? primary;

  const exportCss = () =>
    `:root {\n${palette!.colors.map((c) => `  --color-${slug(c.role)}: ${c.hex};`).join("\n")}\n}`;
  const exportTw = () =>
    `colors: {\n${palette!.colors.map((c) => `  "${slug(c.role)}": "${c.hex}",`).join("\n")}\n}`;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 md:py-20">
      <header className="mb-12">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">Intent → Palette</p>
        <h1 className="mt-3 max-w-3xl text-5xl leading-[1.05] md:text-7xl">
          Say what it should <em className="text-accent">feel</em> like.
        </h1>
      </header>

      <div className="grid gap-12 lg:grid-cols-[380px_1fr]">
        <section className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="intent">Your intent</label>
            <textarea
              id="intent"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              rows={5}
              placeholder="Calm fintech onboarding — trustworthy, but warm and human. For first-time investors."
              className="w-full resize-none rounded-sm border border-input bg-card p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex rounded-sm border border-input p-1 text-sm">
            {(["product", "visual"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-sm py-2 transition-colors ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {m === "product" ? "Product UI" : "Visual / Brand"}
              </button>
            ))}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Reference images <span className="text-muted-foreground">({images.length}/6)</span></p>
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
              onClick={() => images.length < 6 && fileRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border border-dashed p-6 text-center text-sm text-muted-foreground transition-colors ${drag ? "border-accent bg-secondary" : "border-input hover:bg-secondary"}`}
            >
              <ImagePlus className="h-5 w-5" />
              Drop images or click to add
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
            {images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {images.map((src, i) => (
                  <div key={i} className="group relative aspect-square overflow-hidden rounded-sm">
                    <img src={src} alt={`Reference ${i + 1}`} className="h-full w-full object-cover" />
                    <button
                      aria-label="Remove image"
                      onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                      className="absolute right-1 top-1 rounded-full bg-background/90 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button className="h-12 w-full text-base" disabled={loading} onClick={() => run()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Mixing colors…" : palette ? "Regenerate" : "Generate palette"}
          </Button>
        </section>

        <section>
          {!palette ? (
            <div className="flex h-full min-h-[420px] items-center justify-center rounded-sm border border-dashed border-input p-10 text-center">
              <p className="max-w-xs font-display text-2xl text-muted-foreground">Your palette will appear here.</p>
            </div>
          ) : (
            <div className={`space-y-10 transition-opacity ${loading ? "opacity-50" : ""}`}>
              {history.length > 1 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Versions</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {history.map((h, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrent(i)}
                        className={`shrink-0 rounded-sm border p-1.5 text-left transition-colors ${i === current ? "border-foreground" : "border-border hover:border-muted-foreground"}`}
                      >
                        <div className="flex h-6 w-28 overflow-hidden rounded-sm">
                          {h.palette.colors.map((c, j) => <div key={j} className="flex-1" style={{ background: c.hex }} />)}
                        </div>
                        <p className="mt-1 text-[11px]">v{i + 1} · <span className="text-muted-foreground">{h.label}</span></p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-4xl">{palette.name}</h2>
                <p className="mt-3 max-w-2xl text-muted-foreground">{palette.rationale}</p>
              </div>

              <div className="flex h-56 overflow-hidden rounded-sm">
                {palette.colors.map((c) => (
                  <button
                    key={c.hex + c.role}
                    onClick={() => copy(c.hex)}
                    style={{ background: c.hex, color: readableOn(c.hex) }}
                    className="group flex flex-1 flex-col justify-end p-3 text-left transition-[flex] hover:flex-[1.6]"
                  >
                    <span className="text-[10px] uppercase tracking-widest opacity-70">{c.role}</span>
                    <span className="font-mono text-sm">{c.hex}</span>
                  </button>
                ))}
              </div>

              <div className="grid gap-px overflow-hidden rounded-sm border border-border bg-border sm:grid-cols-2">
                {palette.colors.map((c) => (
                  <div key={c.hex + c.role} className="flex gap-3 bg-card p-4">
                    <div className="h-10 w-10 shrink-0 rounded-sm" style={{ background: c.hex }} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{c.name} <span className="text-muted-foreground">· {c.role}</span></p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {c.usage.map((u) => (
                          <span key={u} className="rounded-sm bg-secondary px-1.5 py-0.5 text-[11px] text-secondary-foreground">{u}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-sm p-6" style={{ background: bg, color: text }}>
                  <p className="text-xs uppercase tracking-widest opacity-60">Preview</p>
                  <h3 className="mt-2 text-2xl">Welcome aboard</h3>
                  <div className="mt-4 rounded-sm p-4" style={{ background: surface }}>
                    <p className="text-sm opacity-80">Your first goal is ready. Let's set it up together.</p>
                    <div className="mt-4 flex gap-2">
                      <span className="rounded-sm px-4 py-2 text-sm font-medium" style={{ background: primary, color: readableOn(primary) }}>Get started</span>
                      <span className="rounded-sm px-4 py-2 text-sm font-medium" style={{ color: accent }}>Learn more</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">Contrast (WCAG AA ≥ 4.5)</p>
                  {([
                    ["Text on background", text, bg],
                    ["Text on surface", text, surface],
                    ["Label on primary", readableOn(primary), primary],
                    ["Accent on background", accent, bg],
                  ] as [string, string, string][]).map(([l, a, b]) => {
                    const r = contrast(a, b);
                    return (
                      <div key={l} className="flex items-center justify-between border-b border-border py-2">
                        <span>{l}</span>
                        <span className={r >= 4.5 ? "text-foreground" : "text-destructive"}>
                          {r.toFixed(2)} · {r >= 4.5 ? "Pass" : "Fail"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {REFINES.map((r) => (
                  <Button key={r} variant="outline" size="sm" disabled={loading} onClick={() => run(r)}>{r}</Button>
                ))}
                <Button size="sm" disabled={loading} onClick={fixAccess}><ShieldCheck className="h-3 w-3" />Fix WCAG Accessibility</Button>
                <span className="mx-2 w-px bg-border" />
                <Button variant="secondary" size="sm" onClick={() => copy(exportCss(), "CSS variables")}><Copy className="h-3 w-3" />CSS</Button>
                <Button variant="secondary" size="sm" onClick={() => copy(exportTw(), "Tailwind colors")}><Copy className="h-3 w-3" />Tailwind</Button>
                <Button variant="secondary" size="sm" onClick={() => copy(JSON.stringify(palette, null, 2), "JSON")}><Copy className="h-3 w-3" />JSON</Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
