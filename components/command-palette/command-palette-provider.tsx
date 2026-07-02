"use client";

import { useCallback, useState } from "react";
import { CommandPalette, useCommandPaletteShortcut } from "@/components/command-palette/command-palette";
import type { ClientWithRelations } from "@/lib/types";

export function CommandPaletteProvider({
  children,
  clients = [],
}: {
  children: React.ReactNode;
  clients?: ClientWithRelations[];
}) {
  const [open, setOpen] = useState(false);
  const openPalette = useCallback(() => setOpen(true), []);

  useCommandPaletteShortcut(openPalette);

  return (
    <>
      {children}
      <CommandPalette clients={clients} open={open} onOpenChange={setOpen} />
    </>
  );
}
