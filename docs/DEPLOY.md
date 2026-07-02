# Deploying Meridian

## 1. Vercel (app hosting)

### Option A — Vercel Dashboard (recommended)

1. Push this repo to GitHub
2. [vercel.com/new](https://vercel.com/new) → Import `cekwedike/client-tracker`
3. Framework: **Next.js** (auto-detected)
4. Add **Environment Variables** (Production + Preview):

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | From Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase → Settings → API (server only) |
| `NEXT_PUBLIC_SITE_URL` | Your Vercel URL, e.g. `https://client-tracker.vercel.app` |

5. Deploy

### Option B — Vercel CLI

```bash
pnpm dlx vercel login
pnpm dlx vercel link
pnpm dlx vercel env add NEXT_PUBLIC_SUPABASE_URL
pnpm dlx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
pnpm dlx vercel env add SUPABASE_SERVICE_ROLE_KEY
pnpm dlx vercel env add NEXT_PUBLIC_SITE_URL
pnpm dlx vercel --prod
```

## 2. Supabase Auth redirects

In Supabase → **Authentication → URL Configuration**:

- **Site URL:** `https://your-app.vercel.app`
- **Redirect URLs:** add:
  - `https://your-app.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback` (local dev)

## 3. Auto database migrations (GitHub Actions)

When you push changes to `supabase/migrations/`, GitHub Actions runs `supabase db push` against your linked project.

### One-time setup — GitHub secrets

Repo → **Settings → Secrets and variables → Actions** → New repository secret:

| Secret | Where to get it |
|--------|-----------------|
| `SUPABASE_ACCESS_TOKEN` | [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens) |
| `SUPABASE_PROJECT_REF` | Project URL: `https://<THIS_PART>.supabase.co` |
| `SUPABASE_DB_PASSWORD` | Supabase → Project Settings → Database → Database password |

### How it works

- Workflow: [`.github/workflows/supabase-migrate.yml`](.github/workflows/supabase-migrate.yml)
- Triggers on push to `main` when migration files change
- You can also run manually: Actions → **Supabase Migrations** → Run workflow

### Manual migration (without CI)

```bash
pnpm exec supabase login
pnpm exec supabase link --project-ref YOUR_PROJECT_REF
pnpm exec supabase db push
```

## 4. Seed production data (once)

After first migration, run locally (uses service role from `.env.local`):

```bash
pnpm seed
```

Or run the SQL seed manually in Supabase SQL Editor.

## 5. Promote admin user

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```
