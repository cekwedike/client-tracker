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

import { runSpreadsheetSeed } from "../lib/seed/run-spreadsheet-seed";

async function seed() {
  const refresh = process.argv.includes("--refresh");
  const result = await runSpreadsheetSeed(refresh);

  if (result.errors.length > 0) {
    for (const err of result.errors) {
      console.error(`✗ ${err}`);
    }
  }

  console.log(
    `\nDone: ${result.inserted} inserted, ${result.updated} updated, ${result.skipped} skipped`,
  );
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
