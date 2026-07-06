import { DashboardHero } from "@/components/layout/dashboard-hero";
import { PageHeader } from "@/components/layout/sidebar";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { TasksWorkspace } from "@/components/tasks/tasks-workspace";
import { getTasks } from "@/lib/actions/tasks";
import { getClientOptions, getProfiles } from "@/lib/actions/clients";
import { getCurrentUser } from "@/lib/actions/auth";
import { canAssignTasks } from "@/lib/permissions";

export default async function TasksPage() {
  const [tasks, clients, profiles, user] = await Promise.all([
    getTasks(),
    getClientOptions(),
    getProfiles(),
    getCurrentUser(),
  ]);

  const canAssign = user ? canAssignTasks(user.role) : false;

  return (
    <>
      <DashboardHero>
        <PageHeader
          title="Tasks"
          description="Delegate inbox work, copy reviews, and client follow-ups"
        >
          <CreateTaskDialog clients={clients} profiles={profiles} />
        </PageHeader>
      </DashboardHero>

      {user ? (
        <TasksWorkspace
          tasks={tasks}
          profiles={profiles}
          currentUserId={user.id}
          canAssign={canAssign}
        />
      ) : null}
    </>
  );
}
