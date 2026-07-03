"use client";

import { useEffect, useState } from "react";
import { ClientsWorkspace } from "@/components/clients/clients-workspace";
import { loadClientsCache, saveClientsCache } from "@/lib/clients-cache";
import type {
  ClientWithRelations,
  MessageTemplate,
  Profile,
  Task,
  UserRole,
} from "@/lib/types";

interface ClientsOfflineShellProps {
  serverClients: ClientWithRelations[];
  initialClientId?: string | null;
  tasks?: Task[];
  profiles?: Profile[];
  templates?: MessageTemplate[];
  userRole?: UserRole;
}

export function ClientsOfflineShell({
  serverClients,
  initialClientId,
  tasks = [],
  profiles = [],
  templates = [],
  userRole = "operator",
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
      <ClientsWorkspace
        clients={displayClients}
        initialClientId={initialClientId}
        tasks={tasks}
        profiles={profiles}
        templates={templates}
        userRole={userRole}
      />
    </>
  );
}
