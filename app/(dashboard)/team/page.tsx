import { getTeamMatrix } from "@/lib/actions/chat";
import { getCurrentUser } from "@/lib/actions/auth";
import { TeamMatrix } from "@/components/team/team-matrix";

export default async function TeamPage() {
  const [matrix, currentUser] = await Promise.all([
    getTeamMatrix(),
    getCurrentUser(),
  ]);

  if (!currentUser) return null;

  return (
    <TeamMatrix
      profiles={matrix.profiles}
      clients={matrix.clients}
      currentUser={currentUser}
    />
  );
}
