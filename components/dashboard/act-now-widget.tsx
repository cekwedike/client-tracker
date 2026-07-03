"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ListTodo,
  UserX,
  Zap,
} from "lucide-react";
import { MotionFadeUp } from "@/components/layout/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  buildActionQueue,
  type ActionQueueItem,
  type ActionQueueReason,
} from "@/lib/client-health";
import type { ClientDashboardSummary, ClientWithRelations, Task } from "@/lib/types";
import { cn } from "@/lib/utils";

const REASON_STYLES: Record<
  ActionQueueReason,
  { badge: string; icon: React.ComponentType<{ className?: string }> }
> = {
  closing_soon: {
    badge: "border-amber-500/40 bg-amber-500/15 text-amber-300",
    icon: Clock,
  },
  task_overdue: {
    badge: "border-red-500/40 bg-red-500/15 text-red-300",
    icon: ListTodo,
  },
  safe_now: {
    badge: "border-emerald-500/40 bg-emerald-500/15 text-emerald-400",
    icon: CheckCircle2,
  },
};

function ActionRow({ item }: { item: ActionQueueItem }) {
  const style = REASON_STYLES[item.reason];
  const Icon = style.icon;

  return (
    <li>
      <Link
        href={`/clients?client=${item.clientId}`}
        className="group flex w-full items-start gap-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5 transition-colors hover:border-primary/30 hover:bg-primary/5"
      >
        <div
          className={cn(
            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
            item.reason === "closing_soon" && "bg-amber-500/15 text-amber-300",
            item.reason === "task_overdue" && "bg-red-500/15 text-red-300",
            item.reason === "safe_now" && "bg-emerald-500/15 text-emerald-400",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium text-[#E8E4DC] group-hover:text-primary">
              {item.companyName}
            </p>
            <Badge
              variant="outline"
              className={cn("text-[10px] font-semibold uppercase tracking-wide", style.badge)}
            >
              {item.badge}
            </Badge>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {item.reason === "task_overdue" && item.taskTitle
              ? item.taskTitle
              : [
                  item.ccName && `CC: ${item.ccName}`,
                  item.phoneSnippet,
                  item.localTime,
                ]
                  .filter(Boolean)
                  .join(" · ")}
          </p>
        </div>
        <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </Link>
    </li>
  );
}

export function ActNowWidget({
  clients,
  tasks,
}: {
  clients: ClientDashboardSummary[] | ClientWithRelations[];
  tasks: Task[];
}) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  const queue = useMemo(
    () => buildActionQueue(clients, tasks),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tick refreshes contact windows
    [clients, tasks, tick],
  );

  const hasQueue = queue.items.length > 0;
  const hasUnassigned = queue.unassignedCount > 0;
  const isClear = !hasQueue && !hasUnassigned;

  const viewAllHref =
    queue.overdueTaskCount > 0 && queue.closingCount === 0 && queue.safeNowCount === 0
      ? "/tasks"
      : "/clients";

  return (
    <MotionFadeUp>
      <div className="glass-panel gradient-border p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-semibold text-[#E8E4DC]">Act now</h2>
            {hasQueue && (
              <Badge
                variant="secondary"
                className="border-primary/30 bg-primary/10 text-primary"
              >
                {queue.totalActionable}
              </Badge>
            )}
          </div>
          {!isClear && queue.totalActionable > queue.items.length && (
            <Link href={viewAllHref}>
              <Button variant="outline" size="sm" className="gap-1.5 border-primary/25 text-xs">
                View all
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          )}
        </div>

        {isClear ? (
          <div className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <p className="text-sm text-muted-foreground">
              Queue clear — no closing windows, overdue tasks, or open contact slots
              need action right now.
            </p>
          </div>
        ) : (
          <>
            {hasQueue ? (
              <ul className="space-y-2">
                {queue.items.map((item) => (
                  <ActionRow key={item.id} item={item} />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No time-sensitive actions — assign owners below to improve coverage.
              </p>
            )}

            {hasUnassigned && (
              <Link
                href="/clients?status=active"
                className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-border/40 bg-[#0D0F12]/40 px-3 py-2 text-sm transition-colors hover:border-primary/25 hover:bg-muted/30"
              >
                <span className="flex items-center gap-2 text-muted-foreground">
                  <UserX className="h-3.5 w-3.5 text-amber-400/80" />
                  <span>
                    <span className="font-medium text-foreground">
                      {queue.unassignedCount}
                    </span>{" "}
                    client{queue.unassignedCount === 1 ? "" : "s"} unassigned
                  </span>
                </span>
                <span className="text-xs font-medium text-primary">
                  Bulk assign →
                </span>
              </Link>
            )}
          </>
        )}
      </div>
    </MotionFadeUp>
  );
}
