"use client";

import { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, isPast, parseISO } from "date-fns";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { profileSelectLabel } from "@/lib/select-labels";
import {
  updateTaskAssignee,
  updateTaskStatus,
} from "@/lib/actions/tasks";
import {
  TASK_STATUSES,
  type Profile,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";

export const priorityStyles: Record<
  TaskPriority,
  { border: string; dot: string; badge: string }
> = {
  low: {
    border: "border-l-muted-foreground/40",
    dot: "bg-muted-foreground",
    badge: "border-border/60 text-muted-foreground",
  },
  medium: {
    border: "border-l-deal-ppl/50",
    dot: "bg-deal-ppl",
    badge: "border-deal-ppl/40 text-deal-ppl-fg",
  },
  high: {
    border: "border-l-amber-500/60",
    dot: "bg-amber-500",
    badge: "border-amber-500/40 text-amber-300",
  },
  urgent: {
    border: "border-l-red-500/70",
    dot: "bg-red-500",
    badge: "border-red-500/40 text-red-300",
  },
};

export function taskStatusLabel(status: TaskStatus): string {
  return TASK_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export function TaskDueDate({
  dueAt,
  className,
}: {
  dueAt: string;
  className?: string;
}) {
  const overdue = isPast(parseISO(dueAt));
  return (
    <p
      className={cn(
        "flex items-center gap-1 text-xs",
        overdue ? "text-red-400" : "text-muted-foreground",
        className,
      )}
    >
      <Calendar className="h-3 w-3 shrink-0" />
      {format(parseISO(dueAt), "MMM d, h:mm a")}
      {overdue && " · overdue"}
    </p>
  );
}

export function TaskAssigneeSelect({
  task,
  profiles,
  canAssign,
  compact,
}: {
  task: Task;
  profiles: Profile[];
  canAssign: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleAssignee = useCallback(
    (assigneeId: string | null) => {
      startTransition(async () => {
        try {
          await updateTaskAssignee(task.id, assigneeId || null);
          router.refresh();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Failed to assign");
        }
      });
    },
    [task.id, router],
  );

  if (!canAssign) {
    if (!task.assignee) return null;
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Avatar className={cn(compact ? "h-5 w-5" : "h-6 w-6")}>
          <AvatarFallback className="text-[9px]">
            {task.assignee.full_name?.[0]?.toUpperCase() ?? "U"}
          </AvatarFallback>
        </Avatar>
        <span className="truncate">
          {task.assignee.full_name ?? task.assignee.email}
        </span>
      </div>
    );
  }

  return (
    <Select
      value={task.assignee_id ?? ""}
      onValueChange={handleAssignee}
      disabled={isPending}
    >
      <SelectTrigger className={cn("text-xs", compact ? "h-7" : "h-8 w-full")}>
        <SelectValue placeholder="Unassigned">
          {profileSelectLabel(profiles, task.assignee_id, "Unassigned", task.assignee)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">Unassigned</SelectItem>
        {profiles
          .filter((p) => p.is_active !== false)
          .map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.full_name ?? p.email}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}

export function TaskStatusSelect({
  task,
  canChange,
  compact,
}: {
  task: Task;
  canChange: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleStatus = useCallback(
    (status: TaskStatus) => {
      startTransition(async () => {
        try {
          await updateTaskStatus(task.id, status);
          router.refresh();
        } catch {
          toast.error("Failed to update status");
        }
      });
    },
    [task.id, router],
  );

  if (!canChange) {
    return (
      <Badge variant="outline" className="capitalize text-xs">
        {taskStatusLabel(task.status)}
      </Badge>
    );
  }

  return (
    <Select
      value={task.status}
      onValueChange={(v) => handleStatus(v as TaskStatus)}
      disabled={isPending}
    >
      <SelectTrigger className={cn("text-xs", compact ? "h-7" : "h-8 w-full")}>
        <SelectValue>{taskStatusLabel(task.status)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {TASK_STATUSES.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
