"use client";

import { CopyButton } from "@/components/ui/copy-button";
import { buildResponseTemplate } from "@/lib/response-template";
import type { ClientWithRelations, Contact } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MessageSquareQuote } from "lucide-react";

interface ResponseTemplateSnippetProps {
  client: ClientWithRelations;
  ccContact?: Contact;
  compact?: boolean;
  className?: string;
}

export function ResponseTemplateSnippet({
  client,
  ccContact,
  compact = false,
  className,
}: ResponseTemplateSnippetProps) {
  const template = buildResponseTemplate(client, ccContact);

  if (compact) {
    return (
      <div
        className={cn("flex items-center gap-1", className)}
        onClick={(e) => e.stopPropagation()}
      >
        <CopyButton
          value={template}
          label="Copy response template"
          size="xs"
          buttonText="Template"
          showCopiedLabel
          showToast
          toastMessage="Response template copied"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-primary/20 bg-primary/5 p-3",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <MessageSquareQuote className="h-4 w-4 shrink-0 text-primary" />
          <p className="text-xs font-semibold uppercase tracking-wider text-primary/80">
            Lead response template
          </p>
        </div>
        <CopyButton
          value={template}
          label="Copy response template"
          size="sm"
          buttonText="Copy"
          showCopiedLabel
          showToast
          toastMessage="Response template copied"
        />
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground">{template}</p>
      <p className="mt-2 text-[10px] text-muted-foreground">
        Override with a line starting &quot;Response template:&quot; in internal notes
      </p>
    </div>
  );
}
