"use client";

import type { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { WEEKDAYS } from "@/lib/types";
import type { ClientFormValues } from "@/lib/validations/client";

export function BusinessHoursEditor({
  form,
}: {
  form: UseFormReturn<ClientFormValues>;
}) {
  const hours = form.watch("business_hours") ?? [];

  return (
    <div className="space-y-3">
      {WEEKDAYS.map((day, dayOfWeek) => {
        const index = hours.findIndex((h) => h.day_of_week === dayOfWeek);
        const row = index >= 0 ? hours[index] : null;
        const isClosed = row?.is_closed ?? (dayOfWeek === 0 || dayOfWeek === 6);

        const update = (patch: Partial<NonNullable<typeof row>>) => {
          const current = [...(form.getValues("business_hours") ?? [])];
          const i =
            current.findIndex((h) => h.day_of_week === dayOfWeek) ??
            current.length;
          const existing = current.find((h) => h.day_of_week === dayOfWeek);
          const next = {
            day_of_week: dayOfWeek,
            start_time: "09:00",
            end_time: "17:00",
            is_closed: isClosed,
            ...existing,
            ...patch,
          };
          if (existing) {
            current[current.findIndex((h) => h.day_of_week === dayOfWeek)] = next;
          } else {
            current.push(next);
          }
          form.setValue("business_hours", current);
        };

        return (
          <div
            key={day}
            className="grid grid-cols-1 items-center gap-2 rounded-lg border border-border/40 p-3 text-sm sm:grid-cols-[100px_1fr_1fr_auto] sm:gap-3 sm:border-0 sm:p-0"
          >
            <span className="font-medium">{day}</span>
            <div className="grid grid-cols-2 gap-2 sm:contents">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Opens</Label>
                <Input
                  type="time"
                  value={row?.start_time ?? "09:00"}
                  disabled={isClosed}
                  onChange={(e) => update({ start_time: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Closes</Label>
                <Input
                  type="time"
                  value={row?.end_time ?? "17:00"}
                  disabled={isClosed}
                  onChange={(e) => update({ end_time: e.target.value })}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs sm:pt-5">
              <input
                type="checkbox"
                checked={isClosed}
                onChange={(e) => update({ is_closed: e.target.checked })}
                className="rounded"
              />
              Closed
            </label>
          </div>
        );
      })}
    </div>
  );
}
