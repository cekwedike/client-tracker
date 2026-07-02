#!/usr/bin/env node
/**
 * Diagnose Meridian setup — run: pnpm doctor
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const envPath = resolve(root, ".env.local");

function check(name, ok, fix) {
  const icon = ok ? "✓" : "✗";
  console.log(`${icon} ${name}`);
  if (!ok && fix) console.log(`  → ${fix}`);
  return ok;
}

let dockerOk = false;
try {
  execSync("docker info", { stdio: "ignore" });
  dockerOk = true;
} catch {
  dockerOk = false;
}

const envExists = existsSync(envPath);
let envOk = false;
if (envExists) {
  const env = readFileSync(envPath, "utf8");
  envOk =
    env.includes("NEXT_PUBLIC_SUPABASE_URL=") &&
    !env.includes("your-project.supabase.co") &&
    env.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY=") &&
    !env.includes("your-anon-key") &&
    env.includes("SUPABASE_SERVICE_ROLE_KEY=") &&
    !env.includes("your-service-role-key");
}

console.log("\nMeridian setup check\n");

check("Docker running", dockerOk, "Install/start Docker Desktop for local Supabase, OR use Supabase Cloud (see README)");
check(".env.local exists", envExists, "Copy .env.example to .env.local OR run pnpm db:setup (needs Docker)");
check("Supabase credentials configured", envOk, "Fill in .env.local from supabase.com → Project Settings → API");

if (!dockerOk && !envOk) {
  console.log("\nRecommended (no Docker):");
  console.log("  1. Create free project at https://supabase.com/dashboard");
  console.log("  2. SQL Editor → paste supabase/migrations/001_initial_schema.sql → Run");
  console.log("  3. Project Settings → API → copy URL, anon key, service_role key");
  console.log("  4. Create .env.local with those three values");
  console.log("  5. pnpm seed && pnpm dev");
} else if (dockerOk && !envOk) {
  console.log("\nRecommended (local):");
  console.log("  pnpm db:start && pnpm db:setup && pnpm db:migrate && pnpm seed && pnpm dev");
} else if (envOk) {
  console.log("\nYou're good to go: pnpm seed && pnpm dev");
}

console.log("");
