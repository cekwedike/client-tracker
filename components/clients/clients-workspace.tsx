"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BulkActionsBar } from "@/components/clients/bulk-actions-bar";
import { ClientDetailSheet } from "@/components/clients/client-detail-sheet";
import { ClientsTable } from "@/components/clients/clients-table";
import { ClientFilters } from "@/components/clients/client-filters";
import {
  KeyboardShortcutsModal,
  useClientKeyboardShortcuts,
} from "@/components/clients/keyboard-shortcuts-modal";
import { canExportClients } from "@/lib/permissions";
import type { ClientWithRelations, Task, UserRole } from "@/lib/types";

interface ClientsWorkspaceProps {
  clients: ClientWithRelations[];
  initialClientId?: string | null;
  tasks?: Task[];
  userRole?: UserRole;
}

export function ClientsWorkspace({
  clients,
  initialClientId,
  tasks = [],
  userRole = "operator",
}: ClientsWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(
    initialClientId ?? null,
  );
  const [sheetOpen, setSheetOpen] = useState(Boolean(initialClientId));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const selectedClient = useMemo(
    () =>
      selectedClientId
        ? clients.find((c) => c.id === selectedClientId) ?? null
        : null,
    [clients, selectedClientId],
  );

  const clearSearch = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    router.push(`/clients?${params.toString()}`);
  }, [router, searchParams]);

  const handleSelectClient = useCallback((client: ClientWithRelations) => {
    setSelectedClientId(client.id);
    setSheetOpen(true);
  }, []);

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) setSelectedClientId(null);
  }, []);

  const toggleSelect = useCallback((clientId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) next.delete(clientId);
      else next.add(clientId);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(
    (ids: string[]) => {
      setSelectedIds((prev) => {
        const allSelected = ids.every((id) => prev.has(id));
        if (allSelected) return new Set();
        return new Set(ids);
      });
    },
    [],
  );

  const { handleKeyDown } = useClientKeyboardShortcuts({
    searchInputRef,
    onClearSearch: clearSearch,
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      const result = handleKeyDown(event);
      if (result === "show-help") setHelpOpen(true);
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [handleKeyDown]);

  return (
    <>
      <ClientFilters searchInputRef={searchInputRef} onClearSearch={clearSearch} />
      <BulkActionsBar
        selectedIds={[...selectedIds]}
        canExport={canExportClients(userRole)}
        onClear={() => setSelectedIds(new Set())}
      />
      <ClientsTable
        clients={clients}
        tasks={tasks}
        selectedClientId={selectedClient?.id}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        onSelectClient={handleSelectClient}
      />
      <ClientDetailSheet
        client={selectedClient}
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
      />
      <KeyboardShortcutsModal open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  );
}
