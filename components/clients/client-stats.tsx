import { Building2, Clock, Target, Users } from "lucide-react";
import type { ClientWithRelations } from "@/lib/types";
import { getTimezoneAbbreviation } from "@/lib/timezone";
import { cn } from "@/lib/utils";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/50 p-4 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
          {sub && <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            accent ?? "bg-emerald-500/10 text-emerald-400",
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

export function ClientStats({ clients }: { clients: ClientWithRelations[] }) {
  const ppl = clients.filter((c) => c.billing_model === "ppl").length;
  const ppm = clients.filter((c) => c.billing_model === "ppm").length;
  const active = clients.filter((c) => c.status === "active").length;

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
    <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total Clients"
        value={clients.length}
        sub={`${active} active`}
        icon={Building2}
      />
      <StatCard
        label="PPL Clients"
        value={ppl}
        sub="Pay-per-lead"
        icon={Target}
        accent="bg-blue-500/10 text-blue-400"
      />
      <StatCard
        label="PPM Clients"
        value={ppm}
        sub="Pay-per-meeting"
        icon={Users}
        accent="bg-purple-500/10 text-purple-400"
      />
      <StatCard
        label="Timezones"
        value={Object.keys(tzCounts).length}
        sub={tzSummary || "No clients"}
        icon={Clock}
      />
    </div>
  );
}
