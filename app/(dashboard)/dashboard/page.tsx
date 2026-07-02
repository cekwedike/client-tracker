import { OpsDashboardLoader } from "@/components/dashboard/ops-dashboard-loader";
import { getClientsForDashboard } from "@/lib/actions/clients";
import { getRecentActivity } from "@/lib/actions/activity";
import { getTasks } from "@/lib/actions/tasks";

export default async function DashboardPage() {
  const [clients, tasks, activity] = await Promise.all([
    getClientsForDashboard(),
    getTasks(),
    getRecentActivity(12),
  ]);

  return (
    <OpsDashboardLoader clients={clients} tasks={tasks} activity={activity} />
  );
}
