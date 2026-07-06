"use client";

import { Badge } from "@/components/ui/badge";
import {
  TaskAssigneeSelect,
  TaskDueDate,
  TaskStatusSelect,
  priorityStyles,
  taskStatusLabel,
} from "@/components/tasks/task-shared";
import type { Profile, Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CheckSquare } from "lucide-react";

export function TaskListView({
  tasks,
  profiles,
  canAssign,
  emptyTitle = "No tasks match your filters",
  emptyDescription = "Try clearing filters or create a new task.",
}: {
  tasks: Task[];
  profiles: Profile[];
  canAssign: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (tasks.length === 0) {
    return (
      <div className="glass-panel gradient-border flex flex-col items-center justify-center py-16 text-center">
        <CheckSquare className="mb-3 h-10 w-10 text-primary/40" />
        <p className="font-medium text-foreground">{emptyTitle}</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const styles = priorityStyles[task.priority];
        return (
          <article
            key={task.id}
            className={cn(
              "glass-panel gradient-border border-l-[3px] p-4",
              styles.border,
            )}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", styles.dot)} />
                  <h3 className="font-medium text-foreground">{task.title}</h3>
                  <Badge variant="outline" className={cn("text-[10px] capitalize", styles.badge)}>
                    {task.priority}
                  </Badge>
                </div>
                {task.client && (
                  <p className="mt-1 text-sm font-medium text-primary">
                    {task.client.company_name}
                  </p>
                )}
                {task.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {task.description}
                  </p>
                )}
                {task.due_at && <TaskDueDate dueAt={task.due_at} className="mt-2" />}
              </div>
              <div className="grid w-full gap-2 sm:w-48 sm:shrink-0">
                <TaskStatusSelect task={task} canChange={canAssign} />
                <TaskAssigneeSelect
                  task={task}
                  profiles={profiles}
                  canAssign={canAssign}
                />
              </div>
            </div>
            <p className="mt-3 text-[10px] uppercase tracking-wider text-subtle">
              {taskStatusLabel(task.status)}
            </p>
          </article>
        );
      })}
    </div>
  );
}
