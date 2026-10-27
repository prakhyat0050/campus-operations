# Campus Operations

A campus operations workspace for reporting and tracking maintenance, security, and sustainability activity.

Built with TanStack Start, React, TypeScript, Tailwind CSS, Supabase, and Vercel-compatible server rendering.

This project is released under the [MIT License](./LICENSE).

## Local development

```sh
bun install
bun run dev
bun run test
```

Copy `.env.example` to `.env` and set the Supabase project URL and publishable key. Never commit `.env` files or service-role keys.

```sh
cp .env.example .env
```

Required environment variables:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Use the same project URL and publishable key for the server and browser variables. The `VITE_` values are exposed to the browser and must only contain public client configuration. Do not use a Supabase service-role key in a `VITE_` variable.

Optional Gemma 4 features use the Gemini API from the server. Set `GEMINI_API_KEY` and `GEMMA_MODEL` in the server environment to enable them; never prefix the API key with `VITE_`. Features include:

- **Multimodal maintenance reporting:** on request, analyze a report description and attached photo to suggest a title, category, priority, and factual summary.
- **Grounded campus assistant:** ask questions about available maintenance/community records and simulated campus readings; security records are included only for roles allowed to view them.
- **Sustainability action planner:** on request, generate evidence-linked actions from the selected building's simulated consumption readings and related maintenance reports. It avoids claiming unverified savings.

Each feature discloses what data is sent before use. Model output is advisory and may be inaccurate; verify recommendations before acting.

Database migrations are in `drizzle/migrations`. Apply the required migrations to the Supabase project before using authenticated data features.

## Demo workspace access

The sign-in screen offers only **Continue to demo workspace**. It does not require an email, phone number, or OTP. Demo records and profile changes are stored in this browser only, persist between demo sessions, and are not sent to Supabase. Selectable roles and their permissions simulate workflows; they are not authenticated authorization. Clear this site's browser storage to remove saved demo data.

Email and SMS authentication are currently unavailable in the app. Re-enable a real sign-in flow only after the project owner configures and can maintain the Supabase authentication providers and credentials.

## Deploy to Render

This repository includes a Render Blueprint in `render.yaml` and builds TanStack Start for Render's Node.js runtime.

1. Push the repository to GitHub and create a new Blueprint in the [Render Dashboard](https://dashboard.render.com/blueprints), selecting the repository.
2. Add the four Supabase environment values from `.env.example` when Render prompts for them. Use only the publishable key; never add a Supabase service-role key.
3. Deploy the Blueprint. Render installs dependencies with `npm ci`, builds the app, and starts the Node server.
4. Add the deployed `onrender.com` URL to the Supabase project's allowed authentication redirect URLs.

The free web-service plan can spin down when idle, so its first request after inactivity may take longer.

## Deploy to Vercel

1. Import this GitHub repository into Vercel.
2. Set the four environment variables above for the Production, Preview, and Development environments as needed.
3. Deploy using the default Vite/TanStack Start build configuration.
4. Add the deployed site URL to the Supabase project's allowed authentication redirect URLs.

Build and test locally:

```sh
bun run test
bun run build
```
