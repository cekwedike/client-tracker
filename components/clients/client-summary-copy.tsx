"use client";

import { CopyButton } from "@/components/ui/copy-button";
import { buildCcLeadBlock } from "@/lib/client-copy";
import type { ClientWithRelations } from "@/lib/types";
import { Mail, Phone, User } from "lucide-react";

interface ClientSummaryCopyFieldsProps {
  client: ClientWithRelations;
  ccContact?: ClientWithRelations["contacts"][number];
  displayEmail?: string | null;
  displayPhone?: string | null;
  location: string;
  kpi?: string | null;
}

export function ClientSummaryCopyFields({
  client,
  ccContact,
  displayEmail,
  displayPhone,
  location,
  kpi,
}: ClientSummaryCopyFieldsProps) {
  const ccName = ccContact?.cc_alias ?? ccContact?.name;
  const ccBlock = ccContact
    ? buildCcLeadBlock({
        ccName,
        ccEmail: ccContact.email,
        phone: displayPhone ?? ccContact.phone,
        companyName: client.company_name,
      })
    : "";

  return (
    <div className="space-y-2 text-sm">
      {client.primary_contact_name && (
        <div className="flex items-start gap-2">
          <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Primary Contact</p>
            <CopyFieldRow value={client.primary_contact_name} label="primary contact name">
              <p className="font-medium">{client.primary_contact_name}</p>
            </CopyFieldRow>
          </div>
        </div>
      )}

      {ccContact && (
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">CC in responses</p>
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
          {ccName && (
            <CopyFieldRow value={ccName} label="CC name">
              <p className="font-medium text-primary">{ccName}</p>
            </CopyFieldRow>
          )}
        </div>
      )}

      {displayEmail && (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
          <CopyFieldRow value={displayEmail} label="email" className="flex-1">
            <a
              href={`mailto:${displayEmail}`}
              className="truncate font-medium text-primary hover:underline"
            >
              {displayEmail}
            </a>
          </CopyFieldRow>
        </div>
      )}

      {displayPhone && (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
          <CopyFieldRow value={displayPhone} label="phone number" className="flex-1">
            <a
              href={`tel:${displayPhone.replace(/[^\d+]/g, "")}`}
              className="font-medium hover:text-primary"
            >
              {displayPhone}
            </a>
          </CopyFieldRow>
        </div>
      )}

      {client.company_name && (
        <CopyFieldRow value={client.company_name} label="company name">
          <div>
            <span className="text-muted-foreground">Company: </span>
            <span>{client.company_name}</span>
          </div>
        </CopyFieldRow>
      )}

      <div>
        <span className="text-muted-foreground">Location: </span>
        {location}
      </div>
      <div>
        <span className="text-muted-foreground">Industry: </span>
        {client.industry ?? "—"}
      </div>
      <div>
        <span className="text-muted-foreground">Owner: </span>
        {client.primary_owner?.full_name ?? "Unassigned"}
      </div>
      <div>
        <span className="text-muted-foreground">KPI Focus: </span>
        {kpi ?? "—"}
      </div>
    </div>
  );
}

function CopyFieldRow({
  value,
  label,
  children,
  className,
}: {
  value: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex min-w-0 items-center gap-1 ${className ?? ""}`}>
      <div className="min-w-0 flex-1">{children}</div>
      <CopyButton value={value} label={`Copy ${label}`} stopPropagation={false} />
    </div>
  );
}
