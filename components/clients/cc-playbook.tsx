"use client";

import { CopyButton } from "@/components/ui/copy-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildCCPlaybook } from "@/lib/timezone";
import type { Contact } from "@/lib/types";

export function CCPlaybookPanel({ contacts }: { contacts: Contact[] }) {
  const ccContacts = contacts.filter(
    (c) => c.role === "cc_manager" || c.is_default_cc,
  );
  const playbook = buildCCPlaybook(ccContacts.length > 0 ? ccContacts : contacts);

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">CC Playbook</CardTitle>
        <CopyButton
          value={playbook}
          label="Copy CC playbook"
          buttonText="Copy"
          size="sm"
          showCopiedLabel
          showToast
          toastMessage="CC playbook copied"
        />
      </CardHeader>
      <CardContent>
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted-foreground">
          {playbook}
        </pre>
        {ccContacts.map((contact) => (
          <div key={contact.id} className="mt-3 rounded-md border border-border/50 p-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium">{contact.name}</p>
              <CopyButton
                value={[
                  contact.name,
                  contact.cc_alias ? `Mention as: ${contact.cc_alias}` : null,
                  contact.email,
                  contact.special_instructions,
                ]
                  .filter(Boolean)
                  .join("\n")}
                label={`Copy ${contact.name} details`}
              />
            </div>
            {contact.cc_alias && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <span>
                  Mention as: <span className="text-foreground">{contact.cc_alias}</span>
                </span>
                <CopyButton value={contact.cc_alias} label="Copy CC alias" />
              </div>
            )}
            {contact.special_instructions && (
              <div className="mt-1 flex items-start gap-1 text-amber-400/90">
                <p className="min-w-0 flex-1">{contact.special_instructions}</p>
                <CopyButton
                  value={contact.special_instructions}
                  label="Copy special instructions"
                  className="mt-0.5"
                />
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
