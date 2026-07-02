import { redirect } from "next/navigation";
import { LandingPage } from "@/components/marketing/landing-page";
import { getAuthUser } from "@/lib/actions/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { checkDatabaseReady } from "@/lib/supabase/schema";

export default async function HomePage() {
  if (isSupabaseConfigured()) {
    const user = await getAuthUser();
    if (user) {
      if (!(await checkDatabaseReady())) {
        redirect("/setup/database");
      }
      redirect("/dashboard");
    }
  }

  return <LandingPage />;
}
