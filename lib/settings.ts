export type TimeFormat = "12h" | "24h";
export type Density = "compact" | "comfortable";

export interface AppSettings {
  timeFormat: TimeFormat;
  density: Density;
  browserNotifications: boolean;
  operatorTimezone: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  timeFormat: "24h",
  density: "comfortable",
  browserNotifications: false,
  operatorTimezone: "auto",
};

export const SETTINGS_STORAGE_KEY = "meridian-settings";

function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "America/New_York";
  }
}

export function resolveOperatorTimezone(settings: AppSettings): string {
  if (settings.operatorTimezone && settings.operatorTimezone !== "auto") {
    return settings.operatorTimezone;
  }
  return detectTimezone();
}

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      timeFormat: parsed.timeFormat === "12h" ? "12h" : "24h",
      density: parsed.density === "compact" ? "compact" : "comfortable",
      browserNotifications: parsed.browserNotifications === true,
      operatorTimezone:
        typeof parsed.operatorTimezone === "string"
          ? parsed.operatorTimezone
          : "auto",
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export const COMMON_TIMEZONES = [
  { value: "auto", label: "Auto (browser)" },
  { value: "America/New_York", label: "Eastern (US)" },
  { value: "America/Chicago", label: "Central (US)" },
  { value: "America/Denver", label: "Mountain (US)" },
  { value: "America/Los_Angeles", label: "Pacific (US)" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Paris", label: "Paris" },
  { value: "Asia/Manila", label: "Manila" },
  { value: "Asia/Kolkata", label: "India" },
  { value: "Australia/Sydney", label: "Sydney" },
] as const;
