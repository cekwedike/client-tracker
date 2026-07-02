"use client";

import { formatDistanceToNow, parseISO } from "date-fns";
import { Activity } from "lucide-react";
import { formatActivityMessage } from "@/lib/activity-format";
import type { ActivityLogEntry } from "@/lib/types";
import { MotionFadeUp } from "@/components/layout/motion";

export function RecentActivityFeed({ entries }: { entries: ActivityLogEntry[] }) {
  return (
    <MotionFadeUp delay={0.06}>
      <div className="glass-panel gradient-border p-5">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Recent activity</h2>
        </div>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Team actions will appear here — owner changes, tasks, notes, and edits.
          </p>
        ) : (
          <ul className="space-y-3">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="border-l-2 border-primary/30 pl-3 text-sm"
              >
                <p className="text-foreground">{formatActivityMessage(entry)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDistanceToNow(parseISO(entry.created_at), { addSuffix: true })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </MotionFadeUp>
  );
}
