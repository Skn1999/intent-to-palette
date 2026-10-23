# Intent to Palette — AI color palette generator

## What you get
A single-page tool where you describe the feeling or goal of a design ("calm fintech onboarding, trustworthy but warm"), optionally drop in reference images, and get a ready-to-use color palette.

## Flow
1. **Describe intent** — a text box for mood, brand, audience, use case (product UI or visual/brand work).
2. **Add images** — drag and drop or pick up to 6 reference images (moodboards, screenshots, photos). Thumbnails with remove buttons.
3. **Generate** — AI reads the text and the images together and returns:
   - Palette name and a short rationale tied to your intent and images
   - 5–8 colors, each with name, hex, role (primary, secondary, accent, background, surface, text, success/warning/error for product mode) and why it was chosen
   - Contrast check (WCAG AA pass/fail) for text-on-background pairs
4. **Use it** — click to copy any hex; export as CSS variables, Tailwind tokens, or JSON; a live preview card (button, card, headline) shows the palette applied.
5. **Refine** — quick buttons: "warmer", "more muted", "higher contrast", "regenerate", keeping your images and text.

## Look
Clean editorial studio feel: off-white canvas, near-black type, a distinctive display serif paired with a crisp sans, generous whitespace so generated colors are the hero.

## Scope for v1
- No accounts or saved history (can add later with Lovable Cloud).
- Images are sent only for the generation request, not stored.

## Technical details
- TanStack Start page at `/`; server function calls Lovable AI Gateway (`openai/gpt-6-astra`, Responses API, streamed) with text + image inputs as base64 data URLs and a strict JSON schema for the palette.
- Requires Lovable Cloud enabled to hold the AI key server-side.
- Client-side contrast calculation and export formatting; errors (rate limit, credits) shown as toasts.
