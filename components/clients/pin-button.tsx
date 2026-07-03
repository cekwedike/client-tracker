"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getPinnedClientIds,
  PINNED_CLIENTS_EVENT,
  togglePinnedClient,
} from "@/lib/pinned-clients";
import { cn } from "@/lib/utils";

function subscribePinned(onChange: () => void) {
  window.addEventListener(PINNED_CLIENTS_EVENT, onChange);
  return () => window.removeEventListener(PINNED_CLIENTS_EVENT, onChange);
}

interface PinButtonProps {
  clientId: string;
  companyName: string;
  className?: string;
}

export function PinButton({ clientId, companyName, className }: PinButtonProps) {
  const pinned = useSyncExternalStore(
    subscribePinned,
    () => getPinnedClientIds().includes(clientId),
    () => false,
  );

  const handleToggle = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      togglePinnedClient(clientId, companyName);
    },
    [clientId, companyName],
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
  const pinnedKey = useSyncExternalStore(
    subscribePinned,
    () => getPinnedClientIds().join(","),
    () => "",
  );

  const pinnedIds = pinnedKey ? pinnedKey.split(",").filter(Boolean) : [];
  return { pinnedIds };
}
