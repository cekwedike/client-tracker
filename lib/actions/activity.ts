"use server";

import { createClient } from "@/lib/supabase/server";
import { isMissingSchemaError } from "@/lib/supabase/schema";
import type { ActivityAction, ActivityLogEntry } from "@/lib/types";

export async function logActivity(
  action: ActivityAction,
  details: Record<string, unknown> = {},
  clientId?: string | null,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("activity_log").insert({
    user_id: user.id,
    client_id: clientId ?? null,
    action,
    details,
  });
}

export async function getRecentActivity(limit = 20): Promise<ActivityLogEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_log")
    .select(
      `
      *,
      user:profiles!activity_log_user_id_fkey(id, full_name, email),
      client:clients(id, company_name)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingSchemaError(error, "activity_log")) return [];
    throw new Error(error.message);
  }
  return (data ?? []) as ActivityLogEntry[];
}

export async function getClientActivity(
  clientId: string,
  limit = 30,
): Promise<ActivityLogEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_log")
    .select(
      `
      *,
      user:profiles!activity_log_user_id_fkey(id, full_name, email)
    `,
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingSchemaError(error, "activity_log")) return [];
    throw new Error(error.message);
  }
  return (data ?? []) as ActivityLogEntry[];
}
