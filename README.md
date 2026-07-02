# Meridian — PLNITUDE Client Ops Platform

**Meridian** is the internal operations platform for [PLNITUDE](https://plnitude.com/). It replaces the client tracking spreadsheet with a rich client hub, team task management, internal chat, and reporting.

## Quick start (local)

Requires [pnpm](https://pnpm.io/installation) and [Docker Desktop](https://docs.docker.com/get-docker/).

```bash
pnpm install
pnpm db:start      # start local Supabase (first run downloads images)
pnpm db:setup      # writes .env.local with local credentials
pnpm db:migrate    # apply database schema
pnpm seed          # import 12 spreadsheet clients
pnpm dev           # http://localhost:3000
```

Sign up at `/signup`, then promote yourself to admin in Supabase Studio (`http://127.0.0.1:54323`):

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

If Supabase isn't configured yet, `pnpm dev` sends you to `/setup` with instructions instead of crashing.

## Cloud Supabase (alternative)

1. Create a project at [supabase.com](https://supabase.com)
2. SQL Editor → run `supabase/migrations/001_initial_schema.sql`
3. Copy `.env.example` → `.env.local` and fill in API keys
4. `pnpm seed && pnpm dev`

## Features

- **Client hub** — PPL/PPM deal types, timezones, CC playbook, contacts, inbox bookmarks
- **Tasks** — Kanban board + My Work
- **Chat** — #general, #handoff, per-client channels (realtime)
- **Reports** — daily handoffs, weekly client Markdown export
- **Team** — responsibility matrix, role management

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Next.js dev server |
| `pnpm db:start` | Start local Supabase (Docker) |
| `pnpm db:stop` | Stop local Supabase |
| `pnpm db:setup` | Write `.env.local` from local Supabase |
| `pnpm db:migrate` | Reset DB and apply migrations |
| `pnpm seed` | Import spreadsheet clients |

## Tech stack

Next.js 16 · Supabase · shadcn/ui · Tailwind v4 · TypeScript
