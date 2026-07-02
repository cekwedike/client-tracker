import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/config";

export function createAdminClient() {
  const env = getSupabaseEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!env || !serviceKey || serviceKey === "your-service-role-key") {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Run pnpm db:setup after pnpm db:start, or add it to .env.local.",
    );
  }

  return createClient(env.url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
