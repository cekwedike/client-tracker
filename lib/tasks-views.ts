import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  Columns3,
  List,
  Table2,
  UserRound,
} from "lucide-react";

export const TASK_VIEW_IDS = [
  "kanban",
  "list",
  "my-work",
  "table",
  "schedule",
] as const;

export type TaskViewId = (typeof TASK_VIEW_IDS)[number];

export interface TaskViewDefinition {
  id: TaskViewId;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  description: string;
  mobileDefault?: boolean;
  desktopDefault?: boolean;
}

export const TASK_VIEWS: TaskViewDefinition[] = [
  {
    id: "kanban",
    label: "Kanban",
    shortLabel: "Board",
    icon: Columns3,
    description: "Drag work across columns",
    desktopDefault: true,
  },
  {
    id: "list",
    label: "List",
    shortLabel: "List",
    icon: List,
    description: "Compact cards — best on mobile",
    mobileDefault: true,
  },
  {
    id: "my-work",
    label: "My Work",
    shortLabel: "Mine",
    icon: UserRound,
    description: "Tasks assigned to you",
  },
  {
    id: "table",
    label: "Table",
    shortLabel: "Table",
    icon: Table2,
    description: "Scan and sort all fields",
  },
  {
    id: "schedule",
    label: "Schedule",
    shortLabel: "Dates",
    icon: CalendarDays,
    description: "Grouped by due date",
  },
];

export const TASK_VIEW_STORAGE_KEY = "meridian-tasks-view";
export const TASK_VIEW_EVENT = "meridian-tasks-view-changed";

export function isTaskViewId(value: string): value is TaskViewId {
  return (TASK_VIEW_IDS as readonly string[]).includes(value);
}

export function getResponsiveDefaultView(isDesktop: boolean): TaskViewId {
  return isDesktop ? "kanban" : "list";
}
