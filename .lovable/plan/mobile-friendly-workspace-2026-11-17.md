# Mobile-friendly workspace

## The problem today
After generating, the screen has three columns side by side: the left panel (intent, save, projects, ~320px), the palette in the middle, and the right panel (refine, export, versions, ~256px). On a phone (~380px wide) the two panels alone are wider than the screen, so the palette gets squeezed to almost nothing.

## Recommended approach: slide-over drawers on mobile, not collapsible columns
Collapsing columns still takes width on a phone (even a thin strip). A better fit for small screens:

- **Phone (under ~768px)**
  - The palette takes the full screen.
  - A slim top bar shows "Intent to Palette", the theme toggle, and two buttons: **Intent** (left) and **Tools** (right).
  - Tapping **Intent** slides the left panel in from the left over the palette; tapping **Tools** slides the refine / export / versions panel in from the right. Tap outside or swipe to close.
  - A small floating **Regenerate** button stays reachable at the bottom.
  - Picking a version, refining, or generating closes the drawer automatically so you see the result.
  - Swatch grid drops to 2 columns; the swatch detail, live preview and brand previews stack in one column; the versions strip stays in the Tools drawer.
- **Tablet (~768-1280px)**
  - Left panel becomes collapsible (folds to a thin icon strip, like the versions panel already does); right panel stays collapsible as today.
- **Desktop**
  - Unchanged.
- **First screen**
  - Already mostly fine; tighten spacing, make the two mode checkboxes stack, and make Past projects a single column on phones.

The loading overlay continues to cover only the palette area.

## Alternative (if you prefer)
Bottom tab bar on phones (Palette / Intent / Tools / Versions) that switches full screens instead of drawers. Feels more app-like but hides the palette while you edit.

## Technical details
- Use the existing shadcn `Sheet` component for drawers (left/right), rendered only below the `md` breakpoint; extract the left and right panel contents into small components so they render in both the aside and the sheet.
- Asides get `hidden md:flex`; add a left-panel collapse state for `md`–`xl`.
- Responsive grid classes on swatches, detail and previews; check at 384px with Playwright.
