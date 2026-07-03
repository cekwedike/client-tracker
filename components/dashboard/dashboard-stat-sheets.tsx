"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  BillingBadge,
  StatusBadge,
  TierBadge,
} from "@/components/clients/billing-badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  updateClientBillingModel,
  updateClientHandledBy,
  updateClientTier,
} from "@/lib/actions/clients";
import type {
  BillingModel,
  ClientDashboardSummary,
  ClientStatus,
  ClientTier,
  Profile,
} from "@/lib/types";
import {
  formatLocalDateTime,
  getTimezoneAbbreviation,
  getTimezoneRegion,
} from "@/lib/timezone";
import { cn } from "@/lib/utils";

export type DashboardStatPanel = "total" | "ppl" | "ppm" | "timezones" | null;

type TotalFilter = "all" | ClientTier | ClientStatus;

interface DashboardStatSheetsProps {
  panel: DashboardStatPanel;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: ClientDashboardSummary[];
  profiles: Profile[];
}

const PANEL_META: Record<
  Exclude<DashboardStatPanel, null>,
  { title: string; description: string }
> = {
  total: {
    title: "All Clients",
    description: "Client tier, status, and handler assignments",
  },
  ppl: {
    title: "PPL Clients",
    description: "Review and reassign pay-per-lead accounts",
  },
  ppm: {
    title: "PPM Clients",
    description: "Review and reassign pay-per-meeting accounts",
  },
  timezones: {
    title: "Timezone Coverage",
    description: "All clients with local time by region",
  },
};

