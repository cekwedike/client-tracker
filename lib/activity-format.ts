import type { ActivityLogEntry } from "@/lib/types";

export function formatActivityMessage(entry: ActivityLogEntry): string {
  const who = entry.user?.full_name ?? entry.user?.email ?? "Someone";
  const client = entry.client?.company_name;
  const d = entry.details;

  switch (entry.action) {
    case "owner_changed":
      return `${who} changed owner to ${String(d.new_owner_name ?? "Unassigned")}${client ? ` · ${client}` : ""}`;
    case "template_assigned":
      return `${who} assigned template "${String(d.template_name ?? "")}"${client ? ` to ${client}` : ""}`;
    case "task_created":
      return `${who} created task "${String(d.title ?? "")}"`;
    case "task_completed":
      return `${who} completed task "${String(d.title ?? "")}"`;
    case "note_added":
      return `${who} added a note${client ? ` on ${client}` : ""}`;
    case "client_edited":
      return `${who} updated ${client ?? "a client"}`;
    case "client_created":
      return `${who} created ${client ?? String(d.company_name ?? "a client")}`;
    case "bulk_action":
      return `${who} ran bulk action: ${String(d.action ?? "")} (${String(d.count ?? 0)} clients)`;
    default:
      return `${who}: ${entry.action}`;
  }
}
