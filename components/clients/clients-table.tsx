"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BillingBadge, StatusBadge } from "@/components/clients/billing-badge";
import { LocalTimeBadge } from "@/components/clients/local-time-badge";
import { PinButton, usePinnedClients } from "@/components/clients/pin-button";
import { ClientHealthIndicator } from "@/components/clients/client-health-indicator";
import { Checkbox } from "@/components/ui/checkbox";
import { useSettings } from "@/components/providers/settings-provider";
import { MotionFadeUp } from "@/components/layout/motion";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { buildCcLeadBlock } from "@/lib/client-copy";
import {
  buildHealthContext,
  computeClientHealth,
} from "@/lib/client-health";
import { sortClientsWithPinned } from "@/lib/pinned-clients";
import type { ClientWithRelations, Task } from "@/lib/types";
import {
  compareClientsByContactWindow,
  formatClientLocation,
  getTimezoneAbbreviation,
} from "@/lib/timezone";
import { cn } from "@/lib/utils";
import {
  AtSign,
  Building2,
  ExternalLink,
  Mail,
  Phone,
  Star,
  User,
  UserCircle2,
} from "lucide-react";

function getDefaultCcContact(client: ClientWithRelations) {
  return (
    client.contacts.find((c) => c.is_default_cc) ??
    client.contacts.find((c) => c.role === "cc_manager") ??
    client.contacts[0]
  );
}

function getPrimaryPhone(
  client: ClientWithRelations,
  ccContact: ReturnType<typeof getDefaultCcContact>,
) {
  return (
    ccContact?.phone ?? client.contacts.find((c) => c.phone)?.phone ?? null
  );
}

function sortByContactWindow(clients: ClientWithRelations[]) {
  return [...clients].sort(compareClientsByContactWindow);
}

const ClientRow = memo(function ClientRow({
  client,
  index,
  compact,
  reduceMotion,
  selected,
  checked,
  health,
  onSelect,
  onToggleCheck,
}: {
  client: ClientWithRelations;
  index: number;
  compact: boolean;
  reduceMotion: boolean | null;
  selected: boolean;
  checked: boolean;
  health: ReturnType<typeof computeClientHealth>;
  onSelect: (client: ClientWithRelations) => void;
  onToggleCheck: (clientId: string) => void;
}) {
  const ccContact = getDefaultCcContact(client);
  const phone = getPrimaryPhone(client, ccContact);
  const ccName = ccContact?.cc_alias ?? ccContact?.name?.split(" ")[0];
  const ccEmail = ccContact?.email;
  const location = formatClientLocation(
    client.city,
    client.state_region,
    client.timezone,
  );
  const tzAbbr = getTimezoneAbbreviation(client.timezone);
  const companyName = client.company_name?.trim() || "Unnamed client";
  const ccBlock = ccContact
    ? buildCcLeadBlock({
        ccName,
        ccEmail,
        phone,
        companyName: client.company_name,
      })
    : "";
  const ownerName = client.primary_owner?.full_name ?? null;

  return (
    <MotionFadeUp key={client.id} delay={index * 0.04}>
      <motion.div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(client)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(client);
          }
        }}
        className={cn(
          "group block w-full cursor-pointer text-left",
          selected && "relative z-[1]",
        )}
        aria-pressed={selected}
      >
        <motion.div
          className={cn(
            "rounded-xl glass-panel gradient-border transition-all duration-200",
            "hover:border-primary/30 hover:shadow-[0_8px_32px_oklch(0_0_0_/_35%)]",
            selected &&
              "border-primary/45 shadow-[0_0_0_1px_oklch(0.72_0.14_85_/_25%),0_8px_32px_oklch(0_0_0_/_35%)] ring-1 ring-primary/20",
            compact ? "p-3 sm:p-4" : "p-4 sm:p-5",
          )}
          whileHover={
            reduceMotion
              ? undefined
              : { y: -2, transition: { duration: 0.2 } }
          }
        >
          <div className="mb-2 flex items-center gap-2">
            <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
              <Checkbox
                checked={checked}
                onCheckedChange={() => onToggleCheck(client.id)}
                aria-label={`Select ${companyName}`}
              />
            </span>
            <ClientHealthIndicator health={health} />
          </div>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-stretch xl:justify-between">
            <div className="min-w-0 xl:w-[28%]">
              <div className="flex flex-wrap items-center gap-2">
                <PinButton clientId={client.id} />
                <h3
                  className={cn(
                    "text-lg font-bold tracking-tight text-foreground transition-colors",
                    selected ? "text-primary" : "group-hover:text-primary",
                  )}
                >
                  {companyName}
                </h3>
                {client.company_name && (
                  <CopyButton
                    value={client.company_name}
                    label="Copy company name"
                  />
                )}
                <BillingBadge model={client.billing_model} />
                <StatusBadge status={client.status} />
              </div>
              {client.primary_contact_name && (
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <User className="h-3.5 w-3.5 shrink-0" />
                  <span className="min-w-0 truncate">{client.primary_contact_name}</span>
                  <CopyButton
                    value={client.primary_contact_name}
                    label="Copy primary contact name"
                  />
                </p>
              )}
              <p className="mt-1 flex items-center gap-1.5 text-xs text-subtle">
                <UserCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>{ownerName ?? "Unassigned"}</span>
              </p>
              <p className="mt-1 text-xs text-subtle">{location}</p>
              {client.smartlead_inbox_url && (
                <a
                  href={client.smartlead_inbox_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex min-h-11 items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3" />
                  Open inbox
                </a>
              )}
            </div>

            <div
              className={cn(
                "rounded-lg border border-primary/25 bg-primary/5 xl:w-[34%]",
                compact ? "p-3" : "p-4",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/80">
                  CC in positive responses
                </p>
                <div className="flex items-center gap-1">
                  {ccBlock && (
                    <CopyButton
                      value={ccBlock}
                      label="Copy CC block"
                      size="xs"
                      buttonText="Copy block"
                      showCopiedLabel
                      showToast
                      toastMessage="CC block copied"
                    />
                  )}
                </div>
              </div>
              {ccContact ? (
                <>
                  <div className="mt-1.5 flex items-center gap-1">
                    <p className="text-xl font-bold tracking-tight text-primary">
                      {ccName ?? "—"}
                    </p>
                    {ccName && (
                      <CopyButton value={ccName} label="Copy CC name" />
                    )}
                  </div>
                  <div className="mt-2 space-y-1.5">
                    <p className="flex items-center gap-2 text-sm">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                      {ccEmail ? (
                        <>
                          <a
                            href={`mailto:${ccEmail}`}
                            className="min-h-11 min-w-0 flex-1 truncate py-2 font-medium text-foreground hover:text-primary"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {ccEmail}
                          </a>
                          <CopyButton value={ccEmail} label="Copy CC email" />
                        </>
                      ) : (
                        <span className="italic text-subtle">No email on file</span>
                      )}
                    </p>
                    <p className="flex items-center gap-2 text-sm">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                      {phone ? (
                        <>
                          <a
                            href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                            className="min-h-11 min-w-0 flex-1 py-2 font-medium text-foreground hover:text-primary"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {phone}
                          </a>
                          <CopyButton value={phone} label="Copy phone number" />
                        </>
                      ) : (
                        <span className="italic text-subtle">No phone on file</span>
                      )}
                    </p>
                  </div>
                </>
              ) : (
                <p className="mt-2 text-sm italic text-subtle">No CC contact configured</p>
              )}
            </div>

            <div className="flex shrink-0 flex-col justify-between gap-3 border-t border-border/50 pt-4 xl:w-[26%] xl:border-t-0 xl:pt-0 xl:pl-2">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-primary/30 font-mono text-[10px] text-primary"
                  >
                    {tzAbbr}
                  </Badge>
                  <AtSign className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Local time</span>
                </div>
                <LocalTimeBadge
                  timezone={client.timezone}
                  businessHours={client.business_hours}
                  doNotContactBefore={client.do_not_contact_before}
                  doNotContactAfter={client.do_not_contact_after}
                />
              </div>
              <p
                className={cn(
                  "text-right text-xs transition-colors",
                  selected
                    ? "font-medium text-primary"
                    : "text-muted-foreground opacity-0 group-hover:opacity-100",
                )}
              >
                {selected ? "Details open" : "View details"}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </MotionFadeUp>
  );
});

