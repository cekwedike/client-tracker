"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { updateTaskStatus } from "@/lib/actions/tasks";
import { TASK_STATUSES, type Task, type TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const priorityColors = {
  low: "border-muted-foreground/30",
  medium: "border-deal-ppl/30",
  high: "border-amber-500/30",
  urgent: "border-red-500/30",
};

export function KanbanBoard({ tasks }: { tasks: Task[] }) {
  const columns = TASK_STATUSES;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {columns.map((col) => (
        <KanbanColumn
          key={col.value}
          status={col.value}
          label={col.label}
          tasks={tasks.filter((t) => t.status === col.value)}
        />
      ))}
    </div>
  );
}

function KanbanColumn({
  status,
  label,
  tasks,
}: {
  status: TaskStatus;
  label: string;
  tasks: Task[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const moveTask = (taskId: string, newStatus: TaskStatus) => {
    startTransition(async () => {
      try {
        await updateTaskStatus(taskId, newStatus);
        router.refresh();
      } catch {
        toast.error("Failed to update task");
      }
    });
  };

  return (
    <div className="rounded-lg bg-muted/30 p-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium">{label}</h3>
        <Badge variant="secondary" className="text-xs">
          {tasks.length}
        </Badge>
      </div>
      <div className="space-y-2">
        {tasks.map((task) => (
          <Card
            key={task.id}
            className={cn("border-l-2", priorityColors[task.priority])}
          >
            <CardHeader className="p-3 pb-1">
              <p className="text-sm font-medium leading-snug">{task.title}</p>
              {task.client && (
                <p className="text-xs text-primary">{task.client.company_name}</p>
              )}
            </CardHeader>
            <CardContent className="p-3 pt-1">
              {task.assignee && (
                <p className="mb-2 text-xs text-muted-foreground">
                  → {task.assignee.full_name}
                </p>
              )}
              <div className="flex flex-wrap gap-1">
                {TASK_STATUSES.filter((s) => s.value !== status).map((s) => (
                  <button
                    key={s.value}
                    onClick={() => moveTask(task.id, s.value)}
                    disabled={isPending}
                    className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    → {s.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        {tasks.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">No tasks</p>
        )}
      </div>
    </div>
  );
}

export function TaskList({ tasks, title }: { tasks: Task[]; title?: string }) {
  if (tasks.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {title ? `No tasks in ${title}` : "No tasks assigned to you"}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <Card key={task.id} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{task.title}</p>
              {task.client && (
                <p className="text-sm text-primary">{task.client.company_name}</p>
              )}
              {task.description && (
                <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
              )}
            </div>
            <Badge variant="outline" className="capitalize text-xs">
              {task.priority}
            </Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}
