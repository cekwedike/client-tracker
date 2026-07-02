"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/actions/activity";
import { createClient } from "@/lib/supabase/server";
import { isMissingSchemaError } from "@/lib/supabase/schema";
import { getDefaultBusinessHours } from "@/lib/timezone";
import {
  clientSchema,
  quickAddClientSchema,
  type ClientFormValues,
  type QuickAddClientValues,
} from "@/lib/validations/client";
import { validateClientFormData } from "@/lib/validations/client-save";
import type { ClientDashboardSummary, ClientWithRelations, Profile } from "@/lib/types";

/** Lighter fetch for dashboard — omits heavy text fields */
export async function getClientsForDashboard() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select(
      `
      id,
      company_name,
      primary_contact_name,
      status,
      billing_model,
      city,
      state_region,
      timezone,
      do_not_contact_before,
      do_not_contact_after,
      smartlead_inbox_url,
      contacts(id, role, name, email, phone, cc_alias, is_default_cc),
      business_hours(id, client_id, day_of_week, start_time, end_time, is_closed),
      primary_owner:profiles!clients_primary_owner_id_fkey(id, full_name, email)
    `,
    )
    .order("company_name");

  if (error) throw new Error(error.message);
  return data as unknown as ClientDashboardSummary[];
}

export async function getClientOptions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, company_name")
    .order("company_name");

  if (error) throw new Error(error.message);
  return data as Pick<ClientWithRelations, "id" | "company_name">[];
}

const CLIENTS_WITH_RELATIONS_SELECT = `
  *,
  contacts(*),
  business_hours(*),
  primary_owner:profiles!clients_primary_owner_id_fkey(id, full_name, email)
`;

const CLIENTS_BASE_SELECT = `
  *,
  contacts(*),
  business_hours(*)
`;

async function buildClientsQuery(
  supabase: Awaited<ReturnType<typeof createClient>>,
  select: string,
  filters?: { search?: string; billing_model?: string; status?: string },
) {
  let query = supabase.from("clients").select(select).order("company_name");

  if (filters?.billing_model) {
    query = query.eq("billing_model", filters.billing_model);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.search?.trim()) {
    const term = filters.search.trim().replace(/[%_,]/g, "");
    const { data: contactMatches, error: contactError } = await supabase
      .from("contacts")
      .select("client_id")
      .or(
        `name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,cc_alias.ilike.%${term}%`,
      );

    const contactClientIds =
      contactError && isMissingSchemaError(contactError, "contacts")
        ? []
        : [...new Set(contactMatches?.map((c) => c.client_id) ?? [])];

    const clientFields = `company_name.ilike.%${term}%,primary_contact_name.ilike.%${term}%,city.ilike.%${term}%`;
    if (contactClientIds.length > 0) {
      query = query.or(`${clientFields},id.in.(${contactClientIds.join(",")})`);
    } else {
      query = query.or(clientFields);
    }
  }

  return query;
}

export async function getClients(filters?: {
  search?: string;
  billing_model?: string;
  status?: string;
}) {
  const supabase = await createClient();

  const { data, error } = await buildClientsQuery(
    supabase,
    CLIENTS_WITH_RELATIONS_SELECT,
    filters,
  );
  if (!error) return (data ?? []) as unknown as ClientWithRelations[];

  if (isMissingSchemaError(error, "clients", "contacts", "business_hours", "profiles")) {
    return [];
  }

  // Join hint or embed can fail when schema cache is stale — retry without owner embed.
  const { data: fallbackData, error: fallbackError } = await buildClientsQuery(
    supabase,
    CLIENTS_BASE_SELECT,
    filters,
  );

  if (!fallbackError) return (fallbackData ?? []) as unknown as ClientWithRelations[];

  if (isMissingSchemaError(fallbackError, "clients", "contacts", "business_hours")) {
    return [];
  }

  console.error("[getClients]", fallbackError.message);
  return [];
}

export async function getClient(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select(
      `
      *,
      contacts(*),
      business_hours(*),
      primary_owner:profiles!clients_primary_owner_id_fkey(id, full_name, email, avatar_url)
    `,
    )
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data as ClientWithRelations;
}

export async function getDuplicateCcEmailMap(excludeClientId?: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("email, client:clients(id, company_name)")
    .not("email", "is", null);

  if (error) throw new Error(error.message);

  const map = new Map<string, string>();
  for (const row of data ?? []) {
    const email = row.email?.trim().toLowerCase();
    const raw = row.client as unknown;
    const client = (Array.isArray(raw) ? raw[0] : raw) as
      | { id: string; company_name: string }
      | null
      | undefined;
    if (!email || !client) continue;
    if (excludeClientId && client.id === excludeClientId) continue;
    map.set(email, client.company_name);
  }
  return map;
}

async function assertClientSaveValid(
  values: ClientFormValues,
  excludeClientId?: string,
) {
  const duplicateCcEmails = await getDuplicateCcEmailMap(excludeClientId);
  const issues = validateClientFormData(values, { duplicateCcEmails, excludeClientId });
  const errors = issues.filter((i) => i.severity === "error");
  if (errors.length > 0) {
    throw new Error(errors.map((e) => e.message).join("; "));
  }
  return issues.filter((i) => i.severity === "warning");
}

