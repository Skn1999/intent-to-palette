# Figma and FigJam export

Figma doesn't let other websites write into your files directly. These options make getting colors in a single paste or drag. All of them go in the Export section of the right panel.

## 1. "Copy for Figma / FigJam" (one click, paste)
- Copies a swatch sheet to the clipboard as an SVG: a rounded tile for each color with its name, hex and role underneath, plus any gradient tiles.
- In Figma or FigJam, press Cmd/Ctrl+V. It pastes as editable shapes and text. Each tile is named after its color, so you can pick colors with the eyedropper or turn them into styles.

## 2. "Download swatch sheet (.svg / .png)"
- The same sheet as a file. Drag it onto a Figma or FigJam canvas. The PNG suits FigJam boards and moodboards.

## 3. "Figma Variables (JSON)"
- Downloads a design tokens file in the standard format (W3C / Tokens Studio). A free plugin such as "Tokens Studio" or "Variables Import" turns it into a Figma color variable collection named after your palette, with one variable per role (primary, background, and so on). A short hint next to the button names the plugins.

## 4. Optional: product mode extras
- In Product UI mode, the sheet and tokens also include the lighter and darker steps that already appear under each swatch, so they arrive as a full scale (for example primary/100–900).

## Technical details
- New `src/lib/figma.ts` with `paletteToSvg(palette)` and `paletteToTokens(palette)`. Both are pure functions, covered by tests (valid hexes, one token per color, gradients included).
- Clipboard: `navigator.clipboard.write` with `text/plain` SVG markup, which Figma turns into vectors on paste. PNG is rendered by drawing the SVG to a canvas.
- No backend changes.
