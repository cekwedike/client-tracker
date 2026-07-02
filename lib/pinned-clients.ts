"use client";

const STORAGE_KEY = "meridian-pinned-clients";

export function getPinnedClientIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export const PINNED_CLIENTS_EVENT = "meridian-pinned-clients-changed";

export function setPinnedClientIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event(PINNED_CLIENTS_EVENT));
}

export function togglePinnedClient(clientId: string): string[] {
  const current = getPinnedClientIds();
  const next = current.includes(clientId)
    ? current.filter((id) => id !== clientId)
    : [...current, clientId];
  setPinnedClientIds(next);
  return next;
}

export function isClientPinned(clientId: string): boolean {
  return getPinnedClientIds().includes(clientId);
}

export function sortClientsWithPinned<T extends { id: string }>(
  clients: T[],
  pinnedIds: string[],
): { pinned: T[]; rest: T[] } {
  const pinnedSet = new Set(pinnedIds);
  const pinned = pinnedIds
    .map((id) => clients.find((c) => c.id === id))
    .filter((c): c is T => Boolean(c));
  const rest = clients.filter((c) => !pinnedSet.has(c.id));
  return { pinned, rest };
}
