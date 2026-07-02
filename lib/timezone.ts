import { DateTime } from "luxon";
import type { TimeFormat } from "./settings";
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
    BST: "Europe/London",
    GMT: "Europe/London",
  };
  return map[abbrev.toUpperCase()] ?? "America/New_York";
}

export function getLocalTime(timezone: string): DateTime {
  return DateTime.now().setZone(timezone);
}

export function formatLocalTime(
  timezone: string,
  timeFormat: TimeFormat = "24h",
): string {
  const dt = getLocalTime(timezone);
  return timeFormat === "12h" ? dt.toFormat("h:mm:ss a") : dt.toFormat("HH:mm:ss");
}

export function formatLocalDateTime(
  timezone: string,
  timeFormat: TimeFormat = "24h",
): string {
  const dt = getLocalTime(timezone);
  const time =
    timeFormat === "12h" ? dt.toFormat("h:mm:ss a") : dt.toFormat("HH:mm:ss");
  return `${dt.toFormat("EEE, MMM d")} · ${time}`;
}

export function getTimezoneAbbreviation(timezone: string): string {
  const map: Record<string, string> = {
    "America/New_York": "EST",
    "America/Chicago": "CST",
    "America/Denver": "MST",
    "America/Los_Angeles": "PST",
    "America/Phoenix": "MST",
    "Europe/London": "BST",
    "Asia/Dubai": "GST",
    "Asia/Singapore": "SGT",
  };
  return map[timezone] ?? DateTime.now().setZone(timezone).offsetNameShort ?? timezone;
}

export function getTimezoneRegion(timezone: string): string {
  const map: Record<string, string> = {
    "America/New_York": "Eastern US",
    "America/Chicago": "Central US",
    "America/Denver": "Mountain US",
    "America/Los_Angeles": "Pacific US",
    "America/Phoenix": "Arizona",
    "Europe/London": "United Kingdom",
    "Asia/Dubai": "UAE",
    "Asia/Singapore": "Singapore",
  };
  return map[timezone] ?? timezone.split("/").pop()?.replace(/_/g, " ") ?? timezone;
}

export function formatClientLocation(
  city?: string | null,
  stateRegion?: string | null,
  timezone?: string,
): string {
  const parts = [city, stateRegion].filter(Boolean);
  if (parts.length > 0) return parts.join(", ");
  if (timezone) return getTimezoneRegion(timezone);
  return "—";
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

const CONTACT_WINDOW_PRIORITY: Record<ContactWindowStatus, number> = {
  open: 0,
  closing: 1,
  closed: 2,
};

function getContactWindowEndMinutes(
  timezone: string,
  businessHours: BusinessHour[],
  doNotContactBefore?: string | null,
  doNotContactAfter?: string | null,
): number | null {
  const now = getLocalTime(timezone);
  const dayOfWeek = now.weekday % 7;
  const todayHours = businessHours.find((h) => h.day_of_week === dayOfWeek);

  if (todayHours?.is_closed) return null;

  const endTime = todayHours?.end_time ?? "17:00";
  const after = doNotContactAfter ?? endTime;
  const [endH, endM] = after.split(":").map(Number);
  return endH * 60 + endM;
}

export function getMinutesUntilContactWindowClose(
  timezone: string,
  businessHours: BusinessHour[],
  doNotContactBefore?: string | null,
  doNotContactAfter?: string | null,
): number | null {
  const windowStatus = getContactWindowStatus(
    timezone,
    businessHours,
    doNotContactBefore,
    doNotContactAfter,
  );
  if (windowStatus.status !== "closing") return null;

  const now = getLocalTime(timezone);
  const endMinutes = getContactWindowEndMinutes(
    timezone,
    businessHours,
    doNotContactBefore,
    doNotContactAfter,
  );
  if (endMinutes === null) return null;

  return endMinutes - (now.hour * 60 + now.minute);
}

export function compareClientsByContactWindow<
  T extends {
    company_name?: string | null;
    timezone: string;
    business_hours: BusinessHour[];
    do_not_contact_before?: string | null;
    do_not_contact_after?: string | null;
  },
>(a: T, b: T): number {
  const statusA = getContactWindowStatus(
    a.timezone,
    a.business_hours,
    a.do_not_contact_before,
    a.do_not_contact_after,
  );
  const statusB = getContactWindowStatus(
    b.timezone,
    b.business_hours,
    b.do_not_contact_before,
    b.do_not_contact_after,
  );

  const priorityDiff =
    CONTACT_WINDOW_PRIORITY[statusA.status] -
    CONTACT_WINDOW_PRIORITY[statusB.status];
  if (priorityDiff !== 0) return priorityDiff;

  if (statusA.status === "closing") {
    const minutesA =
      getMinutesUntilContactWindowClose(
        a.timezone,
        a.business_hours,
        a.do_not_contact_before,
        a.do_not_contact_after,
      ) ?? 999;
    const minutesB =
      getMinutesUntilContactWindowClose(
        b.timezone,
        b.business_hours,
        b.do_not_contact_before,
        b.do_not_contact_after,
      ) ?? 999;
    return minutesA - minutesB;
  }

  const nameA = a.company_name?.trim().toLowerCase() ?? "";
  const nameB = b.company_name?.trim().toLowerCase() ?? "";
  return nameA.localeCompare(nameB);
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
