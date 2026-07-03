"use client";

import { useState } from "react";
import { Building2, Clock, Target, Users } from "lucide-react";
import {
  DashboardStatSheets,
  type DashboardStatPanel,
} from "@/components/dashboard/dashboard-stat-sheets";
import type { ClientDashboardSummary, ClientWithRelations, Profile } from "@/lib/types";
import { getTimezoneAbbreviation } from "@/lib/timezone";
import { cn } from "@/lib/utils";
import { MotionCard, MotionStagger } from "@/components/layout/motion";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  index,
  onClick,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
  index: number;
  onClick?: () => void;
}) {
  const Wrapper = onClick ? "button" : "div";

  return (
    <MotionCard index={index}>
      <Wrapper
        type={onClick ? "button" : undefined}
        onClick={onClick}
        className={cn(
          "glass-panel gradient-border group relative w-full overflow-hidden p-5 text-left transition-shadow hover:shadow-[0_8px_32px_oklch(0_0_0_/_35%)]",
          onClick && "cursor-pointer hover:border-primary/30",
        )}
      >
        <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/5 blur-2xl transition-opacity group-hover:opacity-100" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-foreground">
              {value}
            </p>
            {sub && (
              <p className="mt-1 truncate text-xs leading-relaxed text-subtle">{sub}</p>
            )}
            {onClick && (
              <p className="mt-2 text-[10px] text-muted-foreground">
                Click to view & reassign →
              </p>
            )}
          </div>
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-inner",
              accent ?? "bg-primary/15 text-primary",
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </Wrapper>
    </MotionCard>
  );
}

export function ClientStats({
  clients,
  profiles = [],
}: {
  clients: ClientDashboardSummary[] | ClientWithRelations[];
  profiles?: Profile[];
}) {
  const [panel, setPanel] = useState<DashboardStatPanel>(null);

  const ppl = clients.filter((c) => c.billing_model === "ppl").length;
  const ppm = clients.filter((c) => c.billing_model === "ppm").length;
  const active = clients.filter((c) => c.status === "active").length;
  const trial = clients.filter((c) => (c.client_tier ?? "full") === "trial").length;

  const tzCounts = clients.reduce<Record<string, number>>((acc, c) => {
    const abbr = getTimezoneAbbreviation(c.timezone);
    acc[abbr] = (acc[abbr] ?? 0) + 1;
    return acc;
  }, {});
  const tzSummary = Object.entries(tzCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([tz, n]) => `${tz} ${n}`)
    .join(" · ");

  return (
    <>
      <MotionStagger className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Clients"
          value={clients.length}
          sub={`${active} active · ${trial} trial`}
          icon={Building2}
          index={0}
          onClick={() => setPanel("total")}
        />
        <StatCard
          label="PPL Clients"
          value={ppl}
          sub="Pay-per-lead"
          icon={Target}
          accent="bg-deal-ppl/15 text-deal-ppl-fg"
          index={1}
          onClick={() => setPanel("ppl")}
        />
        <StatCard
          label="PPM Clients"
          value={ppm}
          sub="Pay-per-meeting"
          icon={Users}
          accent="bg-deal-ppm/15 text-deal-ppm-fg"
          index={2}
          onClick={() => setPanel("ppm")}
        />
        <StatCard
          label="Timezones"
          value={Object.keys(tzCounts).length}
          sub={tzSummary || "No clients"}
          icon={Clock}
          index={3}
          onClick={() => setPanel("timezones")}
        />
      </MotionStagger>

      <DashboardStatSheets
        panel={panel}
        open={panel !== null}
        onOpenChange={(open) => !open && setPanel(null)}
        clients={clients as ClientDashboardSummary[]}
        profiles={profiles}
      />
    </>
  );
}
