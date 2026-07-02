"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildCCPlaybook } from "@/lib/timezone";
import type { Contact } from "@/lib/types";

export function CCPlaybookPanel({ contacts }: { contacts: Contact[] }) {
  const [copied, setCopied] = useState(false);
  const ccContacts = contacts.filter(
    (c) => c.role === "cc_manager" || c.is_default_cc,
  );
  const playbook = buildCCPlaybook(ccContacts.length > 0 ? ccContacts : contacts);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(playbook);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-emerald-500/20 bg-emerald-500/5">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">CC Playbook</CardTitle>
        <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 gap-1.5">
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted-foreground">
          {playbook}
        </pre>
        {ccContacts.map((contact) => (
          <div key={contact.id} className="mt-3 rounded-md border border-border/50 p-3 text-sm">
            <p className="font-medium">{contact.name}</p>
            {contact.cc_alias && (
              <p className="text-muted-foreground">
                Mention as: <span className="text-foreground">{contact.cc_alias}</span>
              </p>
            )}
            {contact.special_instructions && (
              <p className="mt-1 text-amber-400/90">{contact.special_instructions}</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
