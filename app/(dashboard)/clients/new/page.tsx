import { PageHeader } from "@/components/layout/sidebar";
import { ClientForm } from "@/components/clients/client-form";
import { getProfiles } from "@/lib/actions/clients";

export default async function NewClientPage() {
  const profiles = await getProfiles();

  return (
    <>
      <PageHeader
        title="Add Client"
        description="Full client profile with contacts, timezone, and inbox references"
      />
      <ClientForm profiles={profiles} />
    </>
  );
}
