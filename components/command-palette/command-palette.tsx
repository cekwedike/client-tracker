"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getClientOptions } from "@/lib/actions/clients";
import { createTask } from "@/lib/actions/tasks";
import { buildCcLeadBlock } from "@/lib/client-copy";
import { copyToClipboard } from "@/lib/clipboard";
import type { ClientWithRelations } from "@/lib/types";
import {
  Building2,
  CheckSquare,
  ClipboardCopy,
  LayoutDashboard,
  Search,
  Settings,
  Users,
} from "lucide-react";

const PAGES = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Building2 },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/team", label: "Team", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface CommandPaletteProps {
  clients?: ClientWithRelations[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ clients = [], open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [remoteClients, setRemoteClients] = useState<{ id: string; company_name: string }[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    startTransition(async () => {
      try {
        const opts = await getClientOptions();
        setRemoteClients(opts);
      } catch {
        setRemoteClients([]);
      }
    });
  }, [open]);

  const clientList = useMemo(() => {
    if (clients.length > 0) {
      return clients.map((c) => ({ id: c.id, company_name: c.company_name }));
    }
    return remoteClients;
  }, [clients, remoteClients]);

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clientList.slice(0, 8);
    return clientList
      .filter((c) => c.company_name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [clientList, query]);

  const filteredPages = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PAGES;
    return PAGES.filter((p) => p.label.toLowerCase().includes(q));
  }, [query]);

  const close = useCallback(() => {
    onOpenChange(false);
    setQuery("");
  }, [onOpenChange]);

  const go = (href: string) => {
    close();
    router.push(href);
  };

  const copyCcForClient = async (clientId: string) => {
    const full = clients.find((c) => c.id === clientId);
    if (!full) {
      toast.error("Open Clients page to copy CC blocks from palette");
      return;
    }
    const cc =
      full.contacts.find((c) => c.is_default_cc) ??
      full.contacts.find((c) => c.role === "cc_manager") ??
      full.contacts[0];
    const block = cc
      ? buildCcLeadBlock({
          ccName: cc.cc_alias ?? cc.name?.split(" ")[0],
          ccEmail: cc.email,
          phone: cc.phone,
          companyName: full.company_name,
        })
      : "";
    if (!block) {
      toast.error("No CC block for this client");
      return;
    }
    await copyToClipboard(block);
    toast.success("CC block copied");
    close();
  };

  const quickCreateTask = (clientId: string, name: string) => {
    startTransition(async () => {
      try {
        await createTask({
          title: `Follow up — ${name}`,
          client_id: clientId,
          status: "backlog",
          priority: "medium",
          tags: [],
        });
        toast.success("Task created");
        close();
        router.push("/tasks");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to create task");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border/60 px-4 py-3">
          <DialogTitle className="sr-only">Command palette</DialogTitle>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search clients, pages, actions…"
              className="border-0 bg-transparent shadow-none focus-visible:ring-0"
              autoFocus
            />
            <kbd className="hidden rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
              Esc
            </kbd>
          </div>
        </DialogHeader>
        <div className="max-h-[360px] overflow-y-auto p-2">
          {filteredPages.length > 0 && (
            <section className="mb-2">
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Pages
              </p>
              {filteredPages.map((page) => (
                <button
                  key={page.href}
                  type="button"
                  onClick={() => go(page.href)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted/50"
                >
                  <page.icon className="h-4 w-4 text-primary" />
                  {page.label}
                </button>
              ))}
            </section>
          )}
          {filteredClients.length > 0 && (
            <section>
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Clients
              </p>
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center gap-1 rounded-lg hover:bg-muted/50"
                >
                  <button
                    type="button"
                    onClick={() => go(`/clients?client=${client.id}`)}
                    className="min-w-0 flex-1 px-3 py-2 text-left text-sm"
                  >
                    {client.company_name}
                  </button>
                  <button
                    type="button"
                    title="Copy CC block"
                    onClick={() => copyCcForClient(client.id)}
                    className="rounded p-2 text-muted-foreground hover:text-primary"
                  >
                    <ClipboardCopy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Create task"
                    disabled={isPending}
                    onClick={() => quickCreateTask(client.id, client.company_name)}
                    className="rounded p-2 text-muted-foreground hover:text-primary"
                  >
                    <CheckSquare className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </section>
          )}
          {filteredPages.length === 0 && filteredClients.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No matches
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function useCommandPaletteShortcut(onOpen: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpen();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onOpen]);
}
