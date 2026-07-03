"use server";

import { getCurrentUser } from "@/lib/actions/auth";
import { logActivity } from "@/lib/actions/activity";
import { canExportClients } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { buildCcLeadBlock } from "@/lib/client-copy";
import type { ClientWithRelations } from "@/lib/types";

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
