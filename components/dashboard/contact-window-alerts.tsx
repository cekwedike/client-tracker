"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { MotionFadeUp } from "@/components/layout/motion";
import { LocalTimeBadge } from "@/components/clients/local-time-badge";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ClientDashboardSummary, ClientWithRelations } from "@/lib/types";
import { getContactWindowStatus } from "@/lib/timezone";
import { cn } from "@/lib/utils";

interface ContactWindowAlertsProps {
  clients: ClientDashboardSummary[] | ClientWithRelations[];
  onOpenClient?: (clientId: string) => void;
}

type AlertCategory = "outside" | "closing" | "safe";

function getDefaultCc(client: ClientDashboardSummary | ClientWithRelations) {
  return (
    client.contacts.find((c) => c.is_default_cc) ??
    client.contacts.find((c) => c.role === "cc_manager") ??
    client.contacts[0]
  );
}

function useContactWindowGroups(
  clients: (ClientDashboardSummary | ClientWithRelations)[],
  tick: number,
) {
  return useMemo(() => {
    void tick;
    const outside: (ClientDashboardSummary | ClientWithRelations)[] = [];
    const closing: (ClientDashboardSummary | ClientWithRelations)[] = [];
    const safe: (ClientDashboardSummary | ClientWithRelations)[] = [];

    for (const client of clients) {
      if (client.status !== "active") continue;
      const { status } = getContactWindowStatus(
        client.timezone,
        client.business_hours,
        client.do_not_contact_before,
        client.do_not_contact_after,
      );
      if (status === "open") safe.push(client);
      else if (status === "closing") closing.push(client);
      else outside.push(client);
    }

    return { outside, closing, safe };
  }, [clients, tick]);
}

export function ContactWindowAlerts({
  clients,
  onOpenClient,
}: ContactWindowAlertsProps) {
  const [tick, setTick] = useState(0);
  const [modalCategory, setModalCategory] = useState<AlertCategory | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  const groups = useContactWindowGroups(clients, tick);
  const activeCount =
    groups.outside.length + groups.closing.length + groups.safe.length;

  const modalClients = useMemo(() => {
    if (!modalCategory) return [];
    if (modalCategory === "outside") return groups.outside;
    if (modalCategory === "closing") return groups.closing;
    return groups.safe;
  }, [modalCategory, groups]);

  const modalTitle = useMemo(() => {
    if (modalCategory === "outside") return "Outside Contact Window";
    if (modalCategory === "closing") return "Closing Within 60 Minutes";
    return "Safe to Contact Now";
  }, [modalCategory]);

  if (activeCount === 0) return null;

  return (
    <>
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Contact Window Alerts
          </h2>
          <p className="text-sm text-muted-foreground">
            Live status for active clients — click a card for the full list
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <AlertCard
            title="Outside Window"
            count={groups.outside.length}
            tone="danger"
            icon={AlertTriangle}
            emptyLabel="All clients in window or closing soon"
            onClick={() => setModalCategory("outside")}
          />
          <AlertCard
            title="Closing Within 60 Minutes"
            count={groups.closing.length}
            tone="warning"
            icon={Clock}
            emptyLabel="No clients closing within 60 minutes"
            onClick={() => setModalCategory("closing")}
          />
          <AlertCard
            title="Safe to Contact Now"
            count={groups.safe.length}
            tone="safe"
            icon={CheckCircle2}
            emptyLabel="No clients currently in window"
            onClick={() => setModalCategory("safe")}
            delay={0.1}
          />
        </div>
      </section>

      <ContactWindowModal
        open={modalCategory !== null}
        onOpenChange={(open) => !open && setModalCategory(null)}
        title={modalTitle}
        clients={modalClients}
        onOpenClient={onOpenClient}
      />
    </>
  );
}

function AlertCard({
  title,
  count,
  tone,
  icon: Icon,
  emptyLabel,
  onClick,
  delay = 0,
}: {
  title: string;
  count: number;
  tone: "danger" | "warning" | "safe";
  icon: React.ComponentType<{ className?: string }>;
  emptyLabel: string;
  onClick: () => void;
  delay?: number;
}) {
  const toneStyles =
    tone === "danger"
      ? {
          label: "text-red-300/90",
          icon: "bg-red-500/15 text-red-300",
        }
      : tone === "warning"
        ? {
            label: "text-amber-300/90",
            icon: "bg-amber-500/15 text-amber-300",
          }
        : {
            label: "text-emerald-400/90",
            icon: "bg-emerald-500/15 text-emerald-400",
          };

  return (
    <MotionFadeUp delay={delay}>
      <button
        type="button"
        onClick={onClick}
        className="glass-panel gradient-border flex h-full w-full cursor-pointer flex-col p-4 text-left transition-all hover:border-primary/30 hover:shadow-[0_8px_32px_oklch(0_0_0_/_35%)]"
      >
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
        <p className="mt-3 text-xs text-muted-foreground">
          {count === 0 ? emptyLabel : "Click to view all clients →"}
        </p>
      </button>
    </MotionFadeUp>
  );
}

function ContactWindowModal({
  open,
  onOpenChange,
  title,
  clients,
  onOpenClient,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  clients: (ClientDashboardSummary | ClientWithRelations)[];
  onOpenClient?: (clientId: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {clients.length} active client{clients.length === 1 ? "" : "s"}
          </p>
        </DialogHeader>
        <div className="flex-1 space-y-2 overflow-y-auto pr-1">
          {clients.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No clients in this category
            </p>
          ) : (
            clients.map((client) => (
              <ClientAlertRow
                key={client.id}
                client={client}
                onOpenClient={onOpenClient}
                onClose={() => onOpenChange(false)}
              />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ClientAlertRow({
  client,
  onOpenClient,
  onClose,
}: {
  client: ClientDashboardSummary | ClientWithRelations;
  onOpenClient?: (clientId: string) => void;
  onClose: () => void;
}) {
  const cc = getDefaultCc(client);
  const windowStatus = getContactWindowStatus(
    client.timezone,
    client.business_hours,
    client.do_not_contact_before,
    client.do_not_contact_after,
  );

  const handleOpen = useCallback(() => {
    onClose();
    if (onOpenClient) {
      onOpenClient(client.id);
    }
  }, [client.id, onClose, onOpenClient]);

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">{client.company_name}</p>
            <CopyButton value={client.company_name} label="Copy company" size="xs" />
            <Badge variant="outline" className="text-[10px]">
              {windowStatus.label}
            </Badge>
          </div>
          {cc && (
            <p className="mt-1 text-sm text-muted-foreground">
              CC: {cc.cc_alias ?? cc.name}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {cc?.phone && (
              <span className="flex items-center gap-1">
                {cc.phone}
                <CopyButton value={cc.phone} label="Copy phone" size="xs" />
              </span>
            )}
            {cc?.email && (
              <span className="flex items-center gap-1">
                {cc.email}
                <CopyButton value={cc.email} label="Copy email" size="xs" />
              </span>
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
        </div>
        <div className="flex shrink-0 gap-1.5">
          {onOpenClient ? (
            <button
              type="button"
              onClick={handleOpen}
              className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
            >
              <ExternalLink className="h-3 w-3" />
              Open
            </button>
          ) : (
            <Link
              href={`/clients?client=${client.id}`}
              onClick={onClose}
              className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
            >
              <ExternalLink className="h-3 w-3" />
              Open
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
