"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

const STORAGE_KEY = "meridian-sidebar-collapsed";
const SIDEBAR_EVENT = "meridian-sidebar-changed";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(SIDEBAR_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(SIDEBAR_EVENT, onChange);
  };
}

function getCollapsedSnapshot(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function setCollapsedStorage(collapsed: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, String(collapsed));
    window.dispatchEvent(new Event(SIDEBAR_EVENT));
  } catch {
    /* ignore */
  }
}

interface SidebarContextValue {
  collapsed: boolean;
  toggle: () => void;
  hydrated: boolean;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const collapsed = useSyncExternalStore(
    subscribe,
    getCollapsedSnapshot,
    () => false,
  );

  const toggle = useCallback(() => {
    setCollapsedStorage(!getCollapsedSnapshot());
  }, []);

  const value = useMemo(
    () => ({ collapsed, toggle, hydrated: true }),
    [collapsed, toggle],
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return ctx;
}
