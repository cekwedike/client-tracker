import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function checkDatabaseReady(
  supabase?: SupabaseClient,
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const client = supabase ?? (await createClient());
  const { error } = await client.from("clients").select("id").limit(1);

  if (!error) return true;

  const msg = error.message.toLowerCase();
  return !(
    msg.includes("schema cache") ||
    msg.includes("does not exist") ||
    error.code === "PGRST205" ||
    error.code === "42P01"
  );
}

/** @deprecated Use checkDatabaseReady */
export async function isDatabaseReady(): Promise<boolean> {
  return checkDatabaseReady();
}

export async function checkDatabaseReadyInMiddleware(
  url: string,
  key: string,
  getCookies: () => { name: string; value: string }[],
  setCookie: (name: string, value: string, options?: object) => void,
): Promise<boolean> {
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: getCookies,
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          setCookie(name, value, options),
        );
      },
    },
  });
  return checkDatabaseReady(supabase);
}
