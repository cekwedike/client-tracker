"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { BillingBadge, StatusBadge } from "@/components/clients/billing-badge";
import { LocalTimeBadge } from "@/components/clients/local-time-badge";
import { useSettings } from "@/components/providers/settings-provider";
import { MotionFadeUp } from "@/components/layout/motion";
import { Badge } from "@/components/ui/badge";
import type { ClientWithRelations } from "@/lib/types";
import {
  formatClientLocation,
  getTimezoneAbbreviation,
} from "@/lib/timezone";
import { cn } from "@/lib/utils";
import {
  ArrowUpRight,
  AtSign,
  Building2,
  ExternalLink,
  Mail,
  Phone,
  User,
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

export function ClientsTable({ clients }: { clients: ClientWithRelations[] }) {
  const { density } = useSettings();
  const reduceMotion = useReducedMotion();
  const compact = density === "compact";

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
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {clients.length} client{clients.length === 1 ? "" : "s"} · ops reference
        </p>
      </div>

      {clients.map((client, index) => {
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

        return (
          <MotionFadeUp key={client.id} delay={index * 0.04}>
            <Link href={`/clients/${client.id}`} className="group block">
              <motion.div
                className={cn(
                  "rounded-xl glass-panel gradient-border transition-all duration-200 hover:border-primary/30 hover:shadow-[0_8px_32px_oklch(0_0_0_/_35%)]",
                  compact ? "p-3 sm:p-4" : "p-4 sm:p-5",
                )}
                whileHover={
                  reduceMotion
                    ? undefined
                    : { y: -2, transition: { duration: 0.2 } }
                }
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-stretch xl:justify-between">
                  <div className="min-w-0 xl:w-[28%]">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                        {companyName}
                      </h3>
                      <BillingBadge model={client.billing_model} />
                      <StatusBadge status={client.status} />
                    </div>
                    {client.primary_contact_name && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <User className="h-3.5 w-3.5 shrink-0" />
                        <span>{client.primary_contact_name}</span>
                      </p>
                    )}
                    <p className="mt-1 text-xs text-subtle">{location}</p>
                    {client.smartlead_inbox_url && (
                      <a
                        href={client.smartlead_inbox_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-primary/90 transition-colors hover:text-primary"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3 w-3" />
                        Smartlead Inbox
                      </a>
                    )}
                  </div>

                  <div
                    className={cn(
                      "rounded-lg border border-primary/25 bg-primary/5 xl:w-[34%]",
                      compact ? "p-3" : "p-4",
                    )}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/80">
                      CC in positive responses
                    </p>
                    {ccContact ? (
                      <>
                        <p className="mt-1.5 text-xl font-bold tracking-tight text-primary">
                          {ccName ?? "—"}
                        </p>
                        <div className="mt-2 space-y-1.5">
                          {ccEmail && (
                            <p className="flex items-center gap-2 text-sm text-foreground/90">
                              <Mail className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                              <span className="truncate">{ccEmail}</span>
                            </p>
                          )}
                          <p className="flex items-center gap-2 text-sm">
                            <Phone className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                            {phone ? (
                              <a
                                href={`tel:${phone.replace(/\s/g, "")}`}
                                className="font-medium text-foreground hover:text-primary"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {phone}
                              </a>
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
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                        View details
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          </MotionFadeUp>
        );
      })}
    </div>
  );
}
