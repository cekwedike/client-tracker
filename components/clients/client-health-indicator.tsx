"use client";

import type { ClientHealth, ClientHealthLevel } from "@/lib/client-health";
import { cn } from "@/lib/utils";

const STYLES: Record<ClientHealthLevel, { dot: string; label: string }> = {
  good: { dot: "bg-emerald-500", label: "Good" },
  attention: { dot: "bg-amber-500", label: "Needs attention" },
  urgent: { dot: "bg-red-500", label: "Urgent" },
};

export function ClientHealthIndicator({
  health,
  showLabel = false,
  className,
}: {
  health: ClientHealth;
  showLabel?: boolean;
  className?: string;
}) {
  const style = STYLES[health.level];
  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
      title={health.reasons.join(" · ") || style.label}
    >
      <span
        className={cn("h-2 w-2 shrink-0 rounded-full ring-2 ring-background", style.dot)}
        aria-hidden
      />
      {showLabel && (
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {style.label}
        </span>
      )}
    </span>
  );
}
