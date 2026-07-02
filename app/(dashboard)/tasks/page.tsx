import { DashboardHero } from "@/components/layout/dashboard-hero";
import { PageHeader } from "@/components/layout/sidebar";
import { KanbanBoard, TaskList } from "@/components/tasks/kanban-board";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { getTasks } from "@/lib/actions/tasks";
import { getClientOptions, getProfiles } from "@/lib/actions/clients";
import { getCurrentUser } from "@/lib/actions/auth";
import { canAssignTasks } from "@/lib/permissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function TasksPage() {
  const [tasks, clients, profiles, user] = await Promise.all([
    getTasks(),
    getClientOptions(),
    getProfiles(),
    getCurrentUser(),
  ]);

  const myTasks = user ? tasks.filter((t) => t.assignee_id === user.id) : [];
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

      <Tabs defaultValue="board">
        <TabsList className="glass-panel">
          <TabsTrigger value="board">Kanban Board</TabsTrigger>
          <TabsTrigger value="my-work">My Work ({myTasks.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="board" className="mt-4">
          <KanbanBoard tasks={tasks} profiles={profiles} canAssign={canAssign} />
        </TabsContent>
        <TabsContent value="my-work" className="mt-4">
          <TaskList tasks={myTasks} title="My Work" />
        </TabsContent>
      </Tabs>
    </>
  );
}
