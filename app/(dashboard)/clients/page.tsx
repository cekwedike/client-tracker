import Link from "next/link";
import { Suspense } from "react";
import { ClientsPageHeader } from "@/components/clients/clients-page-header";
import { ClientsWorkspace } from "@/components/clients/clients-workspace";
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
      <ClientsPageHeader>
        <Link href="/clients/new">
          <Button variant="outline" className="border-border/80 bg-background/40 text-foreground hover:bg-muted">
            Full Form
          </Button>
        </Link>
        <QuickAddClientDialog />
      </ClientsPageHeader>

      <Suspense fallback={<div className="mb-6 text-sm text-muted-foreground">Loading filters...</div>}>
        <ClientsWorkspace clients={clients} />
      </Suspense>
    </>
  );
}
