"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { bulkExportCcBlocks } from "@/lib/actions/bulk";
import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/clipboard";
import { ClipboardCopy, X } from "lucide-react";

interface BulkActionsBarProps {
  selectedIds: string[];
  canExport: boolean;
  onClear: () => void;
}

export function BulkActionsBar({
  selectedIds,
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
