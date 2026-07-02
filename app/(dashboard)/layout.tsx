import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { CommandPaletteProvider } from "@/components/command-palette/command-palette-provider";
import { getAuthUser, getCurrentUser } from "@/lib/actions/auth";
import { getClientOptions } from "@/lib/actions/clients";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { checkDatabaseReady } from "@/lib/supabase/schema";
import { Toaster } from "@/components/ui/sonner";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) {
    redirect("/setup");
  }

  const authUser = await getAuthUser();
  if (!authUser) {
    redirect("/login");
  }

  if (!(await checkDatabaseReady())) {
    redirect("/setup/database");
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const clientOptions = await getClientOptions();

  return (
    <CommandPaletteProvider>
      <div className="flex h-screen bg-background">
        <Sidebar user={user} clientOptions={clientOptions} />
      <main className="relative flex-1 overflow-y-auto">
        <div
          className="pointer-events-none fixed inset-0 left-64 opacity-30"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -20%, oklch(0.55 0.12 85 / 20%), transparent)",
          }}
        />
        <div className="relative mx-auto max-w-7xl p-6 lg:p-8">{children}</div>
      </main>
      <Toaster />
    </div>
    </CommandPaletteProvider>
  );
}
