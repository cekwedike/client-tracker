export type TimeFormat = "12h" | "24h";
export type Density = "compact" | "comfortable";

export interface AppSettings {
  timeFormat: TimeFormat;
  density: Density;
}

export const DEFAULT_SETTINGS: AppSettings = {
  timeFormat: "24h",
  density: "comfortable",
};

export const SETTINGS_STORAGE_KEY = "meridian-settings";

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      timeFormat: parsed.timeFormat === "12h" ? "12h" : "24h",
      density: parsed.density === "compact" ? "compact" : "comfortable",
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}
