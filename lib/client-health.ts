import { isPast, parseISO } from "date-fns";
import type {
  ClientDashboardSummary,
  ClientWithRelations,
  Task,
} from "@/lib/types";
import {
  formatLocalTime,
  getContactWindowStatus,
  getMinutesUntilContactWindowClose,
} from "@/lib/timezone";

export type ClientHealthLevel = "good" | "attention" | "urgent";

export interface ClientHealth {
  level: ClientHealthLevel;
  reasons: string[];
}

export interface ClientHealthContext {
  overdueTaskClientIds?: Set<string>;
}

export type ActionQueueReason = "closing_soon" | "task_overdue" | "safe_now";

export interface ActionQueueItem {
  id: string;
  clientId: string;
  companyName: string;
  reason: ActionQueueReason;
  badge: string;
  ccName?: string;
  phoneSnippet?: string;
  localTime?: string;
  taskId?: string;
  taskTitle?: string;
  sortKey?: number;
}

export interface ActionQueueResult {
  items: ActionQueueItem[];
  totalActionable: number;
  unassignedCount: number;
  closingCount: number;
  overdueTaskCount: number;
  safeNowCount: number;
}

type ClientLike = ClientDashboardSummary | ClientWithRelations;

function getDefaultCc(client: ClientLike) {
  return (
    client.contacts.find((c) => c.is_default_cc) ??
    client.contacts.find((c) => c.role === "cc_manager") ??
    client.contacts[0]
  );
}

function phoneSnippet(phone?: string | null): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 4) return `···${digits.slice(-4)}`;
  return phone;
}

function getOverdueClientIds(tasks: Task[]): Set<string> {
  const ids = new Set<string>();
  for (const task of tasks) {
    if (task.status === "done" || !task.client_id || !task.due_at) continue;
    if (isPast(parseISO(task.due_at))) ids.add(task.client_id);
  }
  return ids;
}

function getOverdueTasks(tasks: Task[]): Task[] {
  return tasks
    .filter(
      (task) =>
        task.status !== "done" &&
        task.client_id &&
        task.due_at &&
        isPast(parseISO(task.due_at)),
    )
    .sort(
      (a, b) =>
        parseISO(a.due_at!).getTime() - parseISO(b.due_at!).getTime(),
    );
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

export function buildActionQueue(
  clients: ClientLike[],
  tasks: Task[],
  options: { maxItems?: number; maxSafeNow?: number } = {},
): ActionQueueResult {
  const maxItems = options.maxItems ?? 6;
  const maxSafeNow = options.maxSafeNow ?? 5;

  const activeClients = clients.filter((c) => c.status === "active");
  const unassignedCount = activeClients.filter((c) => !c.primary_owner).length;

  const closingItems: ActionQueueItem[] = [];
  const safeNowItems: ActionQueueItem[] = [];

  for (const client of activeClients) {
    const window = getContactWindowStatus(
      client.timezone,
      client.business_hours,
      client.do_not_contact_before,
      client.do_not_contact_after,
    );
    const cc = getDefaultCc(client);
    const ccName = cc?.cc_alias ?? cc?.name?.split(" ")[0];
    const companyName = client.company_name?.trim() || "Unnamed client";
    const localTime = formatLocalTime(client.timezone);

    if (window.status === "closing") {
      const minutes =
        getMinutesUntilContactWindowClose(
          client.timezone,
          client.business_hours,
          client.do_not_contact_before,
          client.do_not_contact_after,
        ) ?? 60;
      closingItems.push({
        id: `closing-${client.id}`,
        clientId: client.id,
        companyName,
        reason: "closing_soon",
        badge: `Closing in ${minutes}m`,
        ccName,
        localTime,
        sortKey: minutes,
      });
    } else if (window.status === "open") {
      safeNowItems.push({
        id: `safe-${client.id}`,
        clientId: client.id,
        companyName,
        reason: "safe_now",
        badge: "Open now",
        ccName,
        phoneSnippet: phoneSnippet(cc?.phone),
        localTime,
      });
    }
  }

  closingItems.sort((a, b) => (a.sortKey ?? 999) - (b.sortKey ?? 999));

  safeNowItems.sort((a, b) => a.companyName.localeCompare(b.companyName));

  const overdueTasks = getOverdueTasks(tasks);
  const overdueItems: ActionQueueItem[] = overdueTasks.map((task) => {
    const client = activeClients.find((c) => c.id === task.client_id);
    const cc = client ? getDefaultCc(client) : undefined;
    return {
      id: `task-${task.id}`,
      clientId: task.client_id!,
      companyName:
        task.client?.company_name ??
        client?.company_name?.trim() ??
        "Unknown client",
      reason: "task_overdue" as const,
      badge: "Task overdue",
      ccName: cc?.cc_alias ?? cc?.name?.split(" ")[0],
      taskId: task.id,
      taskTitle: task.title,
    };
  });

  const prioritized = [
    ...closingItems,
    ...overdueItems,
    ...safeNowItems.slice(0, maxSafeNow),
  ];

  const totalActionable = prioritized.length;

  return {
    items: prioritized.slice(0, maxItems),
    totalActionable,
    unassignedCount,
    closingCount: closingItems.length,
    overdueTaskCount: overdueItems.length,
    safeNowCount: safeNowItems.length,
  };
}
