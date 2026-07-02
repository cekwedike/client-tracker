"use server";

import { getCurrentUser } from "@/lib/actions/auth";
import { getClients, getProfiles } from "@/lib/actions/clients";
import { getMessageTemplates } from "@/lib/actions/templates";
import { getTasks } from "@/lib/actions/tasks";
import type {
  ClientWithRelations,
  MessageTemplateWithClients,
  Profile,
  Task,
  UserRole,
} from "@/lib/types";

export interface ClientsPageData {
  clients: ClientWithRelations[];
  tasks: Task[];
  profiles: Profile[];
  templates: MessageTemplateWithClients[];
  userRole: UserRole;
}

async function safeFetch<T>(
  label: string,
  fetcher: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fetcher();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[clients-page] ${label} failed:`, message);
    return fallback;
  }
}

/** Loads all data for /clients without ever throwing. */
export async function safeGetClientsPageData(filters?: {
  search?: string;
  billing_model?: string;
  status?: string;
}): Promise<ClientsPageData> {
  const [clients, tasks, profiles, templates, user] = await Promise.all([
    safeFetch("getClients", () => getClients(filters), []),
    safeFetch("getTasks", () => getTasks(), []),
    safeFetch("getProfiles", () => getProfiles(), []),
    safeFetch("getMessageTemplates", () => getMessageTemplates(), []),
    safeFetch("getCurrentUser", () => getCurrentUser(), null),
  ]);

  return {
    clients,
    tasks,
    profiles: profiles ?? [],
    templates,
    userRole: user?.role ?? "operator",
  };
}
