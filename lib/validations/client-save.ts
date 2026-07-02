import { TIMEZONE_OPTIONS } from "@/lib/types";

export interface ClientValidationIssue {
  field: string;
  message: string;
  severity: "error" | "warning";
}

export function isValidTimezone(tz: string): boolean {
  if (!tz?.trim()) return false;
  if (TIMEZONE_OPTIONS.some((o) => o.value === tz)) return true;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function validateClientFormData(
  values: {
    timezone: string;
    contacts: { email?: string; phone?: string; is_default_cc?: boolean }[];
  },
  options?: {
    duplicateCcEmails?: Map<string, string>;
    excludeClientId?: string;
  },
): ClientValidationIssue[] {
  const issues: ClientValidationIssue[] = [];

  if (!isValidTimezone(values.timezone)) {
    issues.push({
      field: "timezone",
      message: "Invalid or unsupported timezone",
      severity: "error",
    });
  }

  const defaultCc =
    values.contacts.find((c) => c.is_default_cc) ?? values.contacts[0];
  if (defaultCc && !defaultCc.phone?.trim()) {
    issues.push({
      field: "contacts",
      message: "Default CC contact is missing a phone number",
      severity: "warning",
    });
  }

  for (const contact of values.contacts) {
    const email = contact.email?.trim().toLowerCase();
    if (!email) continue;
    const otherClient = options?.duplicateCcEmails?.get(email);
    if (otherClient) {
      issues.push({
        field: "contacts",
        message: `CC email ${email} is already used by ${otherClient}`,
        severity: "error",
      });
    }
  }

  return issues;
}
