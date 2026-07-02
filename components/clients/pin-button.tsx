"use client";

import { useCallback, useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getPinnedClientIds,
  PINNED_CLIENTS_EVENT,
  togglePinnedClient,
} from "@/lib/pinned-clients";
import { cn } from "@/lib/utils";

interface PinButtonProps {
  clientId: string;
  className?: string;
}

export function PinButton({ clientId, className }: PinButtonProps) {
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    setPinned(getPinnedClientIds().includes(clientId));
    const handler = () => {
      setPinned(getPinnedClientIds().includes(clientId));
    };
    window.addEventListener(PINNED_CLIENTS_EVENT, handler);
    return () => window.removeEventListener(PINNED_CLIENTS_EVENT, handler);
  }, [clientId]);

  const handleToggle = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const next = togglePinnedClient(clientId);
      setPinned(next.includes(clientId));
    },
    [clientId],
  );

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn(
        "min-h-11 min-w-11 shrink-0 text-muted-foreground hover:text-primary",
        pinned && "text-primary",
        className,
      )}
      onClick={handleToggle}
      aria-label={pinned ? "Unpin client" : "Pin client"}
      title={pinned ? "Unpin from favorites" : "Pin to favorites"}
    >
      <Star className={cn("size-4", pinned && "fill-current")} />
    </Button>
  );
}

export function usePinnedClients() {
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => setPinnedIds(getPinnedClientIds());
    sync();
    window.addEventListener(PINNED_CLIENTS_EVENT, sync);
    return () => window.removeEventListener(PINNED_CLIENTS_EVENT, sync);
  }, []);

  const refresh = useCallback(() => {
    setPinnedIds(getPinnedClientIds());
  }, []);

  return { pinnedIds, refresh };
}
