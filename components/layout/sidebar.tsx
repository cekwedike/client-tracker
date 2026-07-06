"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Building2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  FileText,
  Globe,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";
import { SidebarQuickAccess } from "@/components/layout/sidebar-quick-access";
import { useSidebar } from "@/components/layout/sidebar-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Building2 },
  { href: "/templates", label: "Templates", icon: FileText },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/team", label: "Team", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

function SidebarContent({
  collapsed,
  showCollapseButton,
  onNavigate,
}: {
  collapsed: boolean;
  showCollapseButton: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { toggle } = useSidebar();

  return (
    <>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div
        className={cn(
          "flex items-center border-b border-sidebar-border py-5",
          collapsed ? "justify-center px-2" : "gap-3 px-5",
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[oklch(0.55_0.12_85)] shadow-lg shadow-black/40">
          <Globe className="h-5 w-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight text-sidebar-foreground">
              Meridian
            </p>
            <p className="text-xs text-subtle">PLNITUDE Ops</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex min-h-11 items-center rounded-lg py-2.5 text-sm font-medium transition-all",
                collapsed ? "justify-center px-2" : "gap-3 px-3",
                active
                  ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_oklch(0.72_0.14_85_/_20%)]"
                  : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      <SidebarQuickAccess collapsed={collapsed} />

      {showCollapseButton && (
        <div className="border-t border-sidebar-border p-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggle}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "w-full text-sidebar-foreground/85 hover:text-sidebar-foreground",
              collapsed ? "justify-center px-0" : "justify-start gap-2",
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                Collapse
              </>
            )}
          </Button>
        </div>
      )}
    </>
  );
}

export function Sidebar() {
  const { collapsed, hydrated } = useSidebar();
  const isCollapsed = hydrated && collapsed;

  return (
    <aside
      className={cn(
        "relative z-20 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:flex",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      <SidebarContent collapsed={isCollapsed} showCollapseButton />
    </aside>
  );
}

export function MobileSidebar() {
  const pathname = usePathname();
  const { mobileOpen, setMobileOpen, closeMobile } = useSidebar();

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent
        side="left"
        className="flex w-[min(18rem,88vw)] flex-col gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground sm:max-w-xs"
      >
        <div className="relative flex h-full flex-col">
          <SidebarContent
            collapsed={false}
            showCollapseButton={false}
            onNavigate={closeMobile}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>
      )}
    </div>
  );
}
