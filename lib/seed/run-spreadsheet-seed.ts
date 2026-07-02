import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_HOURS,
  LEGACY_NAME_ALIASES,
  SPREADSHEET_CLIENTS,
  mapContactsForInsert,
} from "@/lib/seed/spreadsheet-data";

export interface SeedRunResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export async function runSpreadsheetSeed(
  refresh = false,
): Promise<SeedRunResult> {
  const supabase = createAdminClient();
  const result: SeedRunResult = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  const { data: existing, error: fetchError } = await supabase
    .from("clients")
    .select("id, company_name");

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const existingByName = new Map(
    existing?.map((c) => [c.company_name, c.id]) ?? [],
  );

  function resolveExistingId(companyName: string): string | undefined {
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

  for (const seedClient of SPREADSHEET_CLIENTS) {
    const existingId = resolveExistingId(seedClient.company_name);

    if (existingId && refresh) {
      const { contacts, ...clientData } = seedClient;
      const { error } = await supabase
        .from("clients")
        .update({ ...clientData, status: "active", country: "US" })
        .eq("id", existingId);

      if (error) {
        result.errors.push(`${seedClient.company_name}: ${error.message}`);
        continue;
      }

      await supabase.from("contacts").delete().eq("client_id", existingId);
      const { error: contactError } = await supabase
        .from("contacts")
        .insert(mapContactsForInsert(contacts, existingId));
      if (contactError) {
        result.errors.push(
          `${seedClient.company_name} contacts: ${contactError.message}`,
        );
        continue;
      }

      result.updated++;
      continue;
    }

    if (existingId) {
      result.skipped++;
      continue;
    }

    const { contacts, ...clientData } = seedClient;

    const { data: client, error } = await supabase
      .from("clients")
      .insert({ ...clientData, status: "active", country: "US" })
      .select()
      .single();

    if (error) {
      result.errors.push(`${seedClient.company_name}: ${error.message}`);
      continue;
    }

    const { error: contactError } = await supabase
      .from("contacts")
      .insert(mapContactsForInsert(contacts, client.id));
    if (contactError) {
      result.errors.push(
        `${seedClient.company_name} contacts: ${contactError.message}`,
      );
      continue;
    }

    await supabase.from("business_hours").insert(
      DEFAULT_HOURS.map((h) => ({ ...h, client_id: client.id })),
    );

    const slug = `client-${seedClient.company_name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    await supabase.from("channels").insert({
      name: seedClient.company_name,
      slug,
      type: "client",
      client_id: client.id,
      description: `Discussion for ${seedClient.company_name}`,
    });

    result.inserted++;
  }

  return result;
}
