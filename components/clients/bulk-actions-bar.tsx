"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  bulkAssignOwner,
  bulkAssignTemplate,
  bulkExportCcBlocks,
} from "@/lib/actions/bulk";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { copyToClipboard } from "@/lib/clipboard";
import type { MessageTemplate, Profile } from "@/lib/types";
import { ClipboardCopy, UserCircle2, FileText, X } from "lucide-react";

interface BulkActionsBarProps {
  selectedIds: string[];
  profiles: Profile[];
  templates: MessageTemplate[];
  canAssign: boolean;
  canExport: boolean;
  onClear: () => void;
}

export function BulkActionsBar({
  selectedIds,
  profiles,
  templates,
  canAssign,
  canExport,
  onClear,
}: BulkActionsBarProps) {
  const [isPending, startTransition] = useTransition();

  if (selectedIds.length === 0) return null;

  const run = (fn: () => Promise<void>) => {
    startTransition(async () => {
      try {
        await fn();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Bulk action failed");
      }
    });
  };

  return (
    <div className="sticky top-0 z-20 mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 shadow-lg backdrop-blur-sm">
      <span className="text-sm font-medium text-foreground">
        {selectedIds.length} selected
      </span>

      {canAssign && (
        <>
          <Select
            onValueChange={(ownerId) =>
              run(async () => {
                const id = typeof ownerId === "string" ? ownerId : null;
                await bulkAssignOwner(selectedIds, id || null);
                toast.success("Owners updated");
                onClear();
              })
            }
            disabled={isPending}
          >
            <SelectTrigger className="h-8 w-[160px] bg-background/80">
              <UserCircle2 className="mr-1.5 h-3.5 w-3.5" />
              <SelectValue placeholder="Assign owner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Unassigned</SelectItem>
              {profiles.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.full_name ?? p.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            onValueChange={(templateId) =>
              run(async () => {
                if (typeof templateId !== "string") return;
                await bulkAssignTemplate(selectedIds, templateId);
                toast.success("Templates assigned");
                onClear();
              })
            }
            disabled={isPending}
          >
            <SelectTrigger className="h-8 w-[160px] bg-background/80">
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              <SelectValue placeholder="Assign template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}

      {canExport && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 bg-background/80"
          disabled={isPending}
          onClick={() =>
            run(async () => {
              const text = await bulkExportCcBlocks(selectedIds);
              await copyToClipboard(text);
              toast.success("CC blocks copied to clipboard");
            })
          }
        >
          <ClipboardCopy className="h-3.5 w-3.5" />
          Export CC blocks
        </Button>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="ml-auto gap-1"
        onClick={onClear}
      >
        <X className="h-3.5 w-3.5" />
        Clear
      </Button>
    </div>
  );
}
