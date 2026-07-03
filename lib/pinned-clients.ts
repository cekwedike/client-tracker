"use client";

const STORAGE_KEY = "meridian-pinned-clients";

export interface PinnedClient {
  id: string;
  company_name: string;
}

export const PINNED_CLIENTS_EVENT = "meridian-pinned-clients-changed";

function parseStored(raw: string | null): PinnedClient[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item): PinnedClient | null => {
        if (typeof item === "string") {
          return { id: item, company_name: "Client" };
        }
        if (
          item &&
          typeof item === "object" &&
          "id" in item &&
          typeof (item as PinnedClient).id === "string"
        ) {
          const row = item as PinnedClient;
          return {
            id: row.id,
            company_name: row.company_name || "Client",
          };
        }
        return null;
      })
      .filter((c): c is PinnedClient => Boolean(c));
  } catch {
    return [];
  }
}

export function getPinnedClients(): PinnedClient[] {
  if (typeof window === "undefined") return [];
  return parseStored(localStorage.getItem(STORAGE_KEY));
}

export function getPinnedClientIds(): string[] {
  return getPinnedClients().map((c) => c.id);
}

export function setPinnedClients(clients: PinnedClient[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  window.dispatchEvent(new Event(PINNED_CLIENTS_EVENT));
}

export function togglePinnedClient(clientId: string, companyName: string): string[] {
  const current = getPinnedClients();
  const exists = current.some((c) => c.id === clientId);
  const next = exists
    ? current.filter((c) => c.id !== clientId)
    : [...current, { id: clientId, company_name: companyName }];
  setPinnedClients(next);
  return next.map((c) => c.id);
}

export function isClientPinned(clientId: string): boolean {
  return getPinnedClients().some((c) => c.id === clientId);
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
