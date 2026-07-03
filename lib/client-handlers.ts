import type { ClientTier, Profile } from "@/lib/types";

export const TRIAL_HANDLER_NAME = "Emmanuel Akatobi";
export const FULL_HANDLER_NAME = "Chidiebere Ekwedike";

export function findProfileByName(
  profiles: Pick<Profile, "id" | "full_name">[],
  name: string,
): string | null {
  const normalized = name.toLowerCase();
  const match = profiles.find((p) =>
    p.full_name?.toLowerCase().startsWith(normalized),
  );
  return match?.id ?? null;
}

export function resolveDefaultHandledById(
  profiles: Pick<Profile, "id" | "full_name">[],
  tier: ClientTier,
): string | null {
  const targetName = tier === "trial" ? TRIAL_HANDLER_NAME : FULL_HANDLER_NAME;
  return findProfileByName(profiles, targetName);
}
