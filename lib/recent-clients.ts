"use client";

const STORAGE_KEY = "meridian-recent-clients";
const MAX_RECENT = 8;

export const RECENT_CLIENTS_EVENT = "meridian-recent-clients-changed";

export function getRecentClientIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string").slice(0, MAX_RECENT)
      : [];
  } catch {
    return [];
  }
}

export function trackRecentClient(clientId: string): string[] {
  if (typeof window === "undefined") return [];
  const current = getRecentClientIds().filter((id) => id !== clientId);
  const next = [clientId, ...current].slice(0, MAX_RECENT);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(RECENT_CLIENTS_EVENT));
  return next;
}
