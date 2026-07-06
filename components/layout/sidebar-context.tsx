"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
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
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  closeMobile: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const collapsed = useSyncExternalStore(
    subscribe,
    getCollapsedSnapshot,
    () => false,
  );

  const toggle = useCallback(() => {
    setCollapsedStorage(!getCollapsedSnapshot());
  }, []);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      collapsed,
      toggle,
      hydrated: true,
      mobileOpen,
      setMobileOpen,
      closeMobile,
    }),
    [collapsed, toggle, mobileOpen, closeMobile],
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
