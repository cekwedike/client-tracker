"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/actions/auth";
import { canRefreshSpreadsheet } from "@/lib/permissions";
import { runSpreadsheetSeed } from "@/lib/seed/run-spreadsheet-seed";
import { computeSpreadsheetDiff } from "@/lib/seed/spreadsheet-diff";

export async function previewSpreadsheetDiff() {
  const user = await getCurrentUser();
  if (!user || !canRefreshSpreadsheet(user.role)) {
    throw new Error("Only admins can preview spreadsheet diff");
  }

  return computeSpreadsheetDiff();
}

export async function refreshFromSpreadsheet() {
  const user = await getCurrentUser();
  if (!user || !canRefreshSpreadsheet(user.role)) {
    throw new Error("Only admins can refresh from spreadsheet");
  }

  const result = await runSpreadsheetSeed(true);

  revalidatePath("/clients");
  revalidatePath("/dashboard");

  return result;
}
