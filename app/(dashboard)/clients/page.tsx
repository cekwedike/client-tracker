import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/sidebar";
import { DashboardHero } from "@/components/layout/dashboard-hero";
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
      <DashboardHero>
        <PageHeader
          title="Clients"
          description="Ops reference — CC names, phones, emails, and live local times for lead responses"
        >
          <Link href="/clients/new">
            <Button variant="outline" className="border-border/80 bg-background/40 text-foreground hover:bg-muted">
              Full Form
            </Button>
          </Link>
          <QuickAddClientDialog />
        </PageHeader>
      </DashboardHero>

      <ClientStats clients={clients} />

      <Suspense fallback={<div className="mb-6 text-sm text-muted-foreground">Loading filters...</div>}>
        <ClientFilters />
      </Suspense>

      <ClientsTable clients={clients} />
    </>
  );
}