export async function validateClientSave(
  values: ClientFormValues,
  excludeClientId?: string,
) {
  const duplicateCcEmails = await getDuplicateCcEmailMap(excludeClientId);
  return validateClientFormData(values, { duplicateCcEmails, excludeClientId });
}

export async function createClientRecord(values: ClientFormValues) {
  const parsed = clientSchema.parse(values);
  await assertClientSaveValid(parsed);
  const supabase = await createClient();

  const { contacts, business_hours, ...clientData } = parsed;

  const { data: client, error } = await supabase
    .from("clients")
    .insert(clientData)
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (contacts.length > 0) {
    const { error: contactError } = await supabase.from("contacts").insert(
      contacts.map((c) => ({
        ...c,
        client_id: client.id,
        email: c.email || null,
        is_default_cc: c.is_default_cc ?? false,
      })),
    );
    if (contactError) throw new Error(contactError.message);
  }

  const hours = business_hours ?? getDefaultBusinessHours();
  const { error: hoursError } = await supabase.from("business_hours").insert(
    hours.map((h) => ({ ...h, client_id: client.id })),
  );
  if (hoursError) throw new Error(hoursError.message);

  // Create client channel
  const slug = `client-${client.company_name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  await supabase.from("channels").insert({
    name: client.company_name,
    slug,
    type: "client",
    client_id: client.id,
    description: `Discussion for ${client.company_name}`,
  });

  await logActivity("client_created", { company_name: client.company_name }, client.id);

  revalidatePath("/clients");
  revalidatePath("/dashboard");
  return client;
}

export async function quickAddClient(values: QuickAddClientValues) {
  const parsed = quickAddClientSchema.parse(values);

  return createClientRecord({
    company_name: parsed.company_name,
    primary_contact_name: parsed.primary_contact_name,
    timezone: parsed.timezone,
    billing_model: parsed.billing_model,
    status: "active",
    country: "US",
    contacts: [
      {
        role: "primary",
        name: parsed.primary_contact_name,
        email: parsed.cc_email || "",
        phone: parsed.phone,
        is_default_cc: false,
      },
      {
        role: "cc_manager",
        name: parsed.cc_alias || parsed.primary_contact_name,
        email: parsed.cc_email || "",
        phone: parsed.phone,
        cc_alias: parsed.cc_alias || parsed.primary_contact_name.split(" ")[0],
        is_default_cc: true,
      },
    ],
  });
}

export async function updateClient(id: string, values: ClientFormValues) {
  const parsed = clientSchema.parse(values);
  await assertClientSaveValid(parsed, id);
  const supabase = await createClient();
  const { contacts, business_hours, ...clientData } = parsed;

  const { error } = await supabase
    .from("clients")
    .update(clientData)
    .eq("id", id);

  if (error) throw new Error(error.message);

  await supabase.from("contacts").delete().eq("client_id", id);
  if (contacts.length > 0) {
    const { error: contactError } = await supabase.from("contacts").insert(
      contacts.map((c) => ({
        ...c,
        client_id: id,
        email: c.email || null,
        is_default_cc: c.is_default_cc ?? false,
      })),
    );
    if (contactError) throw new Error(contactError.message);
  }

  if (business_hours) {
    await supabase.from("business_hours").delete().eq("client_id", id);
    const { error: hoursError } = await supabase.from("business_hours").insert(
      business_hours.map((h) => ({ ...h, client_id: id })),
    );
    if (hoursError) throw new Error(hoursError.message);
  }

  await logActivity("client_edited", { company_name: parsed.company_name }, id);

  revalidatePath("/clients");
  revalidatePath("/dashboard");
  revalidatePath(`/clients/${id}`);
  return { success: true };
}

export async function deleteClient(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/clients");
  revalidatePath("/dashboard");
}

export async function addClientNote(clientId: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("client_notes").insert({
    client_id: clientId,
    author_id: user?.id,
    content,
  });

  if (error) throw new Error(error.message);
  await logActivity("note_added", { preview: content.slice(0, 80) }, clientId);
  revalidatePath(`/clients/${clientId}`);
}

export async function getClientNotes(clientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_notes")
    .select("*, author:profiles(id, full_name, email)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function updateClientOwner(
  clientId: string,
  ownerId: string | null,
) {
  const supabase = await createClient();

  let ownerName = "Unassigned";
  if (ownerId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", ownerId)
      .single();
    ownerName = profile?.full_name ?? profile?.email ?? ownerName;
  }

  const { error } = await supabase
    .from("clients")
    .update({ primary_owner_id: ownerId })
    .eq("id", clientId);

  if (error) throw new Error(error.message);

  await logActivity(
    "owner_changed",
    { new_owner_id: ownerId, new_owner_name: ownerName },
    clientId,
  );

  revalidatePath("/clients");
  revalidatePath("/dashboard");
  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}

export async function getProfiles() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, role, created_at, updated_at, is_active")
    .order("full_name");

  if (!error) return (data ?? []) as Profile[];

  if (isMissingSchemaError(error, "is_active")) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url, role, created_at, updated_at")
      .order("full_name");

    if (!fallbackError) return (fallbackData ?? []) as Profile[];
    if (isMissingSchemaError(fallbackError, "profiles")) return [];
  }

  if (isMissingSchemaError(error, "profiles")) return [];

  console.error("[getProfiles]", error.message);
  return [];
}