export function ClientsTable({
  clients,
  tasks = [],
  selectedClientId,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onSelectClient,
}: {
  clients: ClientWithRelations[];
  tasks?: Task[];
  selectedClientId?: string | null;
  selectedIds?: Set<string>;
  onToggleSelect?: (clientId: string) => void;
  onToggleSelectAll?: (ids: string[]) => void;
  onSelectClient: (client: ClientWithRelations) => void;
}) {
  const { density } = useSettings();
  const reduceMotion = useReducedMotion();
  const compact = density === "compact";
  const { pinnedIds } = usePinnedClients();
  const [sortTick, setSortTick] = useState(0);
  const healthContext = useMemo(() => buildHealthContext(tasks), [tasks]);

  useEffect(() => {
    const interval = setInterval(() => setSortTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  const sortedClients = useMemo(() => {
    void sortTick;
    const { pinned: rawPinned, rest: rawRest } = sortClientsWithPinned(
      clients,
      pinnedIds,
    );
    return {
      pinned: sortByContactWindow(rawPinned),
      rest: sortByContactWindow(rawRest),
    };
  }, [clients, pinnedIds, sortTick]);

  const { pinned, rest } = sortedClients;
  const allIds = clients.map((c) => c.id);
  const selection = selectedIds ?? new Set<string>();

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/30 bg-primary/5 py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 shadow-inner">
          <Building2 className="h-7 w-7 text-primary" />
        </div>
        <p className="text-base font-semibold text-foreground">No clients yet</p>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Add your first client with Quick Add or import from the spreadsheet seed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {onToggleSelectAll && clients.length > 0 && (
        <div className="flex items-center gap-2 px-1">
          <Checkbox
            checked={allIds.length > 0 && allIds.every((id) => selection.has(id))}
            onCheckedChange={() => onToggleSelectAll(allIds)}
            aria-label="Select all clients"
          />
          <span className="text-xs text-muted-foreground">Select all</span>
        </div>
      )}
      {pinned.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Star className="h-3.5 w-3.5 fill-primary text-primary" />
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Pinned · {pinned.length}
            </p>
          </div>
          {pinned.map((client, index) => (
            <ClientRow
              key={client.id}
              client={client}
              index={index}
              compact={compact}
              reduceMotion={reduceMotion}
              selected={selectedClientId === client.id}
              checked={selection.has(client.id)}
              health={computeClientHealth(client, healthContext)}
              onSelect={onSelectClient}
              onToggleCheck={onToggleSelect ?? (() => {})}
            />
          ))}
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {rest.length} client{rest.length === 1 ? "" : "s"} · sorted by contact window
          </p>
        </div>
        {rest.map((client, index) => (
          <ClientRow
            key={client.id}
            client={client}
            index={index}
            compact={compact}
            reduceMotion={reduceMotion}
            selected={selectedClientId === client.id}
            checked={selection.has(client.id)}
            health={computeClientHealth(client, healthContext)}
            onSelect={onSelectClient}
            onToggleCheck={onToggleSelect ?? (() => {})}
          />
        ))}
      </section>
    </div>
  );
}
