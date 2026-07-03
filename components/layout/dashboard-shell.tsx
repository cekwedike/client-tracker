"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { SidebarProvider, useSidebar } from "@/components/layout/sidebar-context";
import { UserMenu } from "@/components/layout/user-menu";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

function DashboardShellInner({
  user,
  children,
}: {
  user: Profile;
  children: React.ReactNode;
}) {
  const { collapsed, hydrated } = useSidebar();

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="relative z-10 flex h-14 shrink-0 items-center justify-end border-b border-border/60 bg-background/80 px-4 backdrop-blur-md lg:px-6">
          <UserMenu user={user} />
        </header>
        <main className="relative flex-1 overflow-y-auto">
          <div
            className={cn(
              "pointer-events-none fixed inset-0 opacity-30 transition-[left] duration-200",
              hydrated && collapsed ? "left-16" : "left-64",
            )}
            aria-hidden
            style={{
              background:
                "radial-gradient(ellipse 80% 50% at 50% -20%, oklch(0.55 0.12 85 / 20%), transparent)",
            }}
          />
          <div className="relative mx-auto max-w-7xl p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function DashboardShell({
  user,
  children,
}: {
  user: Profile;
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardShellInner user={user}>{children}</DashboardShellInner>
    </SidebarProvider>
  );
}
