import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase/config";

export function createClient() {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  return createBrowserClient(env.url, env.anonKey);
}

export { isSupabaseConfigured } from "@/lib/supabase/config";
