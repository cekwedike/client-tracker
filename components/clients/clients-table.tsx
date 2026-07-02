"use client";

import Link from "next/link";
import { BillingBadge, StatusBadge } from "@/components/clients/billing-badge";
import { LocalTimeBadge } from "@/components/clients/local-time-badge";
import { Badge } from "@/components/ui/badge";
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
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-emerald-500/20 bg-emerald-500/5 py-20 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
          <Building2 className="h-6 w-6 text-emerald-400" />
        </div>
        <p className="text-base font-medium">No clients yet</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Add your first client with Quick Add or import from the spreadsheet seed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {clients.map((client) => {
        const ccContact = getDefaultCcContact(client);
        const location = formatClientLocation(
          client.city,
          client.state_region,
          client.timezone,
        );
        const tzAbbr = getTimezoneAbbreviation(client.timezone);
        const companyName = client.company_name?.trim() || "Unnamed client";

        return (
          <Link
            key={client.id}
            href={`/clients/${client.id}`}
            className="group block rounded-xl border border-border/60 bg-card/40 p-4 transition-all hover:border-emerald-500/30 hover:bg-card/70 hover:shadow-[0_0_0_1px_rgba(16,185,129,0.08)]"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold tracking-tight text-foreground group-hover:text-emerald-400">
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
                        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-muted hover:text-foreground"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3 w-3" />
                        Inbox
                      </a>
                    </span>
                  )}
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {client.primary_contact_name && (
                    <span className="inline-flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 shrink-0 opacity-60" />
                      {client.primary_contact_name}
                    </span>
                  )}
                  {client.industry && (
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 shrink-0 opacity-60" />
                      {client.industry}
                    </span>
                  )}
                  <span>{location}</span>
                  <Badge variant="outline" className="text-[10px] font-normal">
                    {tzAbbr}
                  </Badge>
                </div>

                {ccContact && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3 shrink-0 opacity-60" />
                    <span>
                      CC as{" "}
                      <span className="font-medium text-emerald-400/90">
                        {ccContact.cc_alias ?? ccContact.name.split(" ")[0]}
                      </span>
                      {ccContact.email && (
                        <span className="text-muted-foreground/80"> · {ccContact.email}</span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-4 lg:gap-6">
                <div className="min-w-[140px]">
                  <LocalTimeBadge
                    timezone={client.timezone}
                    businessHours={client.business_hours}
                    doNotContactBefore={client.do_not_contact_before}
                    doNotContactAfter={client.do_not_contact_after}
                  />
                </div>

                <div className="hidden min-w-[100px] text-right text-sm sm:block">
                  {client.primary_owner?.full_name ? (
                    <span className="text-foreground">{client.primary_owner.full_name}</span>
                  ) : (
                    <span className="text-muted-foreground/60 italic">Unassigned</span>
                  )}
                </div>

                <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-emerald-400" />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
