"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/actions/auth";
import { runSpreadsheetSeed } from "@/lib/seed/run-spreadsheet-seed";

export async function refreshFromSpreadsheet() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") {
    throw new Error("Only admins can refresh from spreadsheet");
  }

  const result = await runSpreadsheetSeed(true);

  revalidatePath("/clients");
  revalidatePath("/dashboard");

  return result;
}
