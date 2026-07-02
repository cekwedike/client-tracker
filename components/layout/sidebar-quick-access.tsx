"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Star } from "lucide-react";
import {
  getPinnedClientIds,
  PINNED_CLIENTS_EVENT,
} from "@/lib/pinned-clients";
import {
  getRecentClientIds,
  RECENT_CLIENTS_EVENT,
} from "@/lib/recent-clients";
import type { ClientWithRelations } from "@/lib/types";

export function SidebarQuickAccess({
  clients,
}: {
  clients: { id: string; company_name: string }[];
}) {
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => {
      setPinnedIds(getPinnedClientIds());
      setRecentIds(getRecentClientIds());
    };
    sync();
    window.addEventListener(PINNED_CLIENTS_EVENT, sync);
    window.addEventListener(RECENT_CLIENTS_EVENT, sync);
    return () => {
      window.removeEventListener(PINNED_CLIENTS_EVENT, sync);
      window.removeEventListener(RECENT_CLIENTS_EVENT, sync);
    };
  }, []);

  const byId = new Map(clients.map((c) => [c.id, c]));
  const pinned = pinnedIds.map((id) => byId.get(id)).filter(Boolean);
  const recent = recentIds
    .filter((id) => !pinnedIds.includes(id))
    .map((id) => byId.get(id))
    .filter(Boolean)
    .slice(0, 5);

  if (pinned.length === 0 && recent.length === 0) return null;

  return (
    <div className="border-t border-sidebar-border px-3 py-3">
      {pinned.length > 0 && (
        <div className="mb-3">
          <p className="mb-1.5 flex items-center gap-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
            <Star className="h-3 w-3 fill-primary" />
            Pinned
          </p>
          <div className="space-y-0.5">
            {pinned.map((c) => (
              <Link
                key={c!.id}
                href={`/clients?client=${c!.id}`}
                className="block truncate rounded-md px-2 py-1 text-xs text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                {c!.company_name}
              </Link>
            ))}
          </div>
        </div>
      )}
      {recent.length > 0 && (
        <div>
          <p className="mb-1.5 flex items-center gap-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Clock className="h-3 w-3" />
            Recent
          </p>
          <div className="space-y-0.5">
            {recent.map((c) => (
              <Link
                key={c!.id}
                href={`/clients?client=${c!.id}`}
                className="block truncate rounded-md px-2 py-1 text-xs text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                {c!.company_name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
