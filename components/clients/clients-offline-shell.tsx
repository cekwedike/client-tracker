"use client";

import { useEffect, useState } from "react";
import type { ClientWithRelations } from "@/lib/types";
import { loadClientsCache, saveClientsCache } from "@/lib/clients-cache";

interface ClientsOfflineShellProps {
  serverClients: ClientWithRelations[];
  children: (clients: ClientWithRelations[], isStale: boolean) => React.ReactNode;
}

export function ClientsOfflineShell({
  serverClients,
  children,
}: ClientsOfflineShellProps) {
  const [cachedClients] = useState<ClientWithRelations[]>(
    () => loadClientsCache() ?? [],
  );

  const displayClients =
    serverClients.length > 0 ? serverClients : cachedClients;
  const isStale = serverClients.length === 0 && cachedClients.length > 0;

  useEffect(() => {
    if (serverClients.length > 0) {
      saveClientsCache(serverClients);
    }
  }, [serverClients]);

  return (
    <>
      {isStale && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200/90">
          Showing cached clients — updating…
        </div>
      )}
      {children(displayClients, isStale)}
    </>
  );
}
