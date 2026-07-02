import { DashboardHero } from "@/components/layout/dashboard-hero";
import { PageHeader } from "@/components/layout/sidebar";
import { TeamPanel } from "@/components/team/team-panel";
import { getCurrentUser } from "@/lib/actions/auth";
import { getTeamMembers } from "@/lib/actions/team";

export default async function TeamPage() {
  const [members, user] = await Promise.all([getTeamMembers(), getCurrentUser()]);

  return (
    <>
      <DashboardHero>
        <PageHeader
          title="Team"
          description="PLNITUDE ops hub — roles, permissions, and task assignment"
        />
      </DashboardHero>
      <TeamPanel
        members={members}
        currentUserId={user?.id ?? ""}
        currentUserRole={user?.role ?? "viewer"}
      />
    </>
  );
}
