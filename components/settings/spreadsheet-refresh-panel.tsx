"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  previewSpreadsheetDiff,
  refreshFromSpreadsheet,
} from "@/lib/actions/seed-refresh";
import type { SpreadsheetDiffResult } from "@/lib/seed/spreadsheet-diff";
import { MotionFadeUp } from "@/components/layout/motion";
import { Database, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function SpreadsheetRefreshPanel() {
  const [isPending, startTransition] = useTransition();
  const [diffOpen, setDiffOpen] = useState(false);
  const [diff, setDiff] = useState<SpreadsheetDiffResult | null>(null);

  const loadDiff = () => {
    startTransition(async () => {
      try {
        const result = await previewSpreadsheetDiff();
        setDiff(result);
        setDiffOpen(true);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load diff");
      }
    });
  };

  const applyRefresh = () => {
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
        setDiffOpen(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Refresh failed");
      }
    });
  };

  return (
    <>
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
                Preview changes before applying — phones, CC names, timezones, and new rows.
              </p>
              <Button
                className="mt-4 gap-2"
                onClick={loadDiff}
                disabled={isPending}
              >
                {isPending && !diffOpen ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Database className="h-4 w-4" />
                )}
                {isPending && !diffOpen ? "Loading diff…" : "Preview & refresh"}
              </Button>
            </div>
          </div>
        </div>
      </MotionFadeUp>

      <Dialog open={diffOpen} onOpenChange={setDiffOpen}>
        <DialogContent className="max-h-[80vh] overflow-hidden sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Spreadsheet diff preview</DialogTitle>
            <DialogDescription>
              Compare built-in seed data against the database before applying.
            </DialogDescription>
          </DialogHeader>
          {diff && (
            <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{diff.summary.insert} new</Badge>
                <Badge variant="secondary">{diff.summary.update} updates</Badge>
                <Badge variant="outline">{diff.summary.unchanged} unchanged</Badge>
              </div>
              {diff.changes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No changes detected.</p>
              ) : (
                diff.changes.map((change) => (
                  <div
                    key={change.company_name}
                    className="rounded-lg border border-border/60 bg-muted/20 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{change.company_name}</p>
                      <Badge
                        variant={change.type === "insert" ? "default" : "secondary"}
                        className="text-[10px] capitalize"
                      >
                        {change.type}
                      </Badge>
                    </div>
                    <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                      {change.changes.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiffOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyRefresh} disabled={isPending}>
              {isPending ? "Applying…" : "Confirm apply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
