import { OpsDashboardLoader } from "@/components/dashboard/ops-dashboard-loader";
import { getClientsForDashboard, getProfiles } from "@/lib/actions/clients";

export default async function DashboardPage() {
  const [clients, profiles] = await Promise.all([
    getClientsForDashboard(),
    getProfiles(),
  ]);

  return <OpsDashboardLoader clients={clients} profiles={profiles} />;
}
