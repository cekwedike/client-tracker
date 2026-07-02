"use client";

import { memo, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { useSettings } from "@/components/providers/settings-provider";
import {
  formatLocalTime,
  getContactWindowStatus,
} from "@/lib/timezone";
import type { BusinessHour, ContactWindowStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusStyles: Record<ContactWindowStatus, string> = {
  open: "bg-primary/15 text-primary border-primary/35",
  closing: "bg-amber-500/15 text-amber-300 border-amber-500/35",
  closed: "bg-red-500/15 text-red-300 border-red-500/35",
};

/** Only the clock digits re-render every second — status badge ticks every 30s */
const TimeDigits = memo(function TimeDigits({
  timezone,
  timeFormat,
  hydrated,
}: {
  timezone: string;
  timeFormat: "12h" | "24h";
  hydrated: boolean;
}) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => setTime(formatLocalTime(timezone, timeFormat));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timezone, timeFormat]);

  return (
    <span className="min-w-[5.5rem] tracking-wide">
      {!hydrated ? "—:—:—" : time || "—:—:—"}
    </span>
  );
});

const WindowStatusBadge = memo(function WindowStatusBadge({
  timezone,
  businessHours,
  doNotContactBefore,
  doNotContactAfter,
}: {
  timezone: string;
  businessHours: BusinessHour[];
  doNotContactBefore?: string | null;
  doNotContactAfter?: string | null;
}) {
  const [windowStatus, setWindowStatus] = useState<{
    status: ContactWindowStatus;
    label: string;
  }>({ status: "open", label: "" });

  useEffect(() => {
    const update = () =>
      setWindowStatus(
        getContactWindowStatus(
          timezone,
          businessHours,
          doNotContactBefore,
          doNotContactAfter,
        ),
      );
    update();
    const interval = setInterval(update, 30_000);
    return () => clearInterval(interval);
  }, [timezone, businessHours, doNotContactBefore, doNotContactAfter]);

  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium", statusStyles[windowStatus.status])}
    >
      {windowStatus.label}
    </Badge>
  );
});

export function LocalTimeBadge({
  timezone,
  businessHours = [],
  doNotContactBefore,
  doNotContactAfter,
  showLabel = true,
}: {
  timezone: string;
  businessHours?: BusinessHour[];
  doNotContactBefore?: string | null;
  doNotContactAfter?: string | null;
  showLabel?: boolean;
}) {
  const { timeFormat, hydrated } = useSettings();

  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
      <div className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1 font-mono text-sm tabular-nums text-foreground">
        <Clock className="h-3.5 w-3.5 text-primary" />
        <TimeDigits timezone={timezone} timeFormat={timeFormat} hydrated={hydrated} />
      </div>
      {showLabel && (
        <WindowStatusBadge
          timezone={timezone}
          businessHours={businessHours}
          doNotContactBefore={doNotContactBefore}
          doNotContactAfter={doNotContactAfter}
        />
      )}
    </div>
  );
}
