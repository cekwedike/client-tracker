"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { ClientHealthIndicator } from "@/components/clients/client-health-indicator";
import { MotionFadeUp } from "@/components/layout/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getClientsNeedingAttention,
  type ClientHealth,
} from "@/lib/client-health";
import type { ClientWithRelations, Task } from "@/lib/types";

export function NeedsAttentionWidget({
  clients,
  tasks,
  onOpenClient,
}: {
  clients: ClientWithRelations[];
  tasks: Task[];
  onOpenClient?: (clientId: string) => void;
}) {
  const attention = getClientsNeedingAttention(clients, tasks);

  if (attention.length === 0) {
    return (
      <MotionFadeUp>
        <div className="glass-panel gradient-border p-5">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-emerald-500" />
            <h2 className="text-lg font-semibold text-foreground">Needs attention</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            All active clients look healthy — no closing windows, overdue tasks, or unassigned owners.
          </p>
        </div>
      </MotionFadeUp>
    );
  }

  return (
    <MotionFadeUp>
      <div className="glass-panel gradient-border p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <h2 className="text-lg font-semibold text-foreground">Needs attention</h2>
            <Badge variant="secondary">{attention.length}</Badge>
          </div>
          <Link href="/clients">
            <Button variant="outline" size="sm">
              View clients
            </Button>
          </Link>
        </div>
        <ul className="space-y-2">
          {attention.slice(0, 8).map((client) => (
            <li key={client.id}>
              <button
                type="button"
                onClick={() => onOpenClient?.(client.id)}
                className="flex w-full items-start gap-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5 text-left transition-colors hover:border-primary/30 hover:bg-muted/40"
              >
                <ClientHealthIndicator health={client.health} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">
                    {client.company_name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {client.health.reasons.join(" · ")}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </MotionFadeUp>
  );
}

export function useClientHealthMap(clients: ClientWithRelations[], tasks: Task[]) {
  const attention = getClientsNeedingAttention(clients, tasks);
  return new Map<string, ClientHealth>(
    attention.map((c) => [c.id, c.health]),
  );
}
