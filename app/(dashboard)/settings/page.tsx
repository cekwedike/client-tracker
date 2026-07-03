import { DashboardHero } from "@/components/layout/dashboard-hero";
import { PageHeader } from "@/components/layout/sidebar";
import { SettingsPanel } from "@/components/settings/settings-panel";
import { getCurrentUser } from "@/lib/actions/auth";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  return (
    <>
      <DashboardHero>
        <PageHeader
          title="Settings"
          description="Profile, display preferences, notifications, and account settings for Meridian"
        />
      </DashboardHero>
      {user && <SettingsPanel user={user} />}
    </>
  );
}
