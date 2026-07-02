import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/sidebar";
import { ClientStats } from "@/components/clients/client-stats";
import { ClientsTable } from "@/components/clients/clients-table";
import { ClientFilters } from "@/components/clients/client-filters";
import { QuickAddClientDialog } from "@/components/clients/quick-add-dialog";
import { getClients } from "@/lib/actions/clients";
import { Button } from "@/components/ui/button";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    billing_model?: string;
    status?: string;
  }>;
}

export default async function ClientsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const clients = await getClients({
    search: params.search,
    billing_model: params.billing_model,
    status: params.status,
  });

  return (
    <>
      <PageHeader
        title="Clients"
        description="Client operations hub — inbox timing, contacts, and deal types at a glance"
      >
        <Link href="/clients/new">
          <Button variant="outline">Full Form</Button>
        </Link>
        <QuickAddClientDialog />
      </PageHeader>

      <ClientStats clients={clients} />

      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading filters...</div>}>
        <ClientFilters />
      </Suspense>

      <ClientsTable clients={clients} />
    </>
  );
}
