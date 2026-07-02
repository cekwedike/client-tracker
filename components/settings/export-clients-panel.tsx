"use client";

import { useTransition } from "react";
import { Download } from "lucide-react";
import { exportAllClientsCsv } from "@/lib/actions/bulk";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ExportClientsPanel() {
  const [isPending, startTransition] = useTransition();

  const handleExport = () => {
    startTransition(async () => {
      try {
        const csv = await exportAllClientsCsv();
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `meridian-clients-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("CSV download started");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Export failed");
      }
    });
  };

  return (
    <div className="glass-panel gradient-border p-6">
      <h2 className="text-lg font-semibold text-foreground">Export all clients</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Download a CSV of every client and contact — useful for backups and audits.
      </p>
      <Button className="mt-4 gap-2" onClick={handleExport} disabled={isPending}>
        <Download className="h-4 w-4" />
        {isPending ? "Generating…" : "Export all clients CSV"}
      </Button>
    </div>
  );
}
