"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClientsTable } from "@/components/clients/clients-table";
import { ClientFilters } from "@/components/clients/client-filters";
import {
  KeyboardShortcutsModal,
  useClientKeyboardShortcuts,
} from "@/components/clients/keyboard-shortcuts-modal";
import type { ClientWithRelations } from "@/lib/types";

interface ClientsWorkspaceProps {
  clients: ClientWithRelations[];
}

export function ClientsWorkspace({ clients }: ClientsWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const clearSearch = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    router.push(`/clients?${params.toString()}`);
  }, [router, searchParams]);

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
      <ClientsTable clients={clients} />
      <KeyboardShortcutsModal open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  );
}
