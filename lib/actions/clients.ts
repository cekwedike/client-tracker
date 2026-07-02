"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDefaultBusinessHours } from "@/lib/timezone";
import {
  clientSchema,
  quickAddClientSchema,
  type ClientFormValues,
  type QuickAddClientValues,
} from "@/lib/validations/client";
import type { ClientWithRelations } from "@/lib/types";

export async function getClients(filters?: {
  search?: string;
  billing_model?: string;
  status?: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("clients")
    .select(
      `
      *,
      contacts(*),
      business_hours(*),
      primary_owner:profiles!clients_primary_owner_id_fkey(id, full_name, email)
    `,
    )
    .order("company_name");

  if (filters?.billing_model) {
    query = query.eq("billing_model", filters.billing_model);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.search) {
    query = query.or(
      `company_name.ilike.%${filters.search}%,primary_contact_name.ilike.%${filters.search}%,city.ilike.%${filters.search}%`,
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as ClientWithRelations[];
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

export async function createClientRecord(values: ClientFormValues) {
  const parsed = clientSchema.parse(values);
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

export async function getProfiles() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name");

  if (error) throw new Error(error.message);
  return data;
}
