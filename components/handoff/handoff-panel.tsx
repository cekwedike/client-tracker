"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ClipboardCopy, ExternalLink } from "lucide-react";
import { LocalTimeBadge } from "@/components/clients/local-time-badge";
import { usePinnedClients } from "@/components/clients/pin-button";
import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/clipboard";
import type { ClientDashboardSummary, ClientWithRelations, Profile, Task } from "@/lib/types";
import {
  compareClientsByContactWindow,
  getContactWindowStatus,
  getMinutesUntilContactWindowClose,
} from "@/lib/timezone";
import { toast } from "sonner";

type HandoffClient = ClientDashboardSummary | ClientWithRelations;

function buildHandoffMarkdown(options: {
  openNow: HandoffClient[];
  closingSoon: HandoffClient[];
  pinned: HandoffClient[];
  tasksByAssignee: Map<string, Task[]>;
  profiles: Profile[];
}): string {
  const lines: string[] = [
    `# Shift handoff — ${format(new Date(), "EEE MMM d, h:mm a")}`,
    "",
    "## Open now",
  ];

  if (options.openNow.length === 0) {
    lines.push("_No clients in contact window_");
  } else {
    for (const c of options.openNow) {
      lines.push(`- **${c.company_name}** (${c.primary_owner?.full_name ?? "Unassigned"})`);
    }
  }

  lines.push("", "## Closing in 2h");
  if (options.closingSoon.length === 0) {
    lines.push("_None_");
  } else {
    for (const c of options.closingSoon) {
      const mins = getMinutesUntilContactWindowClose(
        c.timezone,
        c.business_hours,
        c.do_not_contact_before,
        c.do_not_contact_after,
      );
      lines.push(`- **${c.company_name}** — ~${mins ?? "?"}m left`);
    }
  }

  lines.push("", "## Pinned");
  if (options.pinned.length === 0) {
    lines.push("_None_");
  } else {
    for (const c of options.pinned) {
      lines.push(`- ${c.company_name}`);
    }
  }

  lines.push("", "## Open tasks by assignee");
  if (options.tasksByAssignee.size === 0) {
    lines.push("_No open tasks_");
  } else {
    for (const [assigneeId, tasks] of options.tasksByAssignee) {
      const profile = options.profiles.find((p) => p.id === assigneeId);
      const name = profile?.full_name ?? profile?.email ?? "Unassigned";
      lines.push(`### ${name}`);
      for (const t of tasks) {
        const client = t.client?.company_name ? ` (${t.client.company_name})` : "";
        lines.push(`- [ ] ${t.title}${client}`);
      }
    }
  }

  return lines.join("\n");
}

export function HandoffPanel({
  clients,
  tasks,
  profiles,
}: {
  clients: HandoffClient[];
  tasks: Task[];
  profiles: Profile[];
}) {
  const { pinnedIds } = usePinnedClients();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  const active = useMemo(() => clients.filter((c) => c.status === "active"), [clients]);

  const { openNow, closingSoon, pinned } = useMemo(() => {
    void tick;
    const openNow: HandoffClient[] = [];
    const closingSoon: HandoffClient[] = [];

    for (const client of active) {
      const { status } = getContactWindowStatus(
        client.timezone,
        client.business_hours,
        client.do_not_contact_before,
        client.do_not_contact_after,
      );
      if (status === "open") openNow.push(client);
      if (status === "closing") {
        const mins = getMinutesUntilContactWindowClose(
          client.timezone,
          client.business_hours,
          client.do_not_contact_before,
          client.do_not_contact_after,
        );
        if (mins !== null && mins <= 120) closingSoon.push(client);
      }
    }

    const pinnedSet = new Set(pinnedIds);
    const pinnedClients = active.filter((c) => pinnedSet.has(c.id));

    return {
      openNow: openNow.sort(compareClientsByContactWindow),
      closingSoon: closingSoon.sort(compareClientsByContactWindow),
      pinned: pinnedClients,
    };
  }, [active, pinnedIds, tick]);

  const tasksByAssignee = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (task.status === "done") continue;
      const key = task.assignee_id ?? "unassigned";
      const list = map.get(key) ?? [];
      list.push(task);
      map.set(key, list);
    }
    return map;
  }, [tasks]);

  const markdown = buildHandoffMarkdown({
    openNow,
    closingSoon,
    pinned,
    tasksByAssignee,
    profiles,
  });

  const copyMarkdown = async () => {
    await copyToClipboard(markdown);
    toast.success("Handoff copied — paste into Slack");
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Shift summary for outbound handoffs — refreshed every minute
        </p>
        <Button onClick={copyMarkdown} className="gap-2">
          <ClipboardCopy className="h-4 w-4" />
          Export as Markdown
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <HandoffSection title="Open now" clients={openNow} />
        <HandoffSection title="Closing in 2h" clients={closingSoon} />
        <HandoffSection title="Pinned" clients={pinned} />
        <section className="glass-panel gradient-border p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Open tasks by assignee
          </h2>
          {tasksByAssignee.size === 0 ? (
            <p className="text-sm text-muted-foreground">No open tasks</p>
          ) : (
            <div className="space-y-4">
              {[...tasksByAssignee.entries()].map(([assigneeId, assigneeTasks]) => {
                const profile = profiles.find((p) => p.id === assigneeId);
                const name =
                  assigneeId === "unassigned"
                    ? "Unassigned"
                    : profile?.full_name ?? profile?.email ?? "Unknown";
                return (
                  <div key={assigneeId}>
                    <p className="text-sm font-medium text-foreground">{name}</p>
                    <ul className="mt-1 space-y-1">
                      {assigneeTasks.map((t) => (
                        <li key={t.id} className="text-sm text-muted-foreground">
                          {t.title}
                          {t.client?.company_name && (
                            <span className="text-primary"> · {t.client.company_name}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function HandoffSection({
  title,
  clients,
}: {
  title: string;
  clients: HandoffClient[];
}) {
  return (
    <section className="glass-panel gradient-border p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title} · {clients.length}
      </h2>
      {clients.length === 0 ? (
        <p className="text-sm text-muted-foreground">None</p>
      ) : (
        <ul className="space-y-3">
          {clients.map((client) => (
            <li
              key={client.id}
              className="rounded-lg border border-border/50 bg-muted/20 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/clients?client=${client.id}`}
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {client.company_name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {client.primary_owner?.full_name ?? "Unassigned"}
                  </p>
                </div>
                {client.smartlead_inbox_url && (
                  <a
                    href={client.smartlead_inbox_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
              <div className="mt-2">
                <LocalTimeBadge
                  timezone={client.timezone}
                  businessHours={client.business_hours}
                  doNotContactBefore={client.do_not_contact_before}
                  doNotContactAfter={client.do_not_contact_after}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
