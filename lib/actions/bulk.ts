"use server";

import { getCurrentUser } from "@/lib/actions/auth";
import { logActivity } from "@/lib/actions/activity";
import { canExportClients } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { buildCcLeadBlock } from "@/lib/client-copy";

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
