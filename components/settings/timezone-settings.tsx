"use client";

import { useSettings } from "@/components/providers/settings-provider";
import { COMMON_TIMEZONES } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { Globe2 } from "lucide-react";

export function TimezoneSettings() {
  const { operatorTimezone, setOperatorTimezone } = useSettings();

  return (
    <div className="glass-panel gradient-border p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
          <Globe2 className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-foreground">Your timezone</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Used for the dashboard live clock and your local time display
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {COMMON_TIMEZONES.map((tz) => (
              <button
                key={tz.value}
                type="button"
                onClick={() => setOperatorTimezone(tz.value)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm transition-all",
                  operatorTimezone === tz.value
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-border/60 bg-muted/20 text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                {tz.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
