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

## Local demo workspace

The sign-in screen includes **Continue to demo workspace** for presentations and hackathon walkthroughs when OTP delivery is unavailable. It does not require an email or phone number. Demo records and profile changes are stored in this browser only, persist between demo sessions, and are not sent to Supabase. The selectable roles and their permissions are a local workflow simulation, not authenticated authorization. Clear this site's browser storage to remove saved demo data.

## Authentication provider setup

- To send an email code instead of a magic link, open Supabase **Authentication → Email Templates → Magic Link or OTP** and make the message include `{{ .Token }}`. Supabase's default magic-link template sends a link.
- For phone OTP, enable **Phone** in **Authentication → Sign In / Providers → Auth Providers**, then select and configure an SMS provider (such as Twilio) with its credentials in Supabase. Also check the provider's sender number and SMS template, and ensure the destination country is enabled with the provider. The app cannot send SMS until the provider is configured; provider credentials must never be added to this app or its `.env` file.
- The sign-in screen accepts Indian 10-digit mobile numbers (normalized to `+91`) or international numbers in E.164 format. After requesting a code, enter all 6 digits or choose **Resend OTP**. If sending fails with an unsupported phone provider error, phone sign-in or the SMS provider is not enabled/configured in Supabase.
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
