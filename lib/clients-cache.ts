"use client";

import type { ClientWithRelations } from "@/lib/types";

export const CLIENTS_CACHE_KEY = "meridian-clients-cache";

export function loadClientsCache(): ClientWithRelations[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CLIENTS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { clients?: ClientWithRelations[]; savedAt?: string };
    return Array.isArray(parsed.clients) ? parsed.clients : null;
  } catch {
    return null;
  }
}

export function saveClientsCache(clients: ClientWithRelations[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      CLIENTS_CACHE_KEY,
      JSON.stringify({ clients, savedAt: new Date().toISOString() }),
    );
  } catch {
    // Storage full or unavailable
  }
}
