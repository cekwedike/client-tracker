"use client";

import { Bell, BellOff } from "lucide-react";
import { useSettings } from "@/components/providers/settings-provider";
import { Button } from "@/components/ui/button";
import { requestNotificationPermission } from "@/hooks/use-contact-window-notifications";
import { toast } from "sonner";

export function NotificationSettings() {
  const { browserNotifications, setBrowserNotifications } = useSettings();

  const handleToggle = async (enabled: boolean) => {
    if (enabled) {
      const permission = await requestNotificationPermission();
      if (permission !== "granted") {
        toast.error("Browser notifications were blocked");
        setBrowserNotifications(false);
        return;
      }
      toast.success("Notifications enabled — alerts when windows open or close soon");
    }
    setBrowserNotifications(enabled);
  };

  return (
    <div className="glass-panel gradient-border p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          {browserNotifications ? (
            <Bell className="h-5 w-5" />
          ) : (
            <BellOff className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-foreground">Browser notifications</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Get notified when a client enters their contact window or when it closes
            within 15 minutes. Checks run every minute on the dashboard.
          </p>
          <div className="mt-4 flex gap-2">
            <Button
              variant={browserNotifications ? "default" : "outline"}
              size="sm"
              onClick={() => handleToggle(true)}
            >
              Enable
            </Button>
            <Button
              variant={!browserNotifications ? "default" : "outline"}
              size="sm"
              onClick={() => handleToggle(false)}
            >
              Disable
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
