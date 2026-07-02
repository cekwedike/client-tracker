import { OpsDashboard } from "@/components/dashboard/ops-dashboard";
import { getClients } from "@/lib/actions/clients";

export default async function DashboardPage() {
  const clients = await getClients();

  return <OpsDashboard clients={clients} />;
}
