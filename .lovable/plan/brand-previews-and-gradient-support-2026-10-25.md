# Brand previews and gradient support

## 1. Brand preview modes (Visual / Brand only)
Product UI mode keeps today's UI mock. In Visual / Brand mode the preview area gets a small tab switcher with brand-relevant mockups, all painted with the current palette:
- **Poster** — bold editorial poster: big serif headline, colored blocks, small caption.
- **Business card** — front and back cards side by side.
- **Social post** — square Instagram-style post with quote text and logo mark.
- **Packaging** — simple box/label shape with brand name and pattern stripes.
- **Pattern** — repeating geometric tile using all palette colors.

Colors are assigned by role (dominant, secondary, accent, highlight, neutral light/dark), with readable text picked automatically.

## 2. Gradients when the intent asks for them
- When the intent mentions gradients (e.g. "with gradients", "gradient backgrounds"), the AI also returns 2–4 gradients built from palette colors: name, type (linear/radial), angle, color stops, and usage tags.
- New "Gradients" section under the swatches: large gradient tiles, click to copy CSS.
- Gradients are used in previews (hero/poster background) when present.
- Exports (CSS, Tailwind, JSON) include gradients.
- Fix WCAG keeps gradient stops in sync with any adjusted colors; versions and saved work keep gradients.

## Technical details
- `PaletteSchema` gets optional `gradients: [{ name, type, angle, stops: [{hex, position}], usage }]`; prompt instructs the model to include them only when the intent requests gradients.
- New `src/components/BrandPreviews.tsx` for the brand mockups; gradient CSS helper + test in `src/lib/color.ts`.
- Old saved works without gradients load fine (field optional).
