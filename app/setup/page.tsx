import Link from "next/link";
import { Globe, Database, Terminal, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { redirect } from "next/navigation";

export default function SetupPage() {
  if (isSupabaseConfigured()) {
    redirect("/login");
  }

  return (
    <div className="dark min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-700">
            <Globe className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Meridian Setup</h1>
            <p className="text-sm text-muted-foreground">
              Connect a database to get started
            </p>
          </div>
        </div>

        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-6">
            <p className="text-sm">
              Meridian needs a Supabase project for auth, client data, tasks, and
              chat. Pick one option below — local is fastest if you have Docker.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Terminal className="h-4 w-4" />
              Option A — Local (recommended for dev)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Requires{" "}
              <a
                href="https://docs.docker.com/get-docker/"
                className="text-emerald-400 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Docker Desktop
              </a>
              . Runs Postgres + Auth on your machine.
            </p>
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs leading-relaxed">
{`pnpm db:start    # start local Supabase
pnpm db:setup    # write .env.local + run migrations
pnpm seed        # import spreadsheet clients
pnpm dev`}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4" />
              Option B — Supabase Cloud (free tier)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                Create a project at{" "}
                <a
                  href="https://supabase.com/dashboard"
                  className="inline-flex items-center gap-1 text-emerald-400 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  supabase.com <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                SQL Editor → run{" "}
                <code className="rounded bg-muted px-1">
                  supabase/migrations/001_initial_schema.sql
                </code>
              </li>
              <li>
                Project Settings → API → copy URL + anon key + service role key
              </li>
              <li>
                Create <code className="rounded bg-muted px-1">.env.local</code>{" "}
                from <code className="rounded bg-muted px-1">.env.example</code>
              </li>
              <li>
                Run <code className="rounded bg-muted px-1">pnpm seed</code> then{" "}
                <code className="rounded bg-muted px-1">pnpm dev</code>
              </li>
            </ol>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Link
            href="/setup"
            className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
          >
            Refresh after configuring
          </Link>
        </div>
      </div>
    </div>
  );
}
