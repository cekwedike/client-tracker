import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/sidebar";
import { ClientForm } from "@/components/clients/client-form";
import { getClient, getProfiles } from "@/lib/actions/clients";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditClientPage({ params }: PageProps) {
  const { id } = await params;

  let client;
  let profiles;
  try {
    [client, profiles] = await Promise.all([getClient(id), getProfiles()]);
  } catch {
    notFound();
  }

  return (
    <>
      <PageHeader title={`Edit ${client.company_name}`} />
      <ClientForm client={client} profiles={profiles} />
    </>
  );
}
