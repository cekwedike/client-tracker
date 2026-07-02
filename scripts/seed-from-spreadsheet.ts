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
    primary_contact_name: "Amer Sharma",
    billing_model: "ppl",
    timezone: mapAbbreviationToTimezone("BST"),
    industry: "Commercial Cleaning",
    contacts: [
      {
        role: "primary",
        name: "Amer Sharma",
        email: "amer@property-one.net",
        phone: "44 7305 821345",
      },
      {
        role: "cc_manager",
        name: "Amer Sharma",
        email: "amer@property-one.net",
        phone: "44 7305 821345",
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
        phone: "443-324-6164",
      },
      {
        role: "cc_manager",
        name: "Taylor Juchs",
        email: "info@impeccablycleanllc.com",
        phone: "443-324-6164",
        cc_alias: "Taylor",
        is_default_cc: true,
      },
    ],
  },
  {
    company_name: "Cleaning Group Inc.",
    primary_contact_name: "Glenn Greeley",
    billing_model: "ppl",
    timezone: mapAbbreviationToTimezone("EST"),
    industry: "Commercial Cleaning",
    contacts: [
      {
        role: "primary",
        name: "Glenn Greeley",
        email: "glenn@cleaninggroupinc.com",
        phone: "(484) 426-7366",
      },
      {
        role: "cc_manager",
        name: "Glenn Greeley",
        email: "glenn@cleaninggroupinc.com",
        phone: "(484) 426-7366",
        cc_alias: "Glenn",
        special_instructions:
          "Email accounts already named after, so just say I'll give you a call from (number)",
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
        email: "patrick@cleanpristine.com",
      },
      {
        role: "cc_manager",
        name: "Patrick Wright",
        email: "patrick@cleanpristine.com",
        cc_alias: "Patrick",
        is_default_cc: true,
      },
    ],
  },
  {
    company_name: "Lehigh Valley Cleaning Services",
    primary_contact_name: "Ali Ayalla",
    billing_model: "ppl",
    timezone: mapAbbreviationToTimezone("EST"),
    industry: "Commercial Cleaning",
    contacts: [
      { role: "primary", name: "Ali Ayalla" },
      {
        role: "cc_manager",
        name: "Ali Ayalla",
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
      { role: "primary", name: "Yamileth Ospina" },
      {
        role: "cc_manager",
        name: "John",
        cc_alias: "John",
        is_default_cc: true,
      },
    ],
  },
  {
    company_name: "Partner Facility Solutions",
    primary_contact_name: "Mauricio Fonseca",
    billing_model: "ppm",
    timezone: mapAbbreviationToTimezone("CST"),
    industry: "Commercial Cleaning",
    contacts: [
      { role: "primary", name: "Mauricio Fonseca" },
      {
        role: "cc_manager",
        name: "Mauricio Fonseca",
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
      { role: "primary", name: "Danny" },
      {
        role: "cc_manager",
        name: "Danny",
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
      { role: "primary", name: "Mark" },
      {
        role: "cc_manager",
        name: "Mark",
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
      { role: "primary", name: "Brett Lee" },
      {
        role: "cc_manager",
        name: "Tara",
        cc_alias: "Tiara",
        is_default_cc: true,
      },
    ],
  },
  {
    company_name: "Status Clean",
    primary_contact_name: "Shaun Butterworth",
    billing_model: "ppl",
    timezone: mapAbbreviationToTimezone("PST"),
    industry: "Commercial Cleaning",
    contacts: [
      { role: "primary", name: "Shaun Butterworth" },
      {
        role: "cc_manager",
        name: "Shaun Butterworth",
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
      { role: "primary", name: "Matt Hartman" },
      {
        role: "cc_manager",
        name: "Matt Hartman",
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

async function seed() {
  const supabase = createAdminClient();
  const refresh = process.argv.includes("--refresh");

  const { data: existing } = await supabase
    .from("clients")
    .select("id, company_name");

  const existingByName = new Map(
    existing?.map((c) => [c.company_name, c.id]) ?? [],
  );

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const seedClient of SPREADSHEET_CLIENTS) {
    const existingId = existingByName.get(seedClient.company_name);

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
      await supabase.from("contacts").insert(
        contacts.map((c) => ({ ...c, client_id: existingId })),
      );

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

    await supabase.from("contacts").insert(
      contacts.map((c) => ({ ...c, client_id: client.id })),
    );

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
