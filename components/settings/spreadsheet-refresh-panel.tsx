"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { refreshFromSpreadsheet } from "@/lib/actions/seed-refresh";
import { MotionFadeUp } from "@/components/layout/motion";
import { Database, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function SpreadsheetRefreshPanel() {
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const result = await refreshFromSpreadsheet();
        const summary = `${result.updated} updated, ${result.inserted} inserted, ${result.skipped} skipped`;
        if (result.errors.length > 0) {
          toast.warning(`Refresh completed with errors: ${summary}`, {
            description: result.errors.slice(0, 3).join("; "),
          });
        } else {
          toast.success(`Spreadsheet refresh complete: ${summary}`);
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Refresh failed");
      }
    });
  };

  return (
    <MotionFadeUp delay={0.14}>
      <div className="glass-panel gradient-border p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Database className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-foreground">
              Admin: Refresh from spreadsheet
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Re-sync client and CC contact data from the built-in spreadsheet
              seed. Existing clients are updated in place; new rows are inserted.
            </p>
            <Button
              className="mt-4 gap-2"
              onClick={handleRefresh}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              {isPending ? "Refreshing…" : "Refresh from spreadsheet"}
            </Button>
          </div>
        </div>
      </div>
    </MotionFadeUp>
  );
}
