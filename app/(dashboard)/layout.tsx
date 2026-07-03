import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CommandPaletteProvider } from "@/components/command-palette/command-palette-provider";
import { getAuthUser, getCurrentUser } from "@/lib/actions/auth";
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
    redirect("/login?error=invite_only");
  }

  if (user.is_active === false) {
    redirect("/login?error=deactivated");
  }

  return (
    <CommandPaletteProvider>
      <DashboardShell user={user}>{children}</DashboardShell>
      <Toaster />
    </CommandPaletteProvider>
  );
}
