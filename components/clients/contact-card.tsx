"use client";

import { CopyButton } from "@/components/ui/copy-button";
import type { Contact } from "@/lib/types";

export function ContactCard({ contact }: { contact: Contact }) {
  return (
    <div className="rounded-lg border border-border/50 p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium">{contact.name}</p>
          <p className="text-xs capitalize text-muted-foreground">
            {contact.role.replace("_", " ")}
          </p>
        </div>
        <CopyButton
          value={[
            contact.name,
            contact.email,
            contact.phone,
            contact.cc_alias ? `Mention as: ${contact.cc_alias}` : null,
          ]
            .filter(Boolean)
            .join("\n")}
          label="Copy contact details"
          size="icon-sm"
        />
      </div>

      {contact.email && (
        <div className="mt-1 flex min-w-0 items-center gap-1">
          <a
            href={`mailto:${contact.email}`}
            className="min-w-0 flex-1 truncate text-primary hover:underline"
          >
            {contact.email}
          </a>
          <CopyButton value={contact.email} label="Copy email" />
        </div>
      )}

      {contact.phone && (
        <div className="flex min-w-0 items-center gap-1">
          <a
            href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
            className="min-w-0 flex-1 text-muted-foreground hover:text-foreground"
          >
            {contact.phone}
          </a>
          <CopyButton value={contact.phone} label="Copy phone number" />
        </div>
      )}

      {contact.cc_alias && (
        <div className="mt-1 flex min-w-0 items-center gap-1 text-primary">
          <span className="min-w-0 flex-1">Mention as: {contact.cc_alias}</span>
          <CopyButton value={contact.cc_alias} label="Copy CC alias" />
        </div>
      )}

      {contact.special_instructions && (
        <div className="mt-2 flex min-w-0 items-start gap-1 text-xs text-amber-400/90">
          <p className="min-w-0 flex-1">{contact.special_instructions}</p>
          <CopyButton
            value={contact.special_instructions}
            label="Copy special instructions"
            className="mt-0.5"
          />
        </div>
      )}
    </div>
  );
}
