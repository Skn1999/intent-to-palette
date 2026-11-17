# New link preview image for the homepage

When someone shares the app's link, they'll see a custom still image instead of the automatic screenshot.

## The image
- 1200x630, matching the app's look (light background, Fraunces heading style).
- Concept "text morphing into colors": the word **intent** on the left, letters gradually dissolving into a row of rounded color swatches on the right, with a small "Intent to Palette" label.
- I'll generate it, show it to you, and adjust if you want changes before it goes live.

## What changes
- Only the homepage's share image tags (og:image and twitter:image, plus large-image card). Title, description and page content stay as they are.
- The browser tab icon stays unchanged.

## After building
- The new preview appears on the live link after you publish. Apps that already cached the old preview may take time to refresh.

## Technical details
- Generate with imagegen (premium, for legible text), upload as a project asset so it has an absolute https URL, reference it in `src/routes/index.tsx` head() only, add `twitter:card: summary_large_image`.
