import { DashboardHero } from "@/components/layout/dashboard-hero";
import { PageHeader } from "@/components/layout/sidebar";
import { HandoffPanel } from "@/components/handoff/handoff-panel";
import { getClientsForDashboard } from "@/lib/actions/clients";
import { getTasks } from "@/lib/actions/tasks";
import { getProfiles } from "@/lib/actions/clients";

export default async function HandoffPage() {
  const [clients, tasks, profiles] = await Promise.all([
    getClientsForDashboard(),
    getTasks(),
    getProfiles(),
  ]);

  return (
    <>
      <DashboardHero>
        <PageHeader
          title="Handoff"
          description="Shift summary — open windows, pinned clients, and tasks by assignee"
        />
      </DashboardHero>
      <HandoffPanel clients={clients} tasks={tasks} profiles={profiles ?? []} />
    </>
  );
}
