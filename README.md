# Campus Operations

A campus operations workspace for reporting and tracking maintenance, security, and sustainability activity.

Built with TanStack Start, React, TypeScript, Tailwind CSS, Supabase, and Vercel-compatible server rendering.

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

Database migrations are in `drizzle/migrations`. Apply the required migrations to the Supabase project before using authenticated data features.

## Authentication provider setup

- To send an email code instead of a magic link, open Supabase **Authentication → Email Templates → Magic Link or OTP** and make the message include `{{ .Token }}`. Supabase's default magic-link template sends a link.
- For phone OTP, enable **Phone** in **Authentication → Sign In / Providers → Auth Providers**, then configure an SMS provider (such as Twilio) and its credentials. The app cannot send SMS until a provider is configured.
- Add the production Vercel URL (for example, `https://campus-operations.vercel.app`) to **Authentication → URL Configuration → Redirect URLs** so email links return to the deployed app.

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
