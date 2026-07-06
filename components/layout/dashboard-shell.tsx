"use client";

import Link from "next/link";
import { Globe, Menu } from "lucide-react";
import { MobileSidebar, Sidebar } from "@/components/layout/sidebar";
import { SidebarProvider, useSidebar } from "@/components/layout/sidebar-context";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

function DashboardShellInner({
  user,
  children,
}: {
  user: Profile;
  children: React.ReactNode;
}) {
  const { collapsed, hydrated, setMobileOpen } = useSidebar();

  return (
    <div className="flex h-[100dvh] bg-background">
      <Sidebar />
      <MobileSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="relative z-10 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-md lg:justify-end lg:px-6">
          <div className="flex min-w-0 items-center gap-2 lg:hidden">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link
              href="/dashboard"
              className="flex min-w-0 items-center gap-2 truncate"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[oklch(0.55_0.12_85)]">
                <Globe className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="truncate text-sm font-semibold text-foreground">
                Meridian
              </span>
            </Link>
          </div>
          <UserMenu user={user} />
        </header>
        <main className="relative flex-1 overflow-y-auto overflow-x-hidden">
          <div
            className={cn(
              "pointer-events-none fixed inset-0 opacity-30 transition-[left] duration-200",
              "left-0",
              hydrated && collapsed ? "lg:left-16" : "lg:left-64",
            )}
            aria-hidden
            style={{
              background:
                "radial-gradient(ellipse 80% 50% at 50% -20%, oklch(0.55 0.12 85 / 20%), transparent)",
            }}
          />
          <div className="relative mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
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
