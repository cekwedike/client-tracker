import { DateTime } from "luxon";
import type { BusinessHour, ContactWindowStatus } from "./types";

export function mapAbbreviationToTimezone(abbrev: string): string {
  const map: Record<string, string> = {
    EST: "America/New_York",
    EDT: "America/New_York",
    CST: "America/Chicago",
    CDT: "America/Chicago",
    MT: "America/Denver",
    MST: "America/Denver",
    MDT: "America/Denver",
    PST: "America/Los_Angeles",
    PDT: "America/Los_Angeles",
  };
  return map[abbrev.toUpperCase()] ?? "America/New_York";
}

export function getLocalTime(timezone: string): DateTime {
  return DateTime.now().setZone(timezone);
}

export function formatLocalTime(timezone: string): string {
  return getLocalTime(timezone).toFormat("h:mm a");
}

export function formatLocalDateTime(timezone: string): string {
  return getLocalTime(timezone).toFormat("EEE, MMM d · h:mm a");
}

export function getContactWindowStatus(
  timezone: string,
  businessHours: BusinessHour[],
  doNotContactBefore?: string | null,
  doNotContactAfter?: string | null,
): { status: ContactWindowStatus; label: string } {
  const now = getLocalTime(timezone);
  const dayOfWeek = now.weekday % 7; // Luxon: Mon=1..Sun=7, we use Sun=0

  const todayHours = businessHours.find((h) => h.day_of_week === dayOfWeek);

  if (todayHours?.is_closed) {
    return { status: "closed", label: "Closed today" };
  }

  const startTime = todayHours?.start_time ?? "09:00";
  const endTime = todayHours?.end_time ?? "17:00";
  const before = doNotContactBefore ?? startTime;
  const after = doNotContactAfter ?? endTime;

  const currentMinutes = now.hour * 60 + now.minute;
  const [startH, startM] = before.split(":").map(Number);
  const [endH, endM] = after.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (currentMinutes < startMinutes) {
    return { status: "closed", label: `Opens at ${formatTime12h(before)}` };
  }

  if (currentMinutes > endMinutes) {
    return { status: "closed", label: `Closed · after ${formatTime12h(after)}` };
  }

  const minutesUntilClose = endMinutes - currentMinutes;
  if (minutesUntilClose <= 60) {
    return { status: "closing", label: `Closing in ${minutesUntilClose}m` };
  }

  return { status: "open", label: "Safe to contact" };
}

function formatTime12h(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

export function getDefaultBusinessHours(): Omit<BusinessHour, "id" | "client_id">[] {
  return Array.from({ length: 7 }, (_, day) => ({
    day_of_week: day,
    start_time: "09:00",
    end_time: "17:00",
    is_closed: day === 0 || day === 6,
  }));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function buildCCPlaybook(contacts: {
  cc_alias?: string | null;
  name: string;
  email?: string | null;
  special_instructions?: string | null;
  is_default_cc?: boolean;
}[]): string {
  const ccContact =
    contacts.find((c) => c.is_default_cc) ??
    contacts.find((c) => c.cc_alias) ??
    contacts[0];

  if (!ccContact) return "No CC contact configured.";

  const lines: string[] = [];
  const alias = ccContact.cc_alias ?? ccContact.name.split(" ")[0];

  lines.push(`CC Manager: mention as "${alias}"`);
  if (ccContact.email) lines.push(`CC Email: ${ccContact.email}`);
  if (ccContact.special_instructions) {
    lines.push(`Instructions: ${ccContact.special_instructions}`);
  }

  return lines.join("\n");
}
