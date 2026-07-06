"use client";

import { useMemo, useState } from "react";
import { isPast, parseISO } from "date-fns";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import {
  defaultTaskFilters,
  filterTasks,
  TaskFiltersBar,
  type TaskFilterState,
} from "@/components/tasks/task-filters";
import { TaskListView } from "@/components/tasks/task-list-view";
import { TaskScheduleView } from "@/components/tasks/task-schedule-view";
import { TaskTableView } from "@/components/tasks/task-table-view";
import { useTasksView } from "@/components/tasks/use-tasks-view";
import { TASK_VIEWS } from "@/lib/tasks-views";
import type { Profile, Task } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TasksWorkspaceProps {
  tasks: Task[];
  profiles: Profile[];
  currentUserId: string;
  canAssign: boolean;
}

function TaskStats({
  tasks,
  myCount,
}: {
  tasks: Task[];
  myCount: number;
}) {
  const stats = useMemo(() => {
    const open = tasks.filter((t) => t.status !== "done");
    const inProgress = tasks.filter((t) => t.status === "in_progress");
    const overdue = open.filter(
      (t) => t.due_at && isPast(parseISO(t.due_at)) && t.status !== "done",
    );
    const done = tasks.filter((t) => t.status === "done");
    return { open: open.length, inProgress: inProgress.length, overdue: overdue.length, done: done.length, myCount };
  }, [tasks, myCount]);

  const items = [
    { label: "Open", value: stats.open },
    { label: "In progress", value: stats.inProgress },
    { label: "Overdue", value: stats.overdue, warn: stats.overdue > 0 },
    { label: "My work", value: stats.myCount },
    { label: "Done", value: stats.done },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((item) => (
        <div key={item.label} className="glass-panel gradient-border px-3 py-2.5">
          <p
            className={cn(
              "text-xl font-bold tabular-nums",
              item.warn ? "text-red-400" : "text-foreground",
            )}
          >
            {item.value}
          </p>
          <p className="text-[11px] text-muted-foreground">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

export function TasksWorkspace({
  tasks,
  profiles,
  currentUserId,
  canAssign,
}: TasksWorkspaceProps) {
  const { view, setView } = useTasksView();
  const [filters, setFilters] = useState<TaskFilterState>(defaultTaskFilters);

  const myTasks = useMemo(
    () => tasks.filter((t) => t.assignee_id === currentUserId),
    [tasks, currentUserId],
  );

  const baseTasks = view === "my-work" ? myTasks : tasks;
  const filteredTasks = useMemo(
    () => filterTasks(baseTasks, filters),
    [baseTasks, filters],
  );

  return (
    <div className="space-y-4">
      <TaskStats tasks={tasks} myCount={myTasks.length} />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="glass-panel gradient-border flex gap-1 overflow-x-auto p-1">
          {TASK_VIEWS.map((v) => {
            const Icon = v.icon;
            const active = view === v.id;
            const count =
              v.id === "my-work" ? myTasks.length : undefined;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setView(v.id)}
                title={v.description}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_oklch(0.72_0.14_85_/_25%)]"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{v.label}</span>
                <span className="sm:hidden">{v.shortLabel}</span>
                {count !== undefined && (
                  <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground lg:max-w-xs lg:text-right">
          {TASK_VIEWS.find((v) => v.id === view)?.description}
        </p>
      </div>

      <TaskFiltersBar
        filters={filters}
        onChange={setFilters}
        profiles={profiles}
        resultCount={filteredTasks.length}
        totalCount={baseTasks.length}
      />

      {view === "kanban" && (
        <KanbanBoard tasks={filteredTasks} profiles={profiles} canAssign={canAssign} />
      )}
      {view === "list" && (
        <TaskListView
          tasks={filteredTasks}
          profiles={profiles}
          canAssign={canAssign}
        />
      )}
      {view === "my-work" && (
        <TaskListView
          tasks={filteredTasks}
          profiles={profiles}
          canAssign={canAssign}
          emptyTitle="Your queue is clear"
          emptyDescription="Tasks assigned to you will appear here. Check the board for team work."
        />
      )}
      {view === "table" && (
        <TaskTableView
          tasks={filteredTasks}
          profiles={profiles}
          canAssign={canAssign}
        />
      )}
      {view === "schedule" && (
        <TaskScheduleView
          tasks={filteredTasks}
          profiles={profiles}
          canAssign={canAssign}
        />
      )}
    </div>
  );
}
