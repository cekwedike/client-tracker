"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { profileSelectLabel } from "@/lib/select-labels";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Profile,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/types";

export interface TaskFilterState {
  search: string;
  status: TaskStatus | "all";
  priority: TaskPriority | "all";
  assigneeId: string | "all" | "unassigned";
}

export const defaultTaskFilters: TaskFilterState = {
  search: "",
  status: "all",
  priority: "all",
  assigneeId: "all",
};

export function filterTasks(
  tasks: Task[],
  filters: TaskFilterState,
): Task[] {
  const q = filters.search.trim().toLowerCase();
  return tasks.filter((task) => {
    if (filters.status !== "all" && task.status !== filters.status) return false;
    if (filters.priority !== "all" && task.priority !== filters.priority) {
      return false;
    }
    if (filters.assigneeId === "unassigned" && task.assignee_id) return false;
    if (
      filters.assigneeId !== "all" &&
      filters.assigneeId !== "unassigned" &&
      task.assignee_id !== filters.assigneeId
    ) {
      return false;
    }
    if (!q) return true;
    const haystack = [
      task.title,
      task.description,
      task.client?.company_name,
      task.assignee?.full_name,
      task.assignee?.email,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function TaskFiltersBar({
  filters,
  onChange,
  profiles,
  resultCount,
  totalCount,
}: {
  filters: TaskFilterState;
  onChange: (next: TaskFilterState) => void;
  profiles: Profile[];
  resultCount: number;
  totalCount: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const activeCount = useMemo(() => {
    let n = 0;
    if (filters.search.trim()) n++;
    if (filters.status !== "all") n++;
    if (filters.priority !== "all") n++;
    if (filters.assigneeId !== "all") n++;
    return n;
  }, [filters]);

  const clear = () => onChange(defaultTaskFilters);

  return (
    <div className="glass-panel gradient-border p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 basis-full sm:basis-auto sm:min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search tasks, clients, assignees…"
            className="pl-9"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 lg:hidden"
          onClick={() => setExpanded((v) => !v)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters{activeCount > 0 ? ` (${activeCount})` : ""}
        </Button>
        <div
          className={
            expanded
              ? "flex w-full flex-wrap gap-2"
              : "hidden w-full flex-wrap gap-2 lg:flex lg:w-auto"
          }
        >
          <Select
            value={filters.status}
            onValueChange={(v) =>
              onChange({ ...filters, status: (v as TaskFilterState["status"]) ?? "all" })
            }
          >
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Status">
                {filters.status === "all"
                  ? "All statuses"
                  : TASK_STATUSES.find((s) => s.value === filters.status)?.label}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {TASK_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.priority}
            onValueChange={(v) =>
              onChange({ ...filters, priority: (v as TaskFilterState["priority"]) ?? "all" })
            }
          >
            <SelectTrigger className="w-full sm:w-[130px]">
              <SelectValue placeholder="Priority">
                {filters.priority === "all"
                  ? "All priorities"
                  : TASK_PRIORITIES.find((p) => p.value === filters.priority)?.label}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              {TASK_PRIORITIES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.assigneeId}
            onValueChange={(v) =>
              onChange({
                ...filters,
                assigneeId: (v as TaskFilterState["assigneeId"]) ?? "all",
              })
            }
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Assignee">
                {filters.assigneeId === "all"
                  ? "All assignees"
                  : filters.assigneeId === "unassigned"
                    ? "Unassigned"
                    : profileSelectLabel(profiles, filters.assigneeId)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All assignees</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {profiles
                .filter((p) => p.is_active !== false)
                .map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name ?? p.email}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        {activeCount > 0 && (
          <Button type="button" variant="ghost" size="sm" className="gap-1" onClick={clear}>
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Showing {resultCount} of {totalCount} tasks
      </p>
    </div>
  );
}
