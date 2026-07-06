"use client";

import { memo, useCallback, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, isPast, parseISO } from "date-fns";
import { motion, useReducedMotion } from "framer-motion";
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
import { updateTaskAssignee, updateTaskStatus } from "@/lib/actions/tasks";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Profile,
  type Task,
  type TaskStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Calendar, CheckSquare, GripVertical, Inbox } from "lucide-react";
import { toast } from "sonner";

const priorityStyles = {
  low: { border: "border-l-muted-foreground/40", dot: "bg-muted-foreground" },
  medium: { border: "border-l-deal-ppl/50", dot: "bg-deal-ppl" },
  high: { border: "border-l-amber-500/60", dot: "bg-amber-500" },
  urgent: { border: "border-l-red-500/70", dot: "bg-red-500" },
};

const columnMeta: Record<
  TaskStatus,
  { label: string; accent: string; empty: string }
> = {
  backlog: {
    label: "Backlog",
    accent: "from-muted/40 to-transparent",
    empty: "Nothing queued — inbox zero energy",
  },
  in_progress: {
    label: "In Progress",
    accent: "from-primary/15 to-transparent",
    empty: "Drag work here when you start",
  },
  waiting_on_client: {
    label: "Waiting on Client",
    accent: "from-amber-500/10 to-transparent",
    empty: "Blocked items land here",
  },
  done: {
    label: "Done",
    accent: "from-emerald-500/10 to-transparent",
    empty: "Completed tasks celebrate here",
  },
};

interface KanbanBoardProps {
  tasks: Task[];
  profiles: Profile[];
  canAssign: boolean;
}

export function KanbanBoard({ tasks, profiles, canAssign }: KanbanBoardProps) {
  const columns = TASK_STATUSES;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {columns.map((col, i) => (
        <KanbanColumn
          key={col.value}
          status={col.value}
          label={col.label}
          tasks={tasks.filter((t) => t.status === col.value)}
          profiles={profiles}
          canAssign={canAssign}
          index={i}
        />
      ))}
    </div>
  );
}

const KanbanColumn = memo(function KanbanColumn({
  status,
  label,
  tasks,
  profiles,
  canAssign,
  index,
}: {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  profiles: Profile[];
  canAssign: boolean;
  index: number;
}) {
  const reduceMotion = useReducedMotion();
  const meta = columnMeta[status];

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className="glass-panel gradient-border flex min-h-[320px] flex-col overflow-hidden"
    >
      <div
        className={cn(
          "border-b border-border/50 bg-gradient-to-b px-4 py-3",
          meta.accent,
        )}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            {label}
          </h3>
          <Badge variant="secondary" className="tabular-nums text-xs">
            {tasks.length}
          </Badge>
        </div>
      </div>
      <div className="flex-1 space-y-2 p-3">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            status={status}
            profiles={profiles}
            canAssign={canAssign}
          />
        ))}
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Inbox className="mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">{meta.empty}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
});

const TaskCard = memo(function TaskCard({
  task,
  status,
  profiles,
  canAssign,
}: {
  task: Task;
  status: TaskStatus;
  profiles: Profile[];
  canAssign: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const styles = priorityStyles[task.priority];
  const overdue = task.due_at && isPast(parseISO(task.due_at));

  const moveTask = useCallback(
    (newStatus: TaskStatus) => {
      startTransition(async () => {
        try {
          await updateTaskStatus(task.id, newStatus);
          router.refresh();
        } catch {
          toast.error("Failed to update task");
        }
      });
    },
    [task.id, router],
  );

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

  return (
    <div
      className={cn(
        "group rounded-lg border border-border/60 bg-card/90 border-l-[3px] p-3 shadow-sm transition-all hover:border-primary/25 hover:shadow-md",
        styles.border,
      )}
    >
      <div className="mb-2 flex items-start gap-2">
        <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/30" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", styles.dot)} />
            <p className="text-sm font-medium leading-snug text-foreground">
              {task.title}
            </p>
          </div>
          {task.client && (
            <p className="mt-1 truncate text-xs font-medium text-primary">
              {task.client.company_name}
            </p>
          )}
        </div>
        <Badge variant="outline" className="shrink-0 text-[10px] capitalize">
          {task.priority}
        </Badge>
      </div>

      <div className="space-y-2 pl-5">
        {canAssign ? (
          <Select
            value={task.assignee_id ?? ""}
            onValueChange={handleAssignee}
            disabled={isPending}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="Unassigned">
                {profileSelectLabel(profiles, task.assignee_id)}
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
        ) : task.assignee ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[9px]">
                {task.assignee.full_name?.[0]?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            {task.assignee.full_name ?? task.assignee.email}
          </div>
        ) : null}

        {task.due_at && (
          <p
            className={cn(
              "flex items-center gap-1 text-[10px]",
              overdue ? "text-red-400" : "text-muted-foreground",
            )}
          >
            <Calendar className="h-3 w-3" />
            {format(parseISO(task.due_at), "MMM d, h:mm a")}
            {overdue && " · overdue"}
          </p>
        )}

        <div className="flex flex-wrap gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          {TASK_STATUSES.filter((s) => s.value !== status).map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => moveTask(s.value)}
              disabled={isPending}
              className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              → {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

export function TaskList({ tasks, title }: { tasks: Task[]; title?: string }) {
  const reduceMotion = useReducedMotion();

  const grouped = useMemo(() => {
    const byPriority = TASK_PRIORITIES.map((p) => ({
      ...p,
      tasks: tasks.filter((t) => t.priority === p.value),
    })).filter((g) => g.tasks.length > 0);
    return byPriority.length > 0
      ? byPriority
      : [{ value: "medium" as const, label: "All", tasks }];
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <div className="glass-panel gradient-border flex flex-col items-center justify-center py-16 text-center">
        <CheckSquare className="mb-3 h-10 w-10 text-primary/40" />
        <p className="font-medium text-foreground">
          {title ? `No tasks in ${title}` : "Your queue is clear"}
        </p>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Tasks assigned to you will appear here — check the board for team work.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {grouped.map((group, gi) => (
        <motion.section
          key={group.value}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: gi * 0.05 }}
        >
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {group.label} · {group.tasks.length}
          </h3>
          <div className="space-y-2">
            {group.tasks.map((task) => {
              const styles = priorityStyles[task.priority];
              return (
                <div
                  key={task.id}
                  className={cn(
                    "glass-panel border-l-[3px] p-4",
                    styles.border,
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{task.title}</p>
                      {task.client && (
                        <p className="text-sm text-primary">{task.client.company_name}</p>
                      )}
                      {task.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="capitalize text-xs">
                      {task.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>
      ))}
    </div>
  );
}
