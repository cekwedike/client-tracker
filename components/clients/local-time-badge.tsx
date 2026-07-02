"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import {
  formatLocalTime,
  getContactWindowStatus,
} from "@/lib/timezone";
import type { BusinessHour, ContactWindowStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusStyles: Record<ContactWindowStatus, string> = {
  open: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  closing: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  closed: "bg-red-500/15 text-red-400 border-red-500/30",
};

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
  const [time, setTime] = useState("");
  const [windowStatus, setWindowStatus] = useState<{
    status: ContactWindowStatus;
    label: string;
  }>({ status: "open", label: "" });

  useEffect(() => {
    const update = () => {
      setTime(formatLocalTime(timezone));
      setWindowStatus(
        getContactWindowStatus(
          timezone,
          businessHours,
          doNotContactBefore,
          doNotContactAfter,
        ),
      );
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [timezone, businessHours, doNotContactBefore, doNotContactAfter]);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 text-sm font-mono">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        {time}
      </div>
      {showLabel && (
        <Badge
          variant="outline"
          className={cn("text-xs", statusStyles[windowStatus.status])}
        >
          {windowStatus.label}
        </Badge>
      )}
    </div>
  );
}
