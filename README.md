# Karrot Content Studio

Private content-marketing CMS for [Karrot Digital](https://karrotdigital.com). Paste source links (X, Threads, web), get bilingual summaries, draft blog posts, publish to Kit, and preview on `/posts`.

## Stack

- **Next.js** (App Router, TypeScript) on Vercel
- **Supabase** (existing project `gmfzwuunaqzutbhudsxn`) — tables in `public` with `studio_` prefix
- **OpenRouter** for AI (server-side only)
- **Kit v4** for web/email publish

## Setup

### 1. Clone and install

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in values:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Not used in v1 app paths (RLS + user session) |
| `ADMIN_EMAIL` | Yes | Only this email can use `/studio` (default `darwin.chankawing@gmail.com`) |
| `OPENROUTER_API_KEY` | For AI | Summaries, draft, enrich |
| `OPENROUTER_MODEL` | No | Default `qwen/qwen3-vl-32b-instruct` |
| `KIT_API_KEY` | For publish | Kit v4 API key |
| `BOOKING_URL` | No | CTA button URL (default contact page) |
| `NEXT_PUBLIC_SITE_URL` | Yes | e.g. `https://your-app.vercel.app` for auth redirects |

### 3. Supabase database

Apply migrations in order:

```bash
# Example with Supabase CLI linked to your project
supabase db push
# Or run SQL manually in the SQL editor:
# supabase/migrations/20261005080000_studio_tables.sql
# supabase/migrations/20261005090000_studio_comments.sql
```

**Important**

- If `ADMIN_EMAIL` is not `darwin.chankawing@gmail.com`, edit `public.studio_admin_email()` in the first migration before applying.
- Apply migrations in timestamp order (`20261005080000` then `20261005090000`).

### 4. Supabase Auth

In **Authentication → URL configuration**, add:

- **Site URL:** your production URL (or `http://localhost:3000` for local)
- **Redirect URLs:** `http://localhost:3000/auth/callback`, `https://<your-vercel-domain>/auth/callback`

Enable **Email** provider (magic link).

### 5. Vercel

Create a project from this repo and set the same env vars. Deploy.

### 6. Local dev

```bash
npm run dev
```

Open `/login`, sign in with `ADMIN_EMAIL`, then `/studio`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build (does not call Kit) |
| `npm test` | Vitest (includes live fxtwitter check for X reader) |

## Features (v1)

- Magic-link auth; `/studio` restricted to admin email
- Source readers: X (fxtwitter), Threads (og tags), web (Readability)
- Bilingual summaries (fixtures for three test URLs when OpenRouter is unset during summarize — production should set the key)
- Posts with My take, AI draft, version history, enrichment suggestions
- Social captions + OG image (`/api/og/social`)
- Kit publish (web only or web + email with confirmation)
- Public `/posts` listing and post preview pages

## Test fixtures

`src/lib/fixtures/summaries.json` mirrors `out.json` for:

- `https://x.com/MagicPower21M/status/2106653640588927234`
- `https://x.com/AYi_AInotes/status/2106639522586829094`
- `https://www.threads.com/share/EtCKem4fj/`

## License

Private — Karrot Digital.
