"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  getResponsiveDefaultView,
  isTaskViewId,
  TASK_VIEW_EVENT,
  TASK_VIEW_STORAGE_KEY,
  type TaskViewId,
} from "@/lib/tasks-views";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(TASK_VIEW_EVENT, onChange);
  const mq = window.matchMedia("(min-width: 1024px)");
  mq.addEventListener("change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(TASK_VIEW_EVENT, onChange);
    mq.removeEventListener("change", onChange);
  };
}

function getViewSnapshot(): TaskViewId {
  try {
    const stored = localStorage.getItem(TASK_VIEW_STORAGE_KEY);
    if (stored && isTaskViewId(stored)) return stored;
  } catch {
    /* ignore */
  }
  const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
  return getResponsiveDefaultView(isDesktop);
}

function getServerSnapshot(): TaskViewId {
  return "kanban";
}

export function useTasksView() {
  const view = useSyncExternalStore(subscribe, getViewSnapshot, getServerSnapshot);

  const setView = useCallback((next: TaskViewId) => {
    try {
      localStorage.setItem(TASK_VIEW_STORAGE_KEY, next);
      window.dispatchEvent(new Event(TASK_VIEW_EVENT));
    } catch {
      /* ignore */
    }
  }, []);

  return { view, setView };
}
