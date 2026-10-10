# Karrot Content Studio

Private content-marketing CMS for Karrot Digital. Attach source links (X, Threads, web), get bilingual summaries, draft per-channel variants, and **publish to this app’s public site** at `/p` and `/p/[slug]` (not Kit).

> **Branch note:** PR #1 (`cursor/karrot-content-studio-v1-c421`) ships the studio CMS and on-app publish. A separate blog redesign may land on PR #2; public URLs on this branch are still `/p`.

## Stack

- **Next.js** (App Router, TypeScript) on Vercel
- **Supabase** (project `gmfzwuunaqzutbhudsxn`) — `public.studio_*` tables only (does not modify news-feed / `ingest_*` tables)
- **OpenRouter** for AI (server-side only)
- **Kit v4** — optional legacy code paths only; **Publish** in the studio writes to the site (`/p`), not Kit

## Setup

### 1. Clone and install

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local`. Do not commit secrets.

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase publishable (anon) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Not used by normal app routes (session + RLS) |
| `ADMIN_EMAIL` | Yes | Only this email may use `/studio` (must match `studio_admin_email()` in DB) |
| `OPENROUTER_API_KEY` | For AI | Summaries, drafts, SEO fill, adjustments |
| `OPENROUTER_MODEL` | No | Default `qwen/qwen3-vl-235b-a22b-instruct` |
| `KIT_API_KEY` | No | Unused for publish; legacy Kit helpers only |
| `BOOKING_URL` | No | CTA on published posts (default `/p#book`) |
| `NEXT_PUBLIC_BOOKING_URL` | No | Client-visible booking CTA (default `/p#book`) |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical app URL for auth redirects (e.g. `https://your-app.vercel.app`) |

### 3. Supabase database

Apply all migrations under `supabase/migrations/` in timestamp order (studio tables only), e.g.:

```bash
supabase db push
```

If `ADMIN_EMAIL` is not `darwin.chankawing@gmail.com`, update `public.studio_admin_email()` in SQL to match before go-live.

**RLS:** All `studio_*` admin policies use `public.studio_is_admin()` only. `studio_is_admin()` is granted to `authenticated` (required for RLS) but not `anon`; `studio_admin_email()` is `service_role` only (see `20261010100000_studio_function_security.sql`).

### 4. Admin sign-in (Supabase Auth)

This branch uses **Google OAuth** on `/login` (enable Google in Supabase → Authentication → Providers).

You can additionally enable **Email** in Supabase Auth if you want password login; the app does not ship a separate signup flow—create the admin user in the Supabase dashboard. Use at least **8 characters** for passwords; enforce stricter rules in Auth settings if needed.

1. **Google (current UI):** Google Cloud OAuth client → redirect URI `https://<project-ref>.supabase.co/auth/v1/callback` → paste client ID/secret into Supabase Google provider.
2. **Authentication → URL configuration:** Site URL and redirect URLs must include `http://localhost:3000/auth/callback` and production `https://<host>/auth/callback` (plus preview URLs as needed).
3. Only `ADMIN_EMAIL` may use `/studio` (checked in `/auth/callback`, middleware, and `studio_is_admin()` RLS).

Preview deployments on `*.vercel.app` use `window.location.origin` for OAuth `redirectTo` when appropriate.

### 5. Vercel

Create a project from this repo and set the same env vars. Use **preview** deploys for PR #1; do not point production at this branch until you intentionally go live.

### 6. Local dev

```bash
npm run dev
```

Open `/login`, sign in with the `ADMIN_EMAIL` account, then `/studio`.

## Go-live checklist (Darwin)

- [ ] All `supabase/migrations/*.sql` applied to project `gmfzwuunaqzutbhudsxn` (studio migrations only).
- [ ] `ADMIN_EMAIL`, `studio_admin_email()`, and Supabase Auth user email aligned.
- [ ] `NEXT_PUBLIC_SITE_URL` and Auth redirect URLs match production host.
- [ ] `OPENROUTER_API_KEY` set for production AI.
- [ ] **Authentication → Password security → Enable leaked password protection (HaveIBeenPwned)** — currently **disabled** on this project (Supabase security advisor WARN). Must be toggled in the [Supabase dashboard](https://supabase.com/dashboard/project/gmfzwuunaqzutbhudsxn/auth/providers); not configurable via SQL migration.
- [ ] If using email/password: minimum length ≥ 8 in Auth settings; prefer leaked-password protection enabled.
- [ ] Smoke-test: `/login` → `/studio` → draft → **Publish** → public `/p` and `/p/[slug]`; Book CTA lands on `/p#book`.
- [ ] Do **not** merge PR #1 to `main` until you explicitly want this stack on production.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build (does not call Kit) |
| `npm test` | Vitest |

## Features (v1 on this branch)

- Google sign-in; `/studio` restricted to `ADMIN_EMAIL`
- Multi-channel editor (blog, X, Threads, Instagram variants)
- Source readers: X (fxtwitter), Threads (og tags), web (Readability)
- Bilingual summaries (fixtures when OpenRouter is unset in dev)
- **Publish to site** at `/p` (SEO title + meta required); legacy `/posts` redirect/list optional
- Book CTA via `BOOKING_URL` / `NEXT_PUBLIC_BOOKING_URL` (default on-site `/p#book`)

## Test fixtures

`src/lib/fixtures/summaries.json` mirrors sample URLs for offline summarize tests.

## License

Private — Karrot Digital.
