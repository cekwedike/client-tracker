"use client";

import { useMemo } from "react";
import {
  addDays,
  endOfWeek,
  format,
  isPast,
  isToday,
  isTomorrow,
  parseISO,
  startOfDay,
} from "date-fns";
import { TaskAssigneeSelect, TaskDueDate, TaskStatusSelect, priorityStyles } from "@/components/tasks/task-shared";
import { Badge } from "@/components/ui/badge";
import type { Profile, Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CalendarDays, CheckSquare } from "lucide-react";

interface ScheduleGroup {
  id: string;
  label: string;
  tasks: Task[];
  tone?: string;
}

function groupTasksByDue(tasks: Task[]): ScheduleGroup[] {
  const now = startOfDay(new Date());
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const buckets: Record<string, Task[]> = {
    overdue: [],
    today: [],
    tomorrow: [],
    this_week: [],
    later: [],
    no_date: [],
  };

  for (const task of tasks) {
    if (!task.due_at) {
      buckets.no_date.push(task);
      continue;
    }
    const due = parseISO(task.due_at);
    if (isPast(due) && !isToday(due)) {
      buckets.overdue.push(task);
    } else if (isToday(due)) {
      buckets.today.push(task);
    } else if (isTomorrow(due)) {
      buckets.tomorrow.push(task);
    } else if (due <= addDays(weekEnd, 1)) {
      buckets.this_week.push(task);
    } else {
      buckets.later.push(task);
    }
  }

  const sortByDue = (a: Task, b: Task) => {
    const aT = a.due_at ? parseISO(a.due_at).getTime() : 0;
    const bT = b.due_at ? parseISO(b.due_at).getTime() : 0;
    return aT - bT;
  };

  Object.values(buckets).forEach((list) => list.sort(sortByDue));

  return [
    { id: "overdue", label: "Overdue", tasks: buckets.overdue, tone: "text-red-400" },
    { id: "today", label: "Today", tasks: buckets.today },
    { id: "tomorrow", label: "Tomorrow", tasks: buckets.tomorrow },
    { id: "this_week", label: "This week", tasks: buckets.this_week },
    { id: "later", label: "Later", tasks: buckets.later },
    { id: "no_date", label: "No due date", tasks: buckets.no_date },
  ].filter((g) => g.tasks.length > 0);
}

export function TaskScheduleView({
  tasks,
  profiles,
  canAssign,
}: {
  tasks: Task[];
  profiles: Profile[];
  canAssign: boolean;
}) {
  const groups = useMemo(() => groupTasksByDue(tasks), [tasks]);

  if (tasks.length === 0) {
    return (
      <div className="glass-panel gradient-border flex flex-col items-center justify-center py-16 text-center">
        <CalendarDays className="mb-3 h-10 w-10 text-primary/40" />
        <p className="font-medium text-foreground">Nothing on the schedule</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Tasks with due dates appear here grouped by urgency.
        </p>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="glass-panel gradient-border py-12 text-center text-sm text-muted-foreground">
        <CheckSquare className="mx-auto mb-2 h-8 w-8 opacity-40" />
        No dated tasks in this view.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.id}>
          <div className="mb-3 flex items-center gap-2">
            <h3 className={cn("text-sm font-semibold", group.tone ?? "text-foreground")}>
              {group.label}
            </h3>
            <Badge variant="secondary" className="tabular-nums text-xs">
              {group.tasks.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {group.tasks.map((task) => {
              const styles = priorityStyles[task.priority];
              return (
                <div
                  key={task.id}
                  className={cn(
                    "glass-panel gradient-border border-l-[3px] p-4",
                    styles.border,
                  )}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{task.title}</p>
                      {task.client && (
                        <p className="text-sm text-primary">{task.client.company_name}</p>
                      )}
                      {task.due_at && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {format(parseISO(task.due_at), "EEEE, MMM d · h:mm a")}
                        </p>
                      )}
                    </div>
                    <div className="grid w-full gap-2 sm:grid-cols-2 lg:w-80">
                      <TaskStatusSelect task={task} canChange={canAssign} compact />
                      <TaskAssigneeSelect
                        task={task}
                        profiles={profiles}
                        canAssign={canAssign}
                        compact
                      />
                    </div>
                  </div>
                  {task.due_at && <TaskDueDate dueAt={task.due_at} className="mt-2" />}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
