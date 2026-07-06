import type { Profile } from "@/lib/types";

export function profileSelectLabel(
  profiles: Pick<Profile, "id" | "full_name" | "email">[],
  id: string | null | undefined,
  fallback = "Unassigned",
): string {
  if (!id) return fallback;
  const profile = profiles.find((p) => p.id === id);
  return profile?.full_name?.trim() || profile?.email || fallback;
}

export function clientSelectLabel(
  clients: { id: string; company_name: string }[],
  id: string | null | undefined,
  fallback = "General ops",
): string {
  if (!id) return fallback;
  return clients.find((c) => c.id === id)?.company_name ?? fallback;
}
