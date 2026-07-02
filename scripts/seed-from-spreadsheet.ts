/**
 * Seed script — imports PLNITUDE spreadsheet clients into Supabase.
 *
 * Usage:
 *   1. Run supabase/migrations/001_initial_schema.sql in your Supabase SQL editor
 *   2. Copy .env.example to .env.local and fill in credentials
 *   3. pnpm seed
 *   4. pnpm seed -- --refresh   (update existing rows from spreadsheet)
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
import { createAdminClient } from "../lib/supabase/admin";
import { mapAbbreviationToTimezone } from "../lib/timezone";

interface SeedClient {
  company_name: string;
  primary_contact_name: string;
  billing_model: "ppl" | "ppm";
  timezone: string;
  industry: string;
  contacts: {
    role: "primary" | "cc_manager";
    name: string;
    email?: string;
    phone?: string;
    cc_alias?: string;
    special_instructions?: string;
    is_default_cc?: boolean;
  }[];
}

const SPREADSHEET_CLIENTS: SeedClient[] = [
  {
    company_name: "Service Master Clean",
    primary_contact_name: "Arnav Sharma",
    billing_model: "ppl",
    timezone: mapAbbreviationToTimezone("BST"),
    industry: "Commercial Cleaning",
    contacts: [
      {
        role: "primary",
        name: "Arnav Sharma",
        email: "arnav@property-one.net",
        phone: "44 7305 921345",
      },
      {
        role: "cc_manager",
        name: "Arnav Sharma",
        email: "arnav@property-one.net",
        phone: "44 7305 921345",
        cc_alias: "Arnav",
        is_default_cc: true,
      },
    ],
  },
  {
    company_name: "Impeccably Clean LLC",
    primary_contact_name: "Taylor Juchs",
    billing_model: "ppl",
    timezone: mapAbbreviationToTimezone("EST"),
    industry: "Commercial Cleaning",
    contacts: [
      {
        role: "primary",
        name: "Taylor Juchs",
        email: "info@impeccablycleanllc.com",
        phone: "443-324-6154",
      },
      {
        role: "cc_manager",
        name: "Taylor Juchs",
        email: "info@impeccablycleanllc.com",
        phone: "443-324-6154",
        cc_alias: "Taylor",
        special_instructions:
          "Say \"I'll give you a call from {Number}\" instead of CC name",
        is_default_cc: true,
      },
    ],
  },
  {
    company_name: "Cleaning Group Inc",
    primary_contact_name: "Glenn Greeley",
    billing_model: "ppl",
    timezone: mapAbbreviationToTimezone("EST"),
    industry: "Commercial Cleaning",
    contacts: [
      {
        role: "primary",
        name: "Glenn Greeley",
        email: "glenn@cleaninggroupinc.com",
        phone: "631-669-6033",
      },
      {
        role: "cc_manager",
        name: "Glenn Greeley",
        email: "glenn@cleaninggroupinc.com",
        phone: "631-669-6033",
        cc_alias: "Glenn",
        is_default_cc: true,
      },
    ],
  },
  {
    company_name: "Cleaned Pristine Solutions",
    primary_contact_name: "Patrick Wright",
    billing_model: "ppl",
    timezone: mapAbbreviationToTimezone("EST"),
    industry: "Commercial Cleaning",
    contacts: [
      {
        role: "primary",
        name: "Patrick Wright",
        email: "patrikklw@gmail.com",
        phone: "013-359-1051",
      },
      {
        role: "cc_manager",
        name: "Patrick Wright",
        email: "patrikklw@gmail.com",
        phone: "013-359-1051",
        cc_alias: "Patrick",
        is_default_cc: true,
      },
    ],
  },
  {
    company_name: "Lehigh Valley Cleaning Services",
    primary_contact_name: "Ali Ayala",
    billing_model: "ppl",
    timezone: mapAbbreviationToTimezone("EST"),
    industry: "Commercial Cleaning",
    contacts: [
      {
        role: "primary",
        name: "Ali Ayala",
        email: "lehighvalleycleaningservices@gmail.com",
        phone: "(484) 426-7366",
      },
      {
        role: "cc_manager",
        name: "Ali Ayala",
        email: "lehighvalleycleaningservices@gmail.com",
        phone: "(484) 426-7366",
        cc_alias: "Ali",
        is_default_cc: true,
      },
    ],
  },
  {
    company_name: "M Y Janitorial Services",
    primary_contact_name: "Yamileth Ospina",
    billing_model: "ppl",
    timezone: mapAbbreviationToTimezone("CST"),
    industry: "Commercial Cleaning",
    contacts: [
      {
        role: "primary",
        name: "Yamileth Ospina",
        email: "john@myjanitorialservices.us",
        phone: "(832) 978 7420",
      },
      {
        role: "cc_manager",
        name: "John",
        email: "john@myjanitorialservices.us",
        phone: "(832) 978 7420",
        cc_alias: "John",
        is_default_cc: true,
      },
    ],
  },
  {
    company_name: "Partner Facility Solutions",
    primary_contact_name: "Mauricio Fonseca",
    billing_model: "ppm",
    timezone: mapAbbreviationToTimezone("EST"),
    industry: "Commercial Cleaning",
    contacts: [
      {
        role: "primary",
        name: "Mauricio Fonseca",
        email: "mfonseca@partnerfacility.com",
        phone: "617 553-4862",
      },
      {
        role: "cc_manager",
        name: "Mauricio Fonseca",
        email: "mfonseca@partnerfacility.com",
        phone: "617 553-4862",
        cc_alias: "Mauricio",
        is_default_cc: true,
      },
    ],
  },
  {
    company_name: "AAAControl",
    primary_contact_name: "Danny",
    billing_model: "ppl",
    timezone: mapAbbreviationToTimezone("MT"),
    industry: "Commercial Cleaning",
    contacts: [
      {
        role: "primary",
        name: "Danny",
        email: "danny@goaaacontrol.com",
        phone: "(512) 230-8168",
      },
      {
        role: "cc_manager",
        name: "Danny",
        email: "danny@goaaacontrol.com",
        phone: "(512) 230-8168",
        cc_alias: "Danny",
        is_default_cc: true,
      },
    ],
  },
  {
    company_name: "Aspen Maintenance",
    primary_contact_name: "Mark",
    billing_model: "ppl",
    timezone: mapAbbreviationToTimezone("MT"),
    industry: "Commercial Cleaning",
    contacts: [
      {
        role: "primary",
        name: "Mark",
        email: "mark@aspenmaintenance.com",
        phone: "(720) 341-9041",
      },
      {
        role: "cc_manager",
        name: "Mark",
        email: "mark@aspenmaintenance.com",
        phone: "(720) 341-9041",
        cc_alias: "Mark",
        is_default_cc: true,
      },
    ],
  },
  {
    company_name: "CitiClean Services",
    primary_contact_name: "Brett Lee",
    billing_model: "ppm",
    timezone: mapAbbreviationToTimezone("PST"),
    industry: "Commercial Cleaning",
    contacts: [
      {
        role: "primary",
        name: "Brett Lee",
        email: "tiara@citicleanservices.com",
        phone: "4359226677",
      },
      {
        role: "cc_manager",
        name: "Tiara",
        email: "tiara@citicleanservices.com",
        phone: "4359226677",
        cc_alias: "Tiara",
        is_default_cc: true,
      },
    ],
  },
  {
    company_name: "Stratus Clean",
    primary_contact_name: "Shaun Butterworth",
    billing_model: "ppl",
    timezone: mapAbbreviationToTimezone("CST"),
    industry: "Commercial Cleaning",
    contacts: [
      {
        role: "primary",
        name: "Shaun Butterworth",
        email: "sbutterworth@stratusclean.com",
        phone: "972-391-7011",
      },
      {
        role: "cc_manager",
        name: "Shaun Butterworth",
        email: "sbutterworth@stratusclean.com",
        phone: "972-391-7011",
        cc_alias: "Shaun",
        is_default_cc: true,
      },
    ],
  },
  {
    company_name: "Green Tips Landscape",
    primary_contact_name: "Matt Hartman",
    billing_model: "ppl",
    timezone: mapAbbreviationToTimezone("PST"),
    industry: "Landscaping",
    contacts: [
      {
        role: "primary",
        name: "Matt Hartman",
        email: "Matt@greentipsla.com",
        phone: "650-307-5288",
      },
      {
        role: "cc_manager",
        name: "Matt Hartman",
        email: "Matt@greentipsla.com",
        phone: "650-307-5288",
        cc_alias: "Matt",
        is_default_cc: true,
      },
    ],
  },
];

const DEFAULT_HOURS = Array.from({ length: 7 }, (_, day) => ({
  day_of_week: day,
  start_time: "09:00",
  end_time: "17:00",
  is_closed: day === 0 || day === 6,
}));

function mapContactsForInsert(
  contacts: SeedClient["contacts"],
  clientId: string,
) {
  return contacts.map((c) => ({
    ...c,
    client_id: clientId,
    is_default_cc: c.is_default_cc ?? false,
  }));
}

async function seed() {
  const supabase = createAdminClient();
  const refresh = process.argv.includes("--refresh");

  const { data: existing } = await supabase
    .from("clients")
    .select("id, company_name");

  const existingByName = new Map(
    existing?.map((c) => [c.company_name, c.id]) ?? [],
  );

  const LEGACY_NAME_ALIASES: Record<string, string> = {
    "Cleaning Group Inc.": "Cleaning Group Inc",
    "Status Clean": "Stratus Clean",
  };

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

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const seedClient of SPREADSHEET_CLIENTS) {
    const existingId = resolveExistingId(seedClient.company_name);

    if (existingId && refresh) {
      const { contacts, ...clientData } = seedClient;
      const { error } = await supabase
        .from("clients")
        .update({ ...clientData, status: "active", country: "US" })
        .eq("id", existingId);

      if (error) {
        console.error(`✗ Failed to update ${seedClient.company_name}:`, error.message);
        continue;
      }

      await supabase.from("contacts").delete().eq("client_id", existingId);
      const { error: contactError } = await supabase
        .from("contacts")
        .insert(mapContactsForInsert(contacts, existingId));
      if (contactError) {
        console.error(
          `✗ Failed to update contacts for ${seedClient.company_name}:`,
          contactError.message,
        );
        continue;
      }

      console.log(`↻ Updated ${seedClient.company_name}`);
      updated++;
      continue;
    }

    if (existingId) {
      console.log(`⏭  Skipping ${seedClient.company_name} (already exists)`);
      skipped++;
      continue;
    }

    const { contacts, ...clientData } = seedClient;

    const { data: client, error } = await supabase
      .from("clients")
      .insert({ ...clientData, status: "active", country: "US" })
      .select()
      .single();

    if (error) {
      console.error(`✗ Failed to insert ${seedClient.company_name}:`, error.message);
      continue;
    }

    const { error: contactError } = await supabase
      .from("contacts")
      .insert(mapContactsForInsert(contacts, client.id));
    if (contactError) {
      console.error(
        `✗ Failed to insert contacts for ${seedClient.company_name}:`,
        contactError.message,
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

    console.log(`✓ Inserted ${seedClient.company_name}`);
    inserted++;
  }

  console.log(`\nDone: ${inserted} inserted, ${updated} updated, ${skipped} skipped`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
