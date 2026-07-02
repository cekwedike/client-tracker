import { createAdminClient } from "@/lib/supabase/admin";
import {
  LEGACY_NAME_ALIASES,
  SPREADSHEET_CLIENTS,
  mapContactsForInsert,
} from "@/lib/seed/spreadsheet-data";

export interface SpreadsheetDiffChange {
  company_name: string;
  type: "insert" | "update" | "unchanged";
  changes: string[];
}

export interface SpreadsheetDiffResult {
  changes: SpreadsheetDiffChange[];
  summary: { insert: number; update: number; unchanged: number };
}

function resolveExistingId(
  companyName: string,
  existingByName: Map<string, string>,
): string | undefined {
  const direct = existingByName.get(companyName);
  if (direct) return direct;
  for (const [legacy, canonical] of Object.entries(LEGACY_NAME_ALIASES)) {
    if (canonical === companyName) {
      const legacyId = existingByName.get(legacy);
      if (legacyId) return legacyId;
    }
  }
  return undefined;
}

function getDefaultCc(contacts: ReturnType<typeof mapContactsForInsert>) {
  return (
    contacts.find((c) => c.is_default_cc) ??
    contacts.find((c) => c.role === "cc_manager") ??
    contacts[0]
  );
}

export async function computeSpreadsheetDiff(): Promise<SpreadsheetDiffResult> {
  const supabase = createAdminClient();

  const { data: existingClients, error } = await supabase
    .from("clients")
    .select("id, company_name, timezone, city, state_region, smartlead_inbox_url");

  if (error) throw new Error(error.message);

  const existingByName = new Map(
    existingClients?.map((c) => [c.company_name, c.id]) ?? [],
  );

  const clientIds = existingClients?.map((c) => c.id) ?? [];
  const { data: existingContacts } = clientIds.length
    ? await supabase.from("contacts").select("*").in("client_id", clientIds)
    : { data: [] };

  const contactsByClient = new Map<string, typeof existingContacts>();
  for (const contact of existingContacts ?? []) {
    const list = contactsByClient.get(contact.client_id) ?? [];
    list.push(contact);
    contactsByClient.set(contact.client_id, list);
  }

  const changes: SpreadsheetDiffChange[] = [];
  let insert = 0;
  let update = 0;
  let unchanged = 0;

  for (const seedClient of SPREADSHEET_CLIENTS) {
    const existingId = resolveExistingId(seedClient.company_name, existingByName);
    const seedContacts = mapContactsForInsert(seedClient.contacts, "preview");
    const seedCc = getDefaultCc(seedContacts);

    if (!existingId) {
      insert++;
      changes.push({
        company_name: seedClient.company_name,
        type: "insert",
        changes: ["New client from spreadsheet"],
      });
      continue;
    }

    const dbClient = existingClients?.find((c) => c.id === existingId);
    const dbContacts = contactsByClient.get(existingId) ?? [];
    const dbCc =
      dbContacts.find((c) => c.is_default_cc) ??
      dbContacts.find((c) => c.role === "cc_manager") ??
      dbContacts[0];

    const fieldChanges: string[] = [];

    if (dbClient?.timezone !== seedClient.timezone) {
      fieldChanges.push(
        `Timezone: ${dbClient?.timezone ?? "—"} → ${seedClient.timezone}`,
      );
    }
    if (seedCc?.phone !== dbCc?.phone) {
      fieldChanges.push(
        `Phone: ${dbCc?.phone ?? "—"} → ${seedCc?.phone ?? "—"}`,
      );
    }
    if (seedCc?.email !== dbCc?.email) {
      fieldChanges.push(
        `CC email: ${dbCc?.email ?? "—"} → ${seedCc?.email ?? "—"}`,
      );
    }
    if (seedCc?.cc_alias !== dbCc?.cc_alias) {
      fieldChanges.push(
        `CC alias: ${dbCc?.cc_alias ?? "—"} → ${seedCc?.cc_alias ?? "—"}`,
      );
    }
    if (seedCc?.name !== dbCc?.name) {
      fieldChanges.push(
        `CC name: ${dbCc?.name ?? "—"} → ${seedCc?.name ?? "—"}`,
      );
    }

    if (fieldChanges.length === 0) {
      unchanged++;
      changes.push({
        company_name: seedClient.company_name,
        type: "unchanged",
        changes: [],
      });
    } else {
      update++;
      changes.push({
        company_name: seedClient.company_name,
        type: "update",
        changes: fieldChanges,
      });
    }
  }

  return {
    changes: changes.filter((c) => c.type !== "unchanged"),
    summary: { insert, update, unchanged },
  };
}
