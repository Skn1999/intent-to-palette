<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- AI palette generation runs in a server function (src/lib/palette.functions.ts) via Lovable AI Gateway with a Zod output schema; keeps the API key server-side.
- WCAG fixing is deterministic client-side code in src/lib/color.ts (no AI call), so results are predictable and covered by tests.
