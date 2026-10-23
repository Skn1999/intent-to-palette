import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, Copy, FolderOpen, History, ImagePlus, Loader2, Moon, Save, ShieldCheck, Sparkles, Sun, Trash2, X } from "lucide-react";
import { loadWorks, removeVersion, storeWorks, upsertWork, type Work } from "@/lib/works";
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
      const k = Math.min(1, 1024 / Math.max(img.width, img.height));
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

function hexToRgb(h: string) {
  const n = parseInt(h.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
}
function mix(h: string, t: string, a: number) {
  const [r1, g1, b1] = hexToRgb(h), [r2, g2, b2] = hexToRgb(t);
  const f = (x: number, y: number) => Math.round(x + (y - x) * a).toString(16).padStart(2, "0");
  return `#${f(r1, r2)}${f(g1, g2)}${f(b1, b2)}`.toUpperCase();
}
const scale = (h: string) => [0.8, 0.6, 0.4, 0.2].map((a) => mix(h, "#FFFFFF", a)).concat(h, ...[0.2, 0.4, 0.6, 0.8].map((a) => mix(h, "#000000", a)));

function Index() {
  const gen = useServerFn(generatePalette);
  const [intent, setIntent] = useState("");
  const [mode, setMode] = useState<"product" | "visual">("product");
  const [images, setImages] = useState<string[]>([]);
  const [history, setHistory] = useState<{ palette: Palette; label: string }[]>([]);
  const [current, setCurrent] = useState(-1);
  const [selected, setSelected] = useState(0);
  const [versionsOpen, setVersionsOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const palette = current >= 0 ? history[current]!.palette : null;
  const started = history.length > 0;
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(localStorage.getItem("theme") === "dark"); }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);
  const themeBtn = (
    <button aria-label="Toggle theme" onClick={() => setDark((d) => !d)}
      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );

  const [works, setWorks] = useState<Work[]>([]);
  const [workId, setWorkId] = useState<string | null>(null);
  const [workName, setWorkName] = useState("");
  useEffect(() => { setWorks(loadWorks()); }, []);
  const commitWorks = (w: Work[]) => { setWorks(w); storeWorks(w); };

  function saveWork() {
    const name = workName.trim();
    if (!name) { toast.error("Give your work a name"); return; }
    const id = workId ?? crypto.randomUUID();
    try {
      commitWorks(upsertWork(works, { id, name, intent, mode, history, savedAt: Date.now() }));
      setWorkId(id);
      toast.success(`Saved "${name}"`);
    } catch {
      toast.error("Couldn't save — browser storage is full");
    }
  }
  function openWork(w: Work) {
    setWorkId(w.id); setWorkName(w.name); setIntent(w.intent); setMode(w.mode);
    setHistory(w.history); setCurrent(w.history.length - 1); setSelected(0); setImages([]);
  }
  function deleteWork(w: Work) {
    if (!confirm(`Delete "${w.name}"?`)) return;
    commitWorks(works.filter((x) => x.id !== w.id));
    if (w.id === workId) { setWorkId(null); setWorkName(""); }
    toast.success("Work deleted");
  }
  function newWork() {
    setWorkId(null); setWorkName(""); setIntent(""); setImages([]); setHistory([]); setCurrent(-1);
  }
  function deleteVersion(i: number) {
    const r = removeVersion(history, current, i);
    setHistory(r.history); setCurrent(r.current); setSelected(0);
  }

  const savedList = works.length > 0 && (
    <div>
      <p className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground"><FolderOpen className="h-3.5 w-3.5" />Saved work · {works.length}</p>
      <div className="space-y-1">
        {works.map((w) => {
          const last = w.history.at(-1);
          return (
            <div key={w.id} role="button" tabIndex={0} onClick={() => openWork(w)}
              className={`group/w flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 transition-colors ${w.id === workId ? "border-ring bg-secondary" : "border-transparent hover:bg-secondary/60"}`}>
              <div className="flex h-6 w-6 shrink-0 flex-wrap overflow-hidden rounded">
                {last?.palette.colors.slice(0, 4).map((c, j) => <div key={j} className="h-1/2 w-1/2" style={{ background: c.hex }} />)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{w.name}</p>
                <p className="text-[11px] text-muted-foreground">{w.history.length} version{w.history.length === 1 ? "" : "s"}</p>
              </div>
              <button aria-label={`Delete ${w.name}`} onClick={(e) => { e.stopPropagation(); deleteWork(w); }}
                className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover/w:opacity-100">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  const push = (p: Palette, label: string) => {
    setHistory((h) => [...h, { palette: p, label }]);
    setCurrent(history.length);
    setSelected(0);
  };

  async function addFiles(files: FileList | null) {
    if (!files) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, 6 - images.length);
    const urls = await Promise.all(list.map(readFile));
    setImages((p) => [...p, ...urls].slice(0, 6));
  }

  async function run(refine?: string) {
    if (!intent.trim() && images.length === 0) { toast.error("Describe your intent or add an image"); return; }
    setLoading(true);
    try {
      const p = await gen({ data: { intent, mode, images, refine, previous: refine && palette ? JSON.stringify(palette) : undefined } });
      push(p, refine ?? (history.length ? "Regenerated" : "Original"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const copy = (t: string, label = t) => { navigator.clipboard.writeText(t); toast.success(`Copied ${label}`); };

  function fixAccess() {
    if (!palette) return;
    const fixed = { ...palette, colors: fixWcag(palette.colors) };
    if (fixed.colors.every((c, i) => c.hex === palette.colors[i]?.hex)) { toast.success("Already WCAG AA compliant"); return; }
    push(fixed, "WCAG fixed");
    toast.success("Adjusted colors to meet WCAG AA");
  }

  const form = (
    <div className="space-y-5">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="intent">Intent</label>
        <textarea
          id="intent"
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          onPaste={(e) => {
            const files = Array.from(e.clipboardData.files).filter((f) => f.type.startsWith("image/"));
            if (!files.length) return;
            e.preventDefault();
            if (images.length >= 6) { toast.error("Up to 6 images"); return; }
            const dt = new DataTransfer();
            files.forEach((f) => dt.items.add(f));
            addFiles(dt.files).then(() => toast.success(`Added ${files.length} image${files.length > 1 ? "s" : ""}`));
          }}
          rows={started ? 5 : 4}
          placeholder="Calm fintech onboarding — trustworthy, but warm and human."
          className="w-full resize-none rounded-md border border-input bg-muted/50 p-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ring focus:bg-muted"
        />
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Designing for</p>
        <div className="grid grid-cols-2 gap-2">
          {(["product", "visual"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors ${mode === m ? "border-ring bg-secondary text-foreground" : "border-input text-muted-foreground hover:bg-secondary/60"}`}
            >
              <span className={`flex h-4 w-4 items-center justify-center rounded border ${mode === m ? "border-primary bg-primary" : "border-input"}`}>
                {mode === m && <Check className="h-3 w-3 text-primary-foreground" />}
              </span>
              {m === "product" ? "Product UI" : "Visual / Brand"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Reference images <span className="opacity-60">{images.length}/6</span></p>
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
          onClick={() => images.length < 6 && fileRef.current?.click()}
          className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-4 text-sm text-muted-foreground transition-colors ${drag ? "border-ring bg-secondary" : "border-input hover:bg-secondary/60"}`}
        >
          <ImagePlus className="h-4 w-4" /> Drop or click to add
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
        {images.length > 0 && (
          <div className="mt-2 grid grid-cols-6 gap-1.5">
            {images.map((src, i) => (
              <div key={i} className="group relative aspect-square overflow-hidden rounded">
                <img src={src} alt={`Reference ${i + 1}`} className="h-full w-full object-cover" />
                <button aria-label="Remove image" onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                  className="absolute inset-0 flex items-center justify-center bg-background/70 opacity-0 transition-opacity group-hover:opacity-100">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button className="h-10 w-full" disabled={loading} onClick={() => run()}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {loading ? "Mixing colors…" : started ? "Regenerate" : "Generate"}
      </Button>
    </div>
  );

  if (!started) {
    return (
      <main className="relative flex min-h-screen items-center justify-center px-6 py-16">
        <div className="absolute right-4 top-4">{themeBtn}</div>
        <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-500">
          <h1 className="mb-2 text-center text-4xl md:text-5xl">Say what it should <em className="text-accent">feel</em> like.</h1>
          <p className="mb-8 text-center text-sm text-muted-foreground">Describe your intent, add references, get a palette.</p>
          <div className="rounded-xl border border-border bg-card p-5 shadow-xl shadow-foreground/5">{form}</div>
          {works.length > 0 && <div className="mt-6 rounded-xl border border-border bg-card p-4">{savedList}</div>}
        </div>
      </main>
    );
  }

  const sel = palette!.colors[selected] ?? palette!.colors[0]!;
  const byRole = (r: string) => palette!.colors.find((c) => c.role.toLowerCase().includes(r))?.hex;
  const bg = byRole("background") ?? palette!.colors.at(-1)!.hex;
  const text = byRole("text") ?? readableOn(bg);
  const primary = byRole("primary") ?? palette!.colors[0]!.hex;
  const surface = byRole("surface") ?? bg;
  const accent = byRole("accent") ?? primary;
  const [r, g, b] = hexToRgb(sel.hex);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-80 shrink-0 flex-col border-r border-border bg-card animate-in slide-in-from-left-8 fade-in duration-500">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h1 className="text-xl">Intent to Palette</h1>
          {themeBtn}
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          <div className="space-y-2 rounded-lg border border-border p-3">
            <p className="text-xs font-medium text-muted-foreground">Save work</p>
            <div className="flex gap-1.5">
              <input value={workName} onChange={(e) => setWorkName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveWork()}
                placeholder="Name this work"
                className="h-8 min-w-0 flex-1 rounded-md border border-input bg-muted/50 px-2 text-sm outline-none focus:border-ring" />
              <Button size="sm" className="h-8" onClick={saveWork}><Save className="h-3.5 w-3.5" />{workId ? "Update" : "Save"}</Button>
            </div>
            {workId && <button onClick={newWork} className="text-xs text-muted-foreground hover:text-foreground">+ Start new work</button>}
          </div>
          {form}
          {savedList}
        </div>
      </aside>

      {/* Main */}
      <div className="relative flex-1 overflow-hidden">
      <main className="h-full overflow-y-auto animate-in fade-in duration-700">
        <div className="mx-auto max-w-5xl space-y-8 px-8 py-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">v{current + 1} · {history[current]!.label}</p>
              <h2 className="mt-1 text-3xl">{palette!.name}</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{palette!.rationale}</p>
            </div>
            <Button size="sm" variant="secondary" disabled={loading} onClick={fixAccess}><ShieldCheck className="h-3.5 w-3.5" />Fix WCAG Accessibility</Button>
          </div>

          {/* Swatches */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {palette!.colors.map((c, i) => (
              <button
                key={c.hex + c.role + i}
                onClick={() => setSelected(i)}
                className={`group overflow-hidden rounded-lg border bg-card text-left transition-all hover:-translate-y-0.5 ${i === selected ? "border-ring ring-1 ring-ring" : "border-border hover:border-muted-foreground/40"}`}
              >
                <div className="relative h-28" style={{ background: c.hex, color: readableOn(c.hex) }}>
                  <span
                    onClick={(e) => { e.stopPropagation(); copy(c.hex); }}
                    className="absolute right-2 top-2 rounded bg-background/20 p-1 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
                  ><Copy className="h-3 w-3" /></span>
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <span className="font-mono text-[11px] text-muted-foreground">{c.hex}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] capitalize text-muted-foreground">{c.role}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Selected detail */}
          <div className="grid gap-6 rounded-lg border border-border bg-card p-5 md:grid-cols-[1fr_1.4fr]">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-md border border-border" style={{ background: sel.hex }} />
                <div>
                  <p className="font-medium">{sel.name}</p>
                  <p className="text-xs capitalize text-muted-foreground">{sel.role}</p>
                </div>
              </div>
              <div className="space-y-1 text-xs">
                {[["HEX", sel.hex], ["RGB", `rgb(${r}, ${g}, ${b})`], ["Var", `--color-${slug(sel.role)}`]].map(([k, v]) => (
                  <button key={k} onClick={() => copy(v!)} className="flex w-full items-center justify-between rounded px-2 py-1.5 hover:bg-secondary">
                    <span className="text-muted-foreground">{k}</span><span className="font-mono">{v}</span>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {sel.usage.map((u) => <span key={u} className="rounded border border-border bg-secondary px-1.5 py-0.5 text-[11px] text-secondary-foreground">{u}</span>)}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs text-muted-foreground">Tints & shades</p>
                <div className="flex h-10 overflow-hidden rounded-md">
                  {scale(sel.hex).map((h, i) => (
                    <button key={i} title={h} onClick={() => copy(h)} style={{ background: h }}
                      className={`flex-1 transition-[flex] hover:flex-[1.8] ${i === 4 ? "ring-2 ring-inset ring-foreground/60" : ""}`} />
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs text-muted-foreground">Contrast against palette</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {palette!.colors.filter((c) => c.hex !== sel.hex).slice(0, 8).map((c, i) => {
                    const ratio = contrast(sel.hex, c.hex);
                    return (
                      <div key={i} className="rounded px-2 py-1.5 text-[11px]" style={{ background: c.hex, color: sel.hex }}>
                        <span className="font-semibold">Aa</span> <span>{ratio.toFixed(1)}{ratio >= 4.5 ? " ✓" : ""}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Preview + checks */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg p-6" style={{ background: bg, color: text }}>
              <p className="text-[11px] uppercase tracking-widest opacity-60">Preview</p>
              <h3 className="mt-2 font-sans text-xl tracking-normal">Welcome aboard</h3>
              <div className="mt-4 rounded-md p-4" style={{ background: surface }}>
                <p className="text-sm opacity-80">Your first goal is ready. Let's set it up together.</p>
                <div className="mt-4 flex gap-2">
                  <span className="rounded-md px-3 py-1.5 text-sm font-medium" style={{ background: primary, color: readableOn(primary) }}>Get started</span>
                  <span className="rounded-md px-3 py-1.5 text-sm font-medium" style={{ color: accent }}>Learn more</span>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4 text-sm">
              <p className="mb-2 text-xs text-muted-foreground">WCAG AA (≥ 4.5)</p>
              {([
                ["Text on background", text, bg],
                ["Text on surface", text, surface],
                ["Label on primary", readableOn(primary), primary],
                ["Accent on background", accent, bg],
              ] as [string, string, string][]).map(([l, a, b2]) => {
                const ratio = contrast(a, b2);
                return (
                  <div key={l} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                    <span>{l}</span>
                    <span className={`font-mono text-xs ${ratio >= 4.5 ? "text-muted-foreground" : "text-destructive"}`}>{ratio.toFixed(2)} · {ratio >= 4.5 ? "Pass" : "Fail"}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </main>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm shadow-lg">
            <Loader2 className="h-4 w-4 animate-spin text-primary" /> Mixing colors…
          </div>
        </div>
      )}
      </div>

      {/* Right tray */}
      <aside className={`flex shrink-0 flex-col border-l border-border bg-card transition-[width] duration-300 ${versionsOpen ? "w-64" : "w-12"}`}>
        <div className="flex items-center justify-between border-b border-border px-3 py-4">
          {versionsOpen && <span className="text-sm font-medium">Controls</span>}
          <button aria-label="Toggle panel" onClick={() => setVersionsOpen((o) => !o)} className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
            {versionsOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
        {versionsOpen && (
          <div className="space-y-4 border-b border-border p-3">
            <div>
              <p className="mb-2 text-xs text-muted-foreground">Refine</p>
              <div className="flex flex-wrap gap-1.5">
                {REFINES.map((x) => <Button key={x} variant="outline" size="sm" className="h-7 px-2 text-xs" disabled={loading} onClick={() => run(x)}>{x}</Button>)}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs text-muted-foreground">Export</p>
              <div className="grid grid-cols-3 gap-1.5">
                <Button variant="secondary" size="sm" className="h-7 text-xs" onClick={() => copy(`:root {\n${palette!.colors.map((c) => `  --color-${slug(c.role)}: ${c.hex};`).join("\n")}\n}`, "CSS variables")}>CSS</Button>
                <Button variant="secondary" size="sm" className="h-7 text-xs" onClick={() => copy(`colors: {\n${palette!.colors.map((c) => `  "${slug(c.role)}": "${c.hex}",`).join("\n")}\n}`, "Tailwind colors")}>Tailwind</Button>
                <Button variant="secondary" size="sm" className="h-7 text-xs" onClick={() => copy(JSON.stringify(palette, null, 2), "JSON")}>JSON</Button>
              </div>
            </div>
          </div>
        )}
        {versionsOpen && <p className="flex items-center gap-2 px-3 pt-3 text-xs text-muted-foreground"><History className="h-3.5 w-3.5" />Versions · {history.length}</p>}
        <div className="flex-1 space-y-1.5 overflow-y-auto p-2">
          {history.map((h, i) => i).reverse().map((i) => {
            const h = history[i]!;
            return (
              <div key={i} role="button" tabIndex={0} onClick={() => { if (!loading) { setCurrent(i); setSelected(0); } }} title={`v${i + 1} · ${h.label}`}
                className={`group/v w-full cursor-pointer rounded-md border text-left transition-colors ${versionsOpen ? "p-2" : "p-1"} ${i === current ? "border-ring bg-secondary" : "border-transparent hover:bg-secondary/60"}`}>
                <div className={`flex overflow-hidden rounded ${versionsOpen ? "h-5" : "h-6 flex-col"}`}>
                  {h.palette.colors.map((c, j) => <div key={j} className="flex-1" style={{ background: c.hex }} />)}
                </div>
                {versionsOpen && (
                  <div className="mt-1.5 flex items-center justify-between">
                    <p className="truncate text-xs">v{i + 1} <span className="text-muted-foreground">· {h.label}</span></p>
                    <button aria-label="Delete version" disabled={loading} onClick={(e) => { e.stopPropagation(); deleteVersion(i); }}
                      className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover/v:opacity-100">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
