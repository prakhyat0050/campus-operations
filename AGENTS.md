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

- Use TanStack file routes for campus modules and keep shared UI under `src/components/campus`; this preserves native navigation and per-page metadata.
- Keep fictional seed data and deterministic analysis in `src/lib/campus/data.ts`, and shared demo mutations in the campus provider; all screens must reflect the same records.
- Campus records persist in the Lovable Cloud database as one shared demo table; keep every screen reading the same shared records and label the data as simulated demo content. Real authentication and owner-scoped access are a separate, deliberate step.
- Use the semantic CSS design system for surfaces, statuses, charts, map controls and typography; visual values must remain centralized.
