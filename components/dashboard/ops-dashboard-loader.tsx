"use client";

import dynamic from "next/dynamic";
import { useContactWindowNotifications } from "@/hooks/use-contact-window-notifications";
import { useSettings } from "@/components/providers/settings-provider";
import type { ClientDashboardSummary, Profile } from "@/lib/types";

const OpsDashboard = dynamic(
  () =>
    import("@/components/dashboard/ops-dashboard").then((m) => m.OpsDashboard),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[400px] items-center justify-center text-sm text-muted-foreground">
        Loading dashboard…
      </div>
    ),
  },
);

export function OpsDashboardLoader({
  clients,
  profiles = [],
}: {
  clients: ClientDashboardSummary[];
  profiles?: Profile[];
}) {
  const { browserNotifications } = useSettings();
  useContactWindowNotifications(clients, browserNotifications);

  return <OpsDashboard clients={clients} profiles={profiles} />;
}
