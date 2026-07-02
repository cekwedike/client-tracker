"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createTask } from "@/lib/actions/tasks";
import { taskSchema, type TaskFormValues } from "@/lib/validations/task";
import { TASK_PRIORITIES, type Client, type Profile } from "@/lib/types";
import { Plus } from "lucide-react";
import { useState } from "react";

export function CreateTaskDialog({
  clients,
  profiles,
  defaultClientId,
}: {
  clients: Pick<Client, "id" | "company_name">[];
  profiles: Profile[];
  defaultClientId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      client_id: defaultClientId ?? null,
      status: "backlog",
      priority: "medium",
      tags: [],
    },
  });

  const onSubmit = (values: TaskFormValues) => {
    startTransition(async () => {
      try {
        await createTask(values);
        toast.success("Task created");
        setOpen(false);
        form.reset();
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to create task");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button className="gap-2 bg-emerald-700 hover:bg-emerald-600" />}
      >
        <Plus className="h-4 w-4" />
        New Task
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input {...form.register("title")} placeholder="Review reply for..." />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea {...form.register("description")} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select
                value={form.watch("client_id") ?? ""}
                onValueChange={(v) => form.setValue("client_id", v || null)}
              >
                <SelectTrigger><SelectValue placeholder="General ops" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">General ops</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select
                value={form.watch("assignee_id") ?? ""}
                onValueChange={(v) => form.setValue("assignee_id", v || null)}
              >
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name ?? p.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={form.watch("priority")}
                onValueChange={(v) =>
                  form.setValue("priority", (v as TaskFormValues["priority"]) ?? "medium")
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="datetime-local" {...form.register("due_at")} />
            </div>
          </div>
          <Button type="submit" className="w-full bg-emerald-700" disabled={isPending}>
            {isPending ? "Creating..." : "Create Task"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
