"use client";

import { useEffect, useState, useTransition } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { getClientActivity } from "@/lib/actions/activity";
import { formatActivityMessage } from "@/lib/activity-format";
import type { ActivityLogEntry } from "@/lib/types";

export function ActivityLogSection({ clientId }: { clientId: string }) {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      try {
        const data = await getClientActivity(clientId);
        setEntries(data);
      } catch {
        setEntries([]);
      }
    });
  }, [clientId]);

  return (
    <section>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Activity
      </p>
      {isPending && entries.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Loading activity…</p>
      ) : entries.length === 0 ? (
        <p className="mt-2 text-sm italic text-muted-foreground">No activity yet</p>
      ) : (
        <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto pr-1">
          {entries.map((entry) => (
            <li key={entry.id} className="rounded-md bg-muted/30 px-3 py-2 text-xs">
              <p className="text-foreground">{formatActivityMessage(entry)}</p>
              <p className="mt-0.5 text-muted-foreground">
                {formatDistanceToNow(parseISO(entry.created_at), { addSuffix: true })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
