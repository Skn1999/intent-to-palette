# Figma and FigJam export

Figma doesn't let other websites write into your files directly. These options make getting colors in a single paste or drag. All of them go in the Export section of the right panel.

## 1. "Copy for Figma / FigJam" (one click, paste)
- Copies a swatch sheet to the clipboard as an SVG: a rounded tile for each color with its name, hex and role underneath, plus any gradient tiles.
- In Figma or FigJam, press Cmd/Ctrl+V. It pastes as editable shapes and text. Each tile is named after its color, so you can pick colors with the eyedropper or turn them into styles.

## 2. "Download swatch sheet (.svg / .png)"
- The same sheet as a file. Drag it onto a Figma or FigJam canvas. The PNG suits FigJam boards and moodboards.

## Technical details
- New `src/lib/figma.ts` with `paletteToSvg(palette)`, a pure function covered by tests (valid hexes, one tile per color, gradients included).
- Clipboard: `navigator.clipboard.write` with `text/plain` SVG markup, which Figma turns into vectors on paste. PNG is rendered by drawing the SVG to a canvas.
- No backend changes.
