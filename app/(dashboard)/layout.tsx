import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
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
    redirect("/login");
  }

  return (
    <div className="dark flex h-screen bg-background">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl p-6">{children}</div>
      </main>
      <Toaster />
    </div>
  );
}
