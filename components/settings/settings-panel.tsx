"use client";

import { LiveClock } from "@/components/dashboard/live-clock";
import { useSettings } from "@/components/providers/settings-provider";
import { MotionFadeUp } from "@/components/layout/motion";
import { ProfileSettings } from "@/components/settings/profile-settings";
import { TimezoneSettings } from "@/components/settings/timezone-settings";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Clock, LayoutGrid, RotateCcw } from "lucide-react";
import { SpreadsheetRefreshPanel } from "@/components/settings/spreadsheet-refresh-panel";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { PermissionMatrix } from "@/components/settings/permission-matrix";
import { ExportClientsPanel } from "@/components/settings/export-clients-panel";
import { canExportClients, canRefreshSpreadsheet } from "@/lib/permissions";
import type { Profile } from "@/lib/types";

function ToggleGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string; desc?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-lg border px-4 py-2.5 text-left text-sm transition-all",
            value === opt.value
              ? "border-primary/50 bg-primary/15 text-primary shadow-[inset_0_0_0_1px_oklch(0.72_0.14_85_/_25%)]"
              : "border-border/60 bg-muted/20 text-muted-foreground hover:border-border hover:text-foreground",
          )}
        >
          <span className="font-medium">{opt.label}</span>
          {opt.desc && (
            <span className="mt-0.5 block text-xs opacity-80">{opt.desc}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function SettingsPanel({ user }: { user: Profile }) {
  const { timeFormat, density, setTimeFormat, setDensity, resetSettings } =
    useSettings();

  return (
    <div className="space-y-6">
      <MotionFadeUp>
        <ProfileSettings user={user} />
      </MotionFadeUp>

      <MotionFadeUp delay={0.04}>
        <div className="glass-panel gradient-border p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Clock className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-foreground">
                Live Clock Preview
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Updates every second using your timezone preference
              </p>
              <div className="mt-4 rounded-xl border border-border/60 bg-[#0D0F12]/50 p-5">
                <LiveClock size="lg" />
              </div>
            </div>
          </div>
        </div>
      </MotionFadeUp>

      <MotionFadeUp delay={0.06}>
        <TimezoneSettings />
      </MotionFadeUp>

      <MotionFadeUp delay={0.08}>
        <div className="glass-panel gradient-border p-6">
          <h2 className="text-lg font-semibold text-foreground">Time Format</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Applies to dashboard clock, client local times, and all badges
            app-wide
          </p>
          <div className="mt-4">
            <ToggleGroup
              value={timeFormat}
              onChange={setTimeFormat}
              options={[
                { value: "24h", label: "24-hour", desc: "14:30:45" },
                { value: "12h", label: "12-hour", desc: "2:30:45 PM" },
              ]}
            />
          </div>
        </div>
      </MotionFadeUp>

      <MotionFadeUp delay={0.1}>
        <div className="glass-panel gradient-border p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">
                Display Density
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Adjust spacing on client cards and lists
              </p>
              <div className="mt-4">
                <ToggleGroup
                  value={density}
                  onChange={setDensity}
                  options={[
                    {
                      value: "comfortable",
                      label: "Comfortable",
                      desc: "More breathing room",
                    },
                    {
                      value: "compact",
                      label: "Compact",
                      desc: "More rows on screen",
                    },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </MotionFadeUp>

      <MotionFadeUp delay={0.12}>
        <NotificationSettings />
      </MotionFadeUp>

      <MotionFadeUp delay={0.14}>
        <PermissionMatrix />
      </MotionFadeUp>

      {canExportClients(user.role) && (
        <MotionFadeUp delay={0.16}>
          <ExportClientsPanel />
        </MotionFadeUp>
      )}

      {canRefreshSpreadsheet(user.role) && <SpreadsheetRefreshPanel />}

      <MotionFadeUp delay={0.18}>
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={resetSettings}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset preferences to defaults
          </Button>
        </div>
      </MotionFadeUp>
    </div>
  );
}
