"use client";

import { renderTemplateBody } from "@/lib/template-placeholders";
import type { ClientWithRelations, MessageTemplate } from "@/lib/types";
import { CopyButton } from "@/components/ui/copy-button";
import { FileText } from "lucide-react";

export function ClientTemplatesPanel({
  client,
  templates,
}: {
  client: ClientWithRelations;
  templates: MessageTemplate[];
}) {
  if (templates.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 p-4 text-center">
        <FileText className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          No templates assigned — add them on the{" "}
          <a href="/templates" className="text-primary hover:underline">
            Templates
          </a>{" "}
          page
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Message templates
      </p>
      {templates.map((template) => {
        const rendered = renderTemplateBody(template.body, client);
        return (
          <div
            key={template.id}
            className="rounded-lg border border-primary/20 bg-primary/5 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-semibold text-primary">{template.name}</p>
              <CopyButton
                value={rendered}
                label={`Copy ${template.name}`}
                size="xs"
                buttonText="Copy"
                showCopiedLabel
                showToast
                toastMessage={`${template.name} copied`}
              />
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground">{rendered}</p>
          </div>
        );
      })}
    </div>
  );
}
