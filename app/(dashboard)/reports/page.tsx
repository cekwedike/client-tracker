import { PageHeader } from "@/components/layout/sidebar";
import { ReportsPanel } from "@/components/reports/reports-panel";
import { getReports } from "@/lib/actions/chat";
import { getClients } from "@/lib/actions/clients";

export default async function ReportsPage() {
  const [clients, handoffs, weeklyReports] = await Promise.all([
    getClients(),
    getReports("daily_handoff"),
    getReports("weekly_client"),
  ]);

  return (
    <>
      <PageHeader
        title="Reports"
        description="Daily handoffs and weekly client snapshots"
      />
      <ReportsPanel
        clients={clients.map((c) => ({ id: c.id, company_name: c.company_name }))}
        handoffs={handoffs}
        weeklyReports={weeklyReports}
      />
    </>
  );
}
