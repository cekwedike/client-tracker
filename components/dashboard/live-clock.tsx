"use client";

import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import { useSettings } from "@/components/providers/settings-provider";
import { formatLocalTime, getTimezoneAbbreviation } from "@/lib/timezone";
import { resolveOperatorTimezone } from "@/lib/settings";
import { cn } from "@/lib/utils";

function getUserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "America/New_York";
  }
}

export function LiveClock({
  timezone,
  size = "md",
  showTimezone = true,
  className,
}: {
  timezone?: string;
  size?: "sm" | "md" | "lg" | "hero";
  showTimezone?: boolean;
  className?: string;
}) {
  const settings = useSettings();
  const { timeFormat, hydrated } = settings;
  const tz =
    timezone ??
    (hydrated ? resolveOperatorTimezone(settings) : getUserTimezone());
  const [now, setNow] = useState<DateTime | null>(() =>
    DateTime.now().setZone(timezone ?? getUserTimezone()),
  );

  useEffect(() => {
    const tick = () => setNow(DateTime.now().setZone(tz));
    const frame = requestAnimationFrame(tick);
    const interval = setInterval(tick, 1000);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(interval);
    };
  }, [tz]);

  const time = hydrated && now ? formatLocalTime(tz, timeFormat) : "—:—:—";
  const day = now?.toFormat("cccc") ?? "—";
  const date = now?.toFormat("MMMM d, yyyy") ?? "—";
  const abbr = getTimezoneAbbreviation(tz);

  const sizeClasses = {
    sm: { time: "text-lg", date: "text-xs", day: "text-xs" },
    md: { time: "text-2xl", date: "text-sm", day: "text-sm" },
    lg: { time: "text-4xl", date: "text-base", day: "text-base" },
    hero: { time: "text-5xl sm:text-6xl", date: "text-lg", day: "text-lg" },
  }[size];

  return (
    <div className={cn("font-mono tabular-nums", className)}>
      <p
        className={cn(
          "font-semibold tracking-tight text-foreground/90",
          sizeClasses.day,
        )}
      >
        {day}
      </p>
      <p className={cn("text-muted-foreground", sizeClasses.date)}>{date}</p>
      <p
        className={cn(
          "mt-1 font-bold tracking-wider text-primary",
          sizeClasses.time,
        )}
      >
        {time}
      </p>
      {showTimezone && (
        <p className="mt-1 text-xs text-subtle" suppressHydrationWarning>
          {tz.replace(/_/g, " ")} · {abbr}
        </p>
      )}
    </div>
  );
}
