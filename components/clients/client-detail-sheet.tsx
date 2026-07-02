"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { BillingBadge, StatusBadge } from "@/components/clients/billing-badge";
import { CCPlaybookPanel } from "@/components/clients/cc-playbook";
import { ActivityLogSection } from "@/components/clients/activity-log-section";
import { LocalTimeBadge } from "@/components/clients/local-time-badge";
import { ClientTemplatesPanel } from "@/components/templates/client-templates-panel";
import { getClientTemplates } from "@/lib/actions/templates";
import { buttonVariants } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { buildCcLeadBlock } from "@/lib/client-copy";
import type { ClientWithRelations, MessageTemplate } from "@/lib/types";
import { TIMEZONE_OPTIONS } from "@/lib/types";
import {
  formatClientLocation,
  formatLocalDateTime,
  getTimezoneAbbreviation,
} from "@/lib/timezone";
import {
  ExternalLink,
  Mail,
  Pencil,
  Phone,
  User,
  UserCircle2,
} from "lucide-react";

interface ClientDetailSheetProps {
  client: ClientWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getDefaultCcContact(client: ClientWithRelations) {
  return (
    client.contacts.find((c) => c.is_default_cc) ??
    client.contacts.find((c) => c.role === "cc_manager") ??
    client.contacts[0]
  );
}

export function ClientDetailSheet({
  client,
  open,
  onOpenChange,
}: ClientDetailSheetProps) {
  const reduceMotion = useReducedMotion();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);

  useEffect(() => {
    if (!client?.id || !open) return;
    let cancelled = false;
    getClientTemplates(client.id)
      .then((data) => {
        if (!cancelled) setTemplates(data);
      })
      .catch(() => {
        if (!cancelled) setTemplates([]);
      });
    return () => {
      cancelled = true;
    };
  }, [client?.id, open]);

  if (!client) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-md lg:max-w-lg" />
      </Sheet>
    );
  }

  const ccContact = getDefaultCcContact(client);
  const phone =
    ccContact?.phone ?? client.contacts.find((c) => c.phone)?.phone ?? null;
  const ccName = ccContact?.cc_alias ?? ccContact?.name?.split(" ")[0];
  const ccEmail = ccContact?.email;
  const location = formatClientLocation(
    client.city,
    client.state_region,
    client.timezone,
  );
  const tzAbbr = getTimezoneAbbreviation(client.timezone);
  const tzLabel =
    TIMEZONE_OPTIONS.find((t) => t.value === client.timezone)?.label ??
    client.timezone;
  const companyName = client.company_name?.trim() || "Unnamed client";
  const ccBlock = ccContact
    ? buildCcLeadBlock({
        ccName,
        ccEmail,
        phone,
        companyName: client.company_name,
      })
    : "";
  const ownerName = client.primary_owner?.full_name ?? "Unassigned";

  const sectionMotion = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.25 },
      };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md lg:max-w-lg"
      >
        <SheetHeader className="shrink-0 border-b border-border/60 bg-muted/20 px-5 py-4 pr-12">
          <div className="flex flex-wrap items-center gap-2">
            <SheetTitle className="text-xl font-bold tracking-tight">
              {companyName}
            </SheetTitle>
            {client.company_name && (
              <CopyButton value={client.company_name} label="Copy company name" />
            )}
          </div>
          <SheetDescription className="sr-only">
            Read-only client details for {companyName}
          </SheetDescription>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <BillingBadge model={client.billing_model} />
            <StatusBadge status={client.status} />
            <span className="rounded-md border border-primary/30 px-1.5 py-0.5 font-mono text-[10px] text-primary">
              {tzAbbr}
            </span>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <motion.div {...sectionMotion} className="space-y-5">
            <section>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Local time & contact window
              </p>
              <div className="mt-2">
                <LocalTimeBadge
                  timezone={client.timezone}
                  businessHours={client.business_hours}
                  doNotContactBefore={client.do_not_contact_before}
                  doNotContactAfter={client.do_not_contact_after}
                />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{tzLabel}</p>
              <p className="text-xs text-muted-foreground">
                {formatLocalDateTime(client.timezone)}
              </p>
            </section>

            <Separator />

            <section>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Primary contact
              </p>
              {client.primary_contact_name ? (
                <div className="mt-2 flex items-center gap-2">
                  <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <p className="font-medium">{client.primary_contact_name}</p>
                  <CopyButton
                    value={client.primary_contact_name}
                    label="Copy primary contact name"
                  />
                </div>
              ) : (
                <p className="mt-2 text-sm italic text-muted-foreground">
                  No primary contact on file
                </p>
              )}
            </section>

            <Separator />

            <section className="rounded-lg border border-primary/25 bg-primary/5 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/80">
                  CC in positive responses
                </p>
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
              {ccContact ? (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-1">
                    <p className="text-2xl font-bold tracking-tight text-primary">
                      {ccName ?? "—"}
                    </p>
                    {ccName && <CopyButton value={ccName} label="Copy CC name" />}
                  </div>
                  {ccEmail && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                      <a
                        href={`mailto:${ccEmail}`}
                        className="min-w-0 flex-1 truncate font-medium hover:text-primary"
                      >
                        {ccEmail}
                      </a>
                      <CopyButton value={ccEmail} label="Copy CC email" />
                    </div>
                  )}
                  {phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                      <a
                        href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                        className="font-medium hover:text-primary"
                      >
                        {phone}
                      </a>
                      <CopyButton value={phone} label="Copy phone number" />
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-sm italic text-muted-foreground">
                  No CC contact configured
                </p>
              )}
            </section>

            <Separator />

            <section>
              <ClientTemplatesPanel client={client} templates={templates} />
            </section>

            <Separator />

            <section>
              <CCPlaybookPanel contacts={client.contacts} />
            </section>

            <Separator />

            <ActivityLogSection clientId={client.id} />

            <Separator />

            <section className="space-y-2 text-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Details
              </p>
              <div className="flex items-center gap-2">
                <UserCircle2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">Owner:</span>
                <span className="font-medium">{ownerName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Location: </span>
                {location}
              </div>
              <div>
                <span className="text-muted-foreground">Industry: </span>
                {client.industry ?? "—"}
              </div>
              {client.smartlead_inbox_url && (
                <a
                  href={client.smartlead_inbox_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open inbox
                </a>
              )}
            </section>
          </motion.div>
        </div>

        <div className="shrink-0 border-t border-border/60 bg-muted/20 px-5 py-3">
          <div className="flex flex-wrap gap-2">
            {client.smartlead_inbox_url && (
              <a
                href={client.smartlead_inbox_url}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "default", size: "sm" })}
              >
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Open inbox
              </a>
            )}
            {ccBlock && (
              <CopyButton
                value={ccBlock}
                label="Copy CC block"
                size="sm"
                buttonText="Copy block"
                showCopiedLabel
                showToast
                toastMessage="CC block copied"
              />
            )}
            {phone && (
              <a
                href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <Phone className="mr-1.5 h-3.5 w-3.5" />
                Call
              </a>
            )}
            {ccEmail && (
              <a
                href={`mailto:${ccEmail}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <Mail className="mr-1.5 h-3.5 w-3.5" />
                Email
              </a>
            )}
            <Link
              href={`/clients/${client.id}/edit`}
              className={buttonVariants({ variant: "default", size: "sm", className: "ml-auto" })}
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
