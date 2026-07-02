import { isPast, parseISO } from "date-fns";
import type { ClientWithRelations, Task } from "@/lib/types";
import { getContactWindowStatus } from "@/lib/timezone";

export type ClientHealthLevel = "good" | "attention" | "urgent";

export interface ClientHealth {
  level: ClientHealthLevel;
  reasons: string[];
}

export interface ClientHealthContext {
  overdueTaskClientIds?: Set<string>;
}

function getOverdueClientIds(tasks: Task[]): Set<string> {
  const ids = new Set<string>();
  for (const task of tasks) {
    if (task.status === "done" || !task.client_id || !task.due_at) continue;
    if (isPast(parseISO(task.due_at))) ids.add(task.client_id);
  }
  return ids;
}

export function computeClientHealth(
  client: ClientWithRelations,
  context: ClientHealthContext = {},
): ClientHealth {
  const reasons: string[] = [];

  if (client.status === "active") {
    const window = getContactWindowStatus(
      client.timezone,
      client.business_hours,
      client.do_not_contact_before,
      client.do_not_contact_after,
    );
    if (window.status === "closing") {
      reasons.push("Contact window closing soon");
    }
  }

  if (!client.primary_owner_id) {
    reasons.push("Unassigned owner");
  }

  if (context.overdueTaskClientIds?.has(client.id)) {
    reasons.push("Open overdue tasks");
  }

  if (reasons.length === 0) {
    return { level: "good", reasons };
  }

  const hasOverdue = reasons.includes("Open overdue tasks");
  const level: ClientHealthLevel =
    hasOverdue || reasons.length >= 2 ? "urgent" : "attention";

  return { level, reasons };
}

export function buildHealthContext(tasks: Task[]): ClientHealthContext {
  return { overdueTaskClientIds: getOverdueClientIds(tasks) };
}

export function getClientsNeedingAttention(
  clients: ClientWithRelations[],
  tasks: Task[],
): Array<ClientWithRelations & { health: ClientHealth }> {
  const context = buildHealthContext(tasks);
  return clients
    .filter((c) => c.status === "active")
    .map((client) => ({
      ...client,
      health: computeClientHealth(client, context),
    }))
    .filter((c) => c.health.level !== "good")
    .sort((a, b) => {
      const order = { urgent: 0, attention: 1, good: 2 };
      return order[a.health.level] - order[b.health.level];
    });
}
