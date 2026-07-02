"use client";

import Link from "next/link";
import { BillingBadge, StatusBadge } from "@/components/clients/billing-badge";
import { LocalTimeBadge } from "@/components/clients/local-time-badge";
import { Badge } from "@/components/ui/badge";
import { MotionFadeUp } from "@/components/layout/motion";
import type { ClientWithRelations } from "@/lib/types";
import {
  formatClientLocation,
  getTimezoneAbbreviation,
} from "@/lib/timezone";
import {
  ArrowUpRight,
  Building2,
  ExternalLink,
  Mail,
  User,
} from "lucide-react";

function getDefaultCcContact(client: ClientWithRelations) {
  return (
    client.contacts.find((c) => c.is_default_cc) ??
    client.contacts.find((c) => c.role === "cc_manager") ??
    client.contacts[0]
  );
}

export function ClientsTable({ clients }: { clients: ClientWithRelations[] }) {
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
          {clients.length} client{clients.length === 1 ? "" : "s"}
        </p>
      </div>

      {clients.map((client, index) => {
        const ccContact = getDefaultCcContact(client);
        const location = formatClientLocation(
          client.city,
          client.state_region,
          client.timezone,
        );
        const tzAbbr = getTimezoneAbbreviation(client.timezone);
        const companyName = client.company_name?.trim() || "Unnamed client";

        return (
          <MotionFadeUp key={client.id} delay={index * 0.04}>
            <Link
              href={`/clients/${client.id}`}
              className="group block rounded-xl glass-panel gradient-border p-4 transition-all duration-200 hover:border-primary/25 hover:shadow-[0_8px_32px_oklch(0_0_0_/_30%)] sm:p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
                      {companyName}
                    </h3>
                    <BillingBadge model={client.billing_model} />
                    <StatusBadge status={client.status} />
                    {client.smartlead_inbox_url && (
                      <span
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                        onClick={(e) => e.preventDefault()}
                      >
                        <a
                          href={client.smartlead_inbox_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-primary/90 transition-colors hover:bg-primary/10 hover:text-primary"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3 w-3" />
                          Inbox
                        </a>
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                    {client.primary_contact_name && (
                      <span className="inline-flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                        <span className="text-foreground/90">{client.primary_contact_name}</span>
                      </span>
                    )}
                    {client.industry && (
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                        {client.industry}
                      </span>
                    )}
                    <span>{location}</span>
                    <Badge
                      variant="outline"
                      className="border-border/80 text-[10px] font-medium text-muted-foreground"
                    >
                      {tzAbbr}
                    </Badge>
                  </div>

                  {ccContact && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3 shrink-0 text-primary/70" />
                      <span>
                        CC as{" "}
                        <span className="font-medium text-primary">
                          {ccContact.cc_alias ?? ccContact.name.split(" ")[0]}
                        </span>
                        {ccContact.email && (
                          <span className="text-subtle"> · {ccContact.email}</span>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-4 border-t border-border/50 pt-4 lg:border-t-0 lg:pt-0 lg:pl-4">
                  <div className="min-w-[150px]">
                    <LocalTimeBadge
                      timezone={client.timezone}
                      businessHours={client.business_hours}
                      doNotContactBefore={client.do_not_contact_before}
                      doNotContactAfter={client.do_not_contact_after}
                    />
                  </div>

                  <div className="hidden min-w-[100px] text-right text-sm sm:block">
                    {client.primary_owner?.full_name ? (
                      <span className="font-medium text-foreground">
                        {client.primary_owner.full_name}
                      </span>
                    ) : (
                      <span className="italic text-subtle">Unassigned</span>
                    )}
                  </div>

                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                </div>
              </div>
            </Link>
          </MotionFadeUp>
        );
      })}
    </div>
  );
}
