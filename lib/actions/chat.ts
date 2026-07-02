"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  dailyHandoffSchema,
  weeklyReportSchema,
  type DailyHandoffValues,
  type WeeklyReportValues,
} from "@/lib/validations/task";
import type { Channel, Message, Report } from "@/lib/types";

export async function getChannels() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("channels")
    .select("*, client:clients(id, company_name)")
    .order("name");

  if (error) throw new Error(error.message);
  return data as Channel[];
}

export async function getChannel(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("channels")
    .select("*, client:clients(id, company_name)")
    .eq("slug", slug)
    .single();

  if (error) throw new Error(error.message);
  return data as Channel;
}

export async function getMessages(channelId: string, limit = 100) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*, author:profiles(id, full_name, email, avatar_url)")
    .eq("channel_id", channelId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data as Message[];
}

export async function sendMessage(channelId: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("messages")
    .insert({ channel_id: channelId, author_id: user?.id, content })
    .select("*, author:profiles(id, full_name, email)")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/chat");
  return data as Message;
}

export async function createDailyHandoff(values: DailyHandoffValues) {
  const parsed = dailyHandoffSchema.parse(values);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const title = `Daily Handoff — ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}`;

  const { data, error } = await supabase
    .from("reports")
    .insert({
      type: "daily_handoff",
      author_id: user?.id,
      title,
      content: parsed,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Also post to handoff channel
  const { data: handoffChannel } = await supabase
    .from("channels")
    .select("id")
    .eq("slug", "handoff")
    .single();

  if (handoffChannel) {
    const summary = [
      `📋 **${title}**`,
      `Clients touched: ${parsed.clients_touched}`,
      parsed.blockers ? `Blockers: ${parsed.blockers}` : null,
      `Leads: ${parsed.leads_logged} | Meetings: ${parsed.meetings_logged}`,
      parsed.notes ? `Notes: ${parsed.notes}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    await supabase.from("messages").insert({
      channel_id: handoffChannel.id,
      author_id: user?.id,
      content: summary,
    });
  }

  revalidatePath("/reports");
  revalidatePath("/chat");
  return data;
}

export async function createWeeklyReport(values: WeeklyReportValues) {
  const parsed = weeklyReportSchema.parse(values);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: client } = await supabase
    .from("clients")
    .select("company_name")
    .eq("id", parsed.client_id)
    .single();

  const title = `Weekly Report — ${client?.company_name ?? "Client"} — ${new Date().toLocaleDateString()}`;

  const { data, error } = await supabase
    .from("reports")
    .insert({
      type: "weekly_client",
      client_id: parsed.client_id,
      author_id: user?.id,
      title,
      content: parsed,
    })
    .select("*, client:clients(company_name), author:profiles(full_name)")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/reports");
  return data as Report;
}

export async function getReports(type?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("reports")
    .select("*, client:clients(company_name), author:profiles(full_name, email)")
    .order("created_at", { ascending: false });

  if (type) query = query.eq("type", type);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as Report[];
}

export async function getTeamMatrix() {
  const supabase = await createClient();
  const { data: profiles, error: pError } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, avatar_url, created_at, updated_at")
    .in("role", ["admin", "manager", "operator"])
    .order("full_name");

  if (pError) throw new Error(pError.message);

  const { data: clients, error: cError } = await supabase
    .from("clients")
    .select("id, company_name, status, billing_model, primary_owner_id")
    .order("company_name");

  if (cError) throw new Error(cError.message);

  return { profiles, clients };
}
