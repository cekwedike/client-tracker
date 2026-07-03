import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/config";

export const ADMIN_CLIENT_UNAVAILABLE_MESSAGE =
  "Invites are unavailable on the server. Ensure SUPABASE_SERVICE_ROLE_KEY is set in your deployment environment.";

export function createAdminClient() {
  const env = getSupabaseEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!env || !serviceKey || serviceKey === "your-service-role-key") {
    throw new Error(ADMIN_CLIENT_UNAVAILABLE_MESSAGE);
  }

  return createClient(env.url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
