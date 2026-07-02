"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { MotionFadeUp } from "@/components/layout/motion";
import { Badge } from "@/components/ui/badge";
import type { ClientWithRelations } from "@/lib/types";
import { getContactWindowStatus } from "@/lib/timezone";
import { cn } from "@/lib/utils";

interface ContactWindowAlertsProps {
  clients: ClientWithRelations[];
}

export function ContactWindowAlerts({ clients }: ContactWindowAlertsProps) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  const groups = useMemo(() => {
    void tick;
    const outside: ClientWithRelations[] = [];
    const closing: ClientWithRelations[] = [];
    let safe = 0;

    for (const client of clients) {
      if (client.status !== "active") continue;
      const { status } = getContactWindowStatus(
        client.timezone,
        client.business_hours,
        client.do_not_contact_before,
        client.do_not_contact_after,
      );
      if (status === "open") safe++;
      else if (status === "closing") closing.push(client);
      else outside.push(client);
    }

    return { outside, closing, safe };
  }, [clients, tick]);

  const activeCount =
    groups.outside.length + groups.closing.length + groups.safe;

  if (activeCount === 0) return null;

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          Contact window alerts
        </h2>
        <p className="text-sm text-muted-foreground">
          Live status for active clients — updates every 30 seconds
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <AlertCard
          title="Outside window"
          count={groups.outside.length}
          tone="danger"
          icon={AlertTriangle}
          clients={groups.outside}
          emptyLabel="All clients in window or closing soon"
        />
        <AlertCard
          title="Closing within 60 min"
          count={groups.closing.length}
          tone="warning"
          icon={Clock}
          clients={groups.closing}
          emptyLabel="No clients closing soon"
        />
        <MotionFadeUp delay={0.1}>
          <div className="glass-panel gradient-border flex h-full flex-col p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400/90">
                  Safe to contact now
                </p>
                <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">
                  {groups.safe}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Active clients currently inside their contact window
            </p>
          </div>
        </MotionFadeUp>
      </div>
    </section>
  );
}

function AlertCard({
  title,
  count,
  tone,
  icon: Icon,
  clients,
  emptyLabel,
}: {
  title: string;
  count: number;
  tone: "danger" | "warning";
  icon: React.ComponentType<{ className?: string }>;
  clients: ClientWithRelations[];
  emptyLabel: string;
}) {
  const toneStyles =
    tone === "danger"
      ? {
          label: "text-red-300/90",
          icon: "bg-red-500/15 text-red-300",
          badge: "border-red-500/35 bg-red-500/15 text-red-300",
        }
      : {
          label: "text-amber-300/90",
          icon: "bg-amber-500/15 text-amber-300",
          badge: "border-amber-500/35 bg-amber-500/15 text-amber-300",
        };

  return (
    <MotionFadeUp>
      <div className="glass-panel gradient-border flex h-full flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p
              className={cn(
                "text-xs font-semibold uppercase tracking-wider",
                toneStyles.label,
              )}
            >
              {title}
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">
              {count}
            </p>
          </div>
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              toneStyles.icon,
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-3 flex flex-1 flex-col gap-1.5">
          {clients.length === 0 ? (
            <p className="text-xs text-muted-foreground">{emptyLabel}</p>
          ) : (
            clients.slice(0, 5).map((client) => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="flex items-center justify-between gap-2 rounded-md bg-muted/30 px-2 py-1.5 text-xs transition-colors hover:bg-muted/50"
              >
                <span className="min-w-0 truncate font-medium text-foreground">
                  {client.company_name}
                </span>
                <Badge variant="outline" className={cn("shrink-0 text-[10px]", toneStyles.badge)}>
                  {getContactWindowStatus(
                    client.timezone,
                    client.business_hours,
                    client.do_not_contact_before,
                    client.do_not_contact_after,
                  ).label}
                </Badge>
              </Link>
            ))
          )}
          {clients.length > 5 && (
            <p className="text-[10px] text-subtle">+{clients.length - 5} more</p>
          )}
        </div>
      </div>
    </MotionFadeUp>
  );
}
