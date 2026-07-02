"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createMessageTemplate,
  deleteMessageTemplate,
  updateMessageTemplate,
} from "@/lib/actions/templates";
import { TEMPLATE_PLACEHOLDERS } from "@/lib/template-placeholders";
import {
  canDeleteTemplate,
  canManageTemplates,
} from "@/lib/permissions";
import type { MessageTemplateWithClients, UserRole } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";

interface TemplatesManagerProps {
  templates: MessageTemplateWithClients[];
  clients: { id: string; company_name: string }[];
  userRole: UserRole;
}

function getAssignedClientIds(template: MessageTemplateWithClients): string[] {
  return (template.client_templates ?? []).map((ct) => ct.client_id);
}

function TemplateForm({
  initial,
  clients,
  onSubmit,
  onCancel,
  isPending,
}: {
  initial?: { name: string; body: string; client_ids: string[] };
  clients: { id: string; company_name: string }[];
  onSubmit: (values: { name: string; body: string; client_ids: string[] }) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [body, setBody] = useState(
    initial?.body ?? "I'll CC {{cc_name}} ({{email}}) on this thread.",
  );
  const [clientIds, setClientIds] = useState<string[]>(initial?.client_ids ?? []);
  const [clientSearch, setClientSearch] = useState("");

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => c.company_name.toLowerCase().includes(q));
  }, [clients, clientSearch]);

  const toggleClient = (id: string) => {
    setClientIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, body, client_ids: clientIds });
      }}
    >
      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Positive response CC line"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Body</Label>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          required
        />
        <div className="flex flex-wrap gap-1.5">
          {TEMPLATE_PLACEHOLDERS.map((p) => (
            <button
              key={p.key}
              type="button"
              className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary hover:bg-primary/20"
              onClick={() => setBody((b) => `${b}{{${p.key}}}`)}
            >
              {`{{${p.key}}}`}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Assign to clients ({clientIds.length})</Label>
        <Input
          value={clientSearch}
          onChange={(e) => setClientSearch(e.target.value)}
          placeholder="Filter clients..."
        />
        <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border/60 p-2">
          {filteredClients.map((c) => (
            <label
              key={c.id}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
            >
              <Checkbox
                checked={clientIds.includes(c.id)}
                onCheckedChange={() => toggleClient(c.id)}
              />
              <span className="truncate">{c.company_name}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save template"}
        </Button>
      </div>
    </form>
  );
}

export function TemplatesManager({
  templates,
  clients,
  userRole,
}: TemplatesManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const canManage = canManageTemplates(userRole);
  const canDelete = canDeleteTemplate(userRole);
  const editing = templates.find((t) => t.id === editId);

  const handleCreate = (values: { name: string; body: string; client_ids: string[] }) => {
    startTransition(async () => {
      try {
        await createMessageTemplate(values);
        toast.success("Template created");
        setCreateOpen(false);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to create template");
      }
    });
  };

  const handleUpdate = (values: { name: string; body: string; client_ids: string[] }) => {
    if (!editId) return;
    startTransition(async () => {
      try {
        await updateMessageTemplate(editId, values);
        toast.success("Template updated");
        setEditId(null);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to update template");
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this template? Client assignments will be removed.")) return;
    startTransition(async () => {
      try {
        await deleteMessageTemplate(id);
        toast.success("Template deleted");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to delete template");
      }
    });
  };

  if (templates.length === 0 && !canManage) {
    return (
      <div className="rounded-xl border border-dashed border-primary/30 p-12 text-center text-sm text-muted-foreground">
        No templates yet. Ask an admin or manager to create message templates.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button className="gap-2" />}>
              <Plus className="h-4 w-4" />
              New Template
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create message template</DialogTitle>
              </DialogHeader>
              <TemplateForm
                clients={clients}
                onSubmit={handleCreate}
                onCancel={() => setCreateOpen(false)}
                isPending={isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      )}

      {templates.length === 0 ? (
        <div className="glass-panel gradient-border flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <p className="font-semibold text-foreground">No templates yet</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Create reusable snippets with placeholders like {"{{cc_name}}"} and assign them to clients.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {templates.map((template) => {
            const assigned = template.client_templates ?? [];
            return (
              <div
                key={template.id}
                className="glass-panel gradient-border flex flex-col p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{template.name}</h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {template.body}
                    </p>
                  </div>
                  <CopyButton
                    value={template.body}
                    label="Copy template body"
                    size="sm"
                    buttonText="Copy"
                    showToast
                    toastMessage="Template copied"
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {assigned.length === 0 ? (
                    <span className="text-xs text-subtle">Not assigned to any client</span>
                  ) : (
                    assigned.map((ct) => (
                      <Badge
                        key={ct.client_id}
                        variant="outline"
                        className="border-primary/25 text-xs"
                      >
                        {ct.client?.company_name ?? "Client"}
                      </Badge>
                    ))
                  )}
                </div>
                {canManage && (
                  <div className="mt-4 flex gap-2 border-t border-border/50 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setEditId(template.id)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn("gap-1.5 text-destructive hover:text-destructive")}
                        onClick={() => handleDelete(template.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!editId} onOpenChange={(open) => !open && setEditId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit template</DialogTitle>
          </DialogHeader>
          {editing && (
            <TemplateForm
              initial={{
                name: editing.name,
                body: editing.body,
                client_ids: getAssignedClientIds(editing),
              }}
              clients={clients}
              onSubmit={handleUpdate}
              onCancel={() => setEditId(null)}
              isPending={isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