export function DashboardStatSheets({
  panel,
  open,
  onOpenChange,
  clients,
  profiles,
}: DashboardStatSheetsProps) {
  const [totalFilter, setTotalFilter] = useState<TotalFilter>("all");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (panel !== "timezones" || !open) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [panel, open]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setTotalFilter("all");
    onOpenChange(nextOpen);
  };

  const filteredClients = useMemo(() => {
    if (!panel) return [];

    let list = [...clients];

    if (panel === "ppl") {
      list = list.filter((c) => c.billing_model === "ppl");
    } else if (panel === "ppm") {
      list = list.filter((c) => c.billing_model === "ppm");
    } else if (panel === "total" && totalFilter !== "all") {
      if (totalFilter === "trial" || totalFilter === "full") {
        list = list.filter((c) => (c.client_tier ?? "full") === totalFilter);
      } else {
        list = list.filter((c) => c.status === totalFilter);
      }
    }

    if (panel === "timezones") {
      list.sort((a, b) => {
        const tzCompare = a.timezone.localeCompare(b.timezone);
        if (tzCompare !== 0) return tzCompare;
        return a.company_name.localeCompare(b.company_name);
      });
    } else {
      list.sort((a, b) => a.company_name.localeCompare(b.company_name));
    }

    void tick;
    return list;
  }, [clients, panel, totalFilter, tick]);

  const meta = panel ? PANEL_META[panel] : null;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md lg:max-w-xl"
      >
        {meta && (
          <>
            <SheetHeader className="shrink-0 border-b border-border/60 bg-muted/20 px-5 py-4 pr-12">
              <SheetTitle className="text-xl font-bold tracking-tight">
                {meta.title}
              </SheetTitle>
              <SheetDescription>{meta.description}</SheetDescription>
              <p className="text-xs text-muted-foreground">
                {filteredClients.length} client
                {filteredClients.length === 1 ? "" : "s"}
              </p>
            </SheetHeader>

            {panel === "total" && (
              <div className="shrink-0 border-b border-border/60 px-5 py-3">
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      ["all", "All"],
                      ["trial", "Trial"],
                      ["full", "Full"],
                      ["active", "Active"],
                      ["paused", "Paused"],
                      ["churned", "Churned"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTotalFilter(value)}
                      className={cn(
                        "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                        totalFilter === value
                          ? "border-primary/40 bg-primary/15 text-primary"
                          : "border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 space-y-2 overflow-y-auto px-5 py-4">
              {filteredClients.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  No clients in this view
                </p>
              ) : panel === "timezones" ? (
                filteredClients.map((client) => (
                  <TimezoneClientRow key={client.id} client={client} />
                ))
              ) : (
                filteredClients.map((client) => (
                  <AssignmentClientRow
                    key={client.id}
                    client={client}
                    profiles={profiles}
                    showBilling={panel === "total" || panel === "ppl" || panel === "ppm"}
                    showTier={panel === "total"}
                    allowBillingChange={panel === "ppl" || panel === "ppm" || panel === "total"}
                  />
                ))
              )}
            </div>

            <div className="shrink-0 border-t border-border/60 bg-muted/20 px-5 py-3">
              <Link
                href="/clients"
                className={buttonVariants({ variant: "outline", size: "sm", className: "w-full" })}
                onClick={() => onOpenChange(false)}
              >
                Open Client Ops
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function TimezoneClientRow({ client }: { client: ClientDashboardSummary }) {
  const abbr = getTimezoneAbbreviation(client.timezone);
  const region = getTimezoneRegion(client.timezone);

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{client.company_name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{region}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] text-primary">
              {abbr}
            </span>
            <BillingBadge model={client.billing_model} />
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-sm font-semibold tabular-nums text-primary">
            {formatLocalDateTime(client.timezone).split(" · ")[1]}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {formatLocalDateTime(client.timezone).split(" · ")[0]}
          </p>
        </div>
      </div>
    </div>
  );
}

function AssignmentClientRow({
  client,
  profiles,
  showBilling,
  showTier,
  allowBillingChange,
}: {
  client: ClientDashboardSummary;
  profiles: Profile[];
  showBilling: boolean;
  showTier: boolean;
  allowBillingChange: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const tier = client.client_tier ?? "full";
  const handlerId = client.handled_by_id ?? client.handled_by?.id ?? null;

  const runUpdate = (action: () => Promise<unknown>, success: string) => {
    startTransition(async () => {
      try {
        await action();
        toast.success(success);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Update failed");
      }
    });
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-muted/20 p-3",
        isPending && "opacity-70",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">{client.company_name}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {showBilling && <BillingBadge model={client.billing_model} />}
            {showTier && <TierBadge tier={tier} />}
            <StatusBadge status={client.status} />
          </div>
        </div>
        <Link
          href={`/clients?client=${client.id}`}
          className={buttonVariants({ variant: "ghost", size: "xs" })}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {allowBillingChange && (
          <Field label="Deal type">
            <Select
              value={client.billing_model}
              onValueChange={(value) => {
                if (!value || value === client.billing_model) return;
                runUpdate(
                  () => updateClientBillingModel(client.id, value as BillingModel),
                  `Moved to ${value.toUpperCase()}`,
                );
              }}
              disabled={isPending}
            >
              <SelectTrigger className="h-8 w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ppl">Pay-per-Lead (PPL)</SelectItem>
                <SelectItem value="ppm">Pay-per-Meeting (PPM)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        )}

        {showTier && (
          <Field label="Client tier">
            <Select
              value={tier}
              onValueChange={(value) => {
                if (!value || value === tier) return;
                runUpdate(
                  () => updateClientTier(client.id, value as ClientTier),
                  `Set to ${value === "trial" ? "trial" : "full client"}`,
                );
              }}
              disabled={isPending}
            >
              <SelectTrigger className="h-8 w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="full">Full Client</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        )}

        <Field label="Handled by" className={showTier && allowBillingChange ? "sm:col-span-2" : ""}>
          <Select
            value={handlerId ?? ""}
            onValueChange={(value) => {
              const nextId = value || null;
              if (nextId === handlerId) return;
              runUpdate(
                () => updateClientHandledBy(client.id, nextId),
                nextId ? "Handler updated" : "Handler cleared",
              );
            }}
            disabled={isPending}
          >
            <SelectTrigger className="h-8 w-full text-xs">
              <SelectValue placeholder="Unassigned">
                {client.handled_by?.full_name ?? "Unassigned"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Unassigned</SelectItem>
              {profiles.map((profile) => (
                <SelectItem key={profile.id} value={profile.id}>
                  {profile.full_name ?? profile.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}
