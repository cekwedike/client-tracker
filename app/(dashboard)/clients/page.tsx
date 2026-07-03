import Link from "next/link";
import { Suspense } from "react";
import { ClientsPageHeader } from "@/components/clients/clients-page-header";
import { ClientsOfflineShell } from "@/components/clients/clients-offline-shell";
import { QuickAddClientDialog } from "@/components/clients/quick-add-dialog";
import { safeGetClientsPageData } from "@/lib/actions/clients-page-data";
import { Button } from "@/components/ui/button";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    billing_model?: string;
    status?: string;
    client?: string;
  }>;
}

export default async function ClientsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { clients, tasks, profiles, templates, userRole } =
    await safeGetClientsPageData({
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
        <ClientsOfflineShell
          serverClients={clients}
          initialClientId={params.client ?? null}
          tasks={tasks}
          profiles={profiles}
          templates={templates}
          userRole={userRole}
        />
      </Suspense>
    </>
  );
}
