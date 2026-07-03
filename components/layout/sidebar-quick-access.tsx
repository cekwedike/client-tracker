"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import {
  getPinnedClients,
  PINNED_CLIENTS_EVENT,
  type PinnedClient,
} from "@/lib/pinned-clients";
import { cn } from "@/lib/utils";

export function SidebarQuickAccess({ collapsed }: { collapsed: boolean }) {
  const [pinned, setPinned] = useState<PinnedClient[]>([]);

  useEffect(() => {
    const sync = () => setPinned(getPinnedClients());
    sync();
    window.addEventListener(PINNED_CLIENTS_EVENT, sync);
    return () => window.removeEventListener(PINNED_CLIENTS_EVENT, sync);
  }, []);

  if (pinned.length === 0) return null;

  return (
    <div className={cn("border-t border-sidebar-border py-3", collapsed ? "px-1" : "px-3")}>
      {!collapsed && (
        <p className="mb-1.5 flex items-center gap-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
          <Star className="h-3 w-3 fill-primary" />
          Pinned
        </p>
      )}
      <div className="space-y-0.5">
        {pinned.map((c) => (
          <Link
            key={c.id}
            href={`/clients?client=${c.id}`}
            title={c.company_name}
            className={cn(
              "block truncate rounded-md text-xs text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              collapsed ? "px-1 py-1.5 text-center" : "px-2 py-1",
            )}
          >
            {collapsed ? (
              <Star className="mx-auto h-3.5 w-3.5 fill-primary/80 text-primary" />
            ) : (
              c.company_name
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
