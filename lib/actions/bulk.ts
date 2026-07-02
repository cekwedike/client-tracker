"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/actions/auth";
import { logActivity } from "@/lib/actions/activity";
import { canBulkAssign, canExportClients } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { buildCcLeadBlock } from "@/lib/client-copy";
import type { ClientWithRelations } from "@/lib/types";

export async function bulkAssignOwner(clientIds: string[], ownerId: string | null) {
  const user = await getCurrentUser();
  if (!user || !canBulkAssign(user.role)) {
    throw new Error("Only managers and admins can bulk assign owners");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({ primary_owner_id: ownerId })
    .in("id", clientIds);

  if (error) throw new Error(error.message);

  let ownerName = "Unassigned";
  if (ownerId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", ownerId)
      .single();
    ownerName = profile?.full_name ?? profile?.email ?? ownerName;
  }

  await logActivity("bulk_action", {
    action: "assign_owner",
    count: clientIds.length,
    owner_id: ownerId,
    owner_name: ownerName,
  });

  revalidatePath("/clients");
  revalidatePath("/dashboard");
  return { success: true, count: clientIds.length };
}

export async function bulkAssignTemplate(clientIds: string[], templateId: string) {
  const user = await getCurrentUser();
  if (!user || !canBulkAssign(user.role)) {
    throw new Error("Only managers and admins can bulk assign templates");
  }

  const supabase = await createClient();
  const { data: template } = await supabase
    .from("message_templates")
    .select("name")
    .eq("id", templateId)
    .single();

  const rows = clientIds.map((client_id) => ({
    client_id,
    template_id: templateId,
  }));

  const { error } = await supabase.from("client_templates").insert(rows);

  if (error && !error.message.includes("duplicate")) {
    throw new Error(error.message);
  }

  await logActivity("bulk_action", {
    action: "assign_template",
    count: clientIds.length,
    template_id: templateId,
    template_name: template?.name,
  });

  revalidatePath("/clients");
  revalidatePath("/templates");
  return { success: true, count: clientIds.length };
}

export async function bulkExportCcBlocks(clientIds: string[]): Promise<string> {
  const user = await getCurrentUser();
  if (!user || !canExportClients(user.role)) {
    throw new Error("You do not have permission to export");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("company_name, contacts(*)")
    .in("id", clientIds)
    .order("company_name");

  if (error) throw new Error(error.message);

  const blocks = (data ?? []).map((client) => {
    const contacts = client.contacts ?? [];
    const cc =
      contacts.find((c: { is_default_cc?: boolean }) => c.is_default_cc) ??
      contacts.find((c: { role?: string }) => c.role === "cc_manager") ??
      contacts[0];
    const block = cc
      ? buildCcLeadBlock({
          ccName: cc.cc_alias ?? cc.name?.split(" ")[0],
          ccEmail: cc.email,
          phone: cc.phone,
          companyName: client.company_name,
        })
      : "";
    return `## ${client.company_name}\n${block || "_No CC contact_"}`;
  });

  await logActivity("bulk_action", {
    action: "export_cc_blocks",
    count: clientIds.length,
  });

  return blocks.join("\n\n");
}

export async function exportAllClientsCsv(): Promise<string> {
  const user = await getCurrentUser();
  if (!user || !canExportClients(user.role)) {
    throw new Error("You do not have permission to export");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select(
      `
      *,
      contacts(*),
      primary_owner:profiles!clients_primary_owner_id_fkey(full_name, email)
    `,
    )
    .order("company_name");

  if (error) throw new Error(error.message);

  const headers = [
    "company_name",
    "status",
    "billing_model",
    "timezone",
    "city",
    "state_region",
    "owner",
    "primary_contact",
    "contact_name",
    "contact_role",
    "contact_email",
    "contact_phone",
    "cc_alias",
    "inbox_url",
  ];

  const rows: string[][] = [];
  for (const client of data ?? []) {
    const owner =
      (client.primary_owner as { full_name?: string; email?: string } | null)
        ?.full_name ??
      (client.primary_owner as { email?: string } | null)?.email ??
      "";
    const contacts = (client.contacts ?? []) as ClientWithRelations["contacts"];

    if (contacts.length === 0) {
      rows.push([
        client.company_name,
        client.status,
        client.billing_model,
        client.timezone,
        client.city ?? "",
        client.state_region ?? "",
        owner,
        client.primary_contact_name ?? "",
        "",
        "",
        "",
        "",
        "",
        client.smartlead_inbox_url ?? "",
      ]);
      continue;
    }

    for (const contact of contacts) {
      rows.push([
        client.company_name,
        client.status,
        client.billing_model,
        client.timezone,
        client.city ?? "",
        client.state_region ?? "",
        owner,
        client.primary_contact_name ?? "",
        contact.name,
        contact.role,
        contact.email ?? "",
        contact.phone ?? "",
        contact.cc_alias ?? "",
        client.smartlead_inbox_url ?? "",
      ]);
    }
  }

  const escape = (v: string) => {
    if (v.includes(",") || v.includes('"') || v.includes("\n")) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  };

  return [headers.join(","), ...rows.map((r) => r.map(escape).join(","))].join(
    "\n",
  );
}
