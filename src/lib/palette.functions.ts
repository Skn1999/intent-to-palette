import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  intent: z.string().max(4000),
  mode: z.enum(["product", "visual"]),
  images: z.array(z.string().startsWith("data:image/")).max(6),
  imageColors: z.array(z.object({ hex: z.string().regex(/^#[0-9A-F]{6}$/i), share: z.number() })).max(12).optional(),
  refine: z.string().max(200).optional(),
  previous: z.string().max(4000).optional(),
});

export const PaletteSchema = z.object({
  name: z.string(),
  rationale: z.string(),
  colors: z.array(
    z.object({
      name: z.string(),
      hex: z.string(),
      role: z.string(),
      usage: z.array(z.string()),
    }),
  ),
  gradients: z
    .array(
      z.object({
        name: z.string(),
        type: z.enum(["linear", "radial"]),
        angle: z.number(),
        stops: z.array(z.object({ hex: z.string(), position: z.number() })),
        usage: z.array(z.string()),
      }),
    ),
});
// Older saved palettes may omit gradients; new AI responses always include an array.
export type Palette = Omit<z.infer<typeof PaletteSchema>, "gradients"> & {
  gradients?: z.infer<typeof PaletteSchema>["gradients"] | undefined;
};

export const generatePalette = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env['LOVABLE_API_KEY'];
    if (!apiKey) throw new Error("AI is not configured.");
    if (!data.intent.trim() && data.images.length === 0)
      throw new Error("Describe your intent or add an image.");

    const { createOpenAI } = await import("@ai-sdk/openai");
    const { streamText, Output } = await import("ai");
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });

    const roles =
      data.mode === "product"
        ? "Return 8 colors with roles exactly: primary, secondary, accent, background, surface, text, success, error. Ensure text on background and white/text on primary meet WCAG AA."
        : "Return 6 colors for brand/visual work with roles like dominant, secondary, accent, highlight, neutral light, neutral dark.";

    let prompt = `Design intent: ${data.intent || "(none, infer from images)"}\n`;
    if (data.imageColors?.length)
      prompt += `\nColors measured from the user's reference images (hex, % of pixels): ${data.imageColors.map((c) => `${c.hex} ${c.share}%`).join(", ")}.\nBuild the palette from these measured tones: reuse or closely adjust them for the roles (staying within the same hue family), only shifting lightness/saturation as needed for contrast. Let the intent decide which tones lead. Do not invent hues absent from the images unless a role (e.g. error) requires it.\n`;
    if (data.previous) prompt += `\nPrevious palette (JSON): ${data.previous}\nRefinement request: ${data.refine}. Keep the spirit but apply the change.\n`;

    const content: Array<{ type: "text"; text: string } | { type: "image"; image: string }> = [
      { type: "text", text: prompt },
      ...data.images.map((image) => ({ type: "image" as const, image })),
    ];

    const result = streamText({
      model: provider.responses("openai/gpt-6-astra"),
      system: `You are a senior color designer. Translate the user's intent and reference images into a cohesive, usable palette. Draw real cues from the images (dominant hues, mood, lighting). ${roles} Hex values must be 6-digit uppercase like #1A2B3C. Rationale: 2-3 sentences tying choices to intent and images. For each color, usage: 2-4 very short usage tags (2-4 words each) saying where it fits, e.g. "Page background", "Primary buttons", "Accent highlights", "Body text", "Error states". Gradients: ALWAYS include the gradients array. ONLY if the intent (or refinement) explicitly asks for gradients, return 2-4 gradients built mainly from palette hexes (2-4 stops, positions 0-100, angle in degrees, type linear or radial) with 2-3 usage tags; otherwise return an empty gradients array [].`,
      messages: [{ role: "user", content }],
      output: Output.object({ schema: PaletteSchema }),
      providerOptions: {
        openai: {
          store: false,
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          include: ["reasoning.encrypted_content"],
        },
      },
    });
    try {
      return (await result.output) as Palette;
    } catch (e) {
      console.error("[generatePalette]", e);
      const msg = e instanceof Error ? e.message : String(e);
      if (/429/.test(msg)) throw new Error("Too many requests — wait a moment and try again.");
      if (/402/.test(msg)) throw new Error("AI credits ran out. Add credits in Settings → Plans & credits.");
      throw new Error("Couldn't generate a palette. Please try again.");
    }
  });
