"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  TaskAssigneeSelect,
  TaskStatusSelect,
  priorityStyles,
  taskStatusLabel,
} from "@/components/tasks/task-shared";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Profile, Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, ArrowUpDown, CheckSquare } from "lucide-react";

type SortKey = "title" | "status" | "priority" | "due_at" | "client";
type SortDir = "asc" | "desc";

const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
const statusOrder = {
  in_progress: 0,
  waiting_on_client: 1,
  backlog: 2,
  done: 3,
};

export function TaskTableView({
  tasks,
  profiles,
  canAssign,
}: {
  tasks: Task[];
  profiles: Profile[];
  canAssign: boolean;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("due_at");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const sorted = useMemo(() => {
    const copy = [...tasks];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "status":
          cmp = statusOrder[a.status] - statusOrder[b.status];
          break;
        case "priority":
          cmp = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case "client":
          cmp = (a.client?.company_name ?? "").localeCompare(
            b.client?.company_name ?? "",
          );
          break;
        case "due_at": {
          const aTime = a.due_at ? parseISO(a.due_at).getTime() : Infinity;
          const bTime = b.due_at ? parseISO(b.due_at).getTime() : Infinity;
          cmp = aTime - bTime;
          break;
        }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [tasks, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5" />
    );
  };

  if (tasks.length === 0) {
    return (
      <div className="glass-panel gradient-border flex flex-col items-center justify-center py-16 text-center">
        <CheckSquare className="mb-3 h-10 w-10 text-primary/40" />
        <p className="font-medium text-foreground">No tasks to show</p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <div className="glass-panel gradient-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {(
                  [
                    ["title", "Task"],
                    ["client", "Client"],
                    ["status", "Status"],
                    ["priority", "Priority"],
                  ] as const
                ).map(([key, label]) => (
                  <TableHead key={key}>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 font-medium hover:text-foreground"
                      onClick={() => toggleSort(key)}
                    >
                      {label}
                      <SortIcon column={key} />
                    </button>
                  </TableHead>
                ))}
                <TableHead>Assignee</TableHead>
                <TableHead>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 font-medium hover:text-foreground"
                    onClick={() => toggleSort("due_at")}
                  >
                    Due
                    <SortIcon column="due_at" />
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="max-w-[240px]">
                    <p className="truncate font-medium">{task.title}</p>
                    {task.description && (
                      <p className="truncate text-xs text-muted-foreground">
                        {task.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-primary">
                    {task.client?.company_name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <TaskStatusSelect task={task} canChange={canAssign} compact />
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize text-[10px]",
                        priorityStyles[task.priority].badge,
                      )}
                    >
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="min-w-[140px]">
                    <TaskAssigneeSelect
                      task={task}
                      profiles={profiles}
                      canAssign={canAssign}
                      compact
                    />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {task.due_at
                      ? format(parseISO(task.due_at), "MMM d, h:mm a")
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="space-y-2 md:hidden">
        {sorted.map((task) => (
          <div key={task.id} className="glass-panel gradient-border p-3 text-sm">
            <p className="font-medium">{task.title}</p>
            <p className="text-xs text-muted-foreground">
              {task.client?.company_name ?? "General ops"} · {taskStatusLabel(task.status)}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
