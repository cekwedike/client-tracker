import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/config";

export const ADMIN_CLIENT_UNAVAILABLE_MESSAGE =
  "This action is temporarily unavailable. Please contact your administrator.";

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
