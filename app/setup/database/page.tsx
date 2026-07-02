import Link from "next/link";
import { redirect } from "next/navigation";
import { Globe, Database, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthUser } from "@/lib/actions/auth";
import { checkDatabaseReady } from "@/lib/supabase/schema";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function DatabaseSetupPage() {
  if (!isSupabaseConfigured()) {
    redirect("/setup");
  }

  const authUser = await getAuthUser();
  if (!authUser) {
    redirect("/login");
  }

  if (await checkDatabaseReady()) {
    redirect("/clients");
  }

  return (
    <div className="dark min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-700">
            <Globe className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">One more step</h1>
            <p className="text-sm text-muted-foreground">
              Your Supabase project needs the database tables
            </p>
          </div>
        </div>

        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-6 text-sm">
            You&apos;re logged in, but Meridian can&apos;t find the{" "}
            <code className="rounded bg-muted px-1">clients</code> table. Run the
            migration SQL once in your Supabase dashboard.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4" />
              Run the migration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <ol className="list-decimal space-y-3 pl-5 text-muted-foreground">
              <li>
                Open your Supabase project →{" "}
                <strong className="text-foreground">SQL Editor</strong>
              </li>
              <li>
                Click <strong className="text-foreground">New query</strong>
              </li>
              <li>
                Copy the entire file{" "}
                <code className="rounded bg-muted px-1">
                  supabase/migrations/001_initial_schema.sql
                </code>{" "}
                from this repo and paste it
              </li>
              <li>
                Click <strong className="text-foreground">Run</strong> (should
                say Success)
              </li>
              <li>
                Back in terminal: <code className="rounded bg-muted px-1">pnpm seed</code>{" "}
                to import your 12 clients
              </li>
              <li>Refresh this page or go to /clients</li>
            </ol>

            <a
              href="https://supabase.com/dashboard/project/_/sql/new"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-emerald-400 hover:underline"
            >
              Open Supabase SQL Editor <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link
            href="/setup/database"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Refresh after running migration →
          </Link>
        </div>
      </div>
    </div>
  );
}
