import Link from "next/link";
import { Suspense } from "react";
import { ClientsPageHeader } from "@/components/clients/clients-page-header";
import { ClientsOfflineShell } from "@/components/clients/clients-offline-shell";
import { ClientsWorkspace } from "@/components/clients/clients-workspace";
import { QuickAddClientDialog } from "@/components/clients/quick-add-dialog";
import { getCurrentUser } from "@/lib/actions/auth";
import { getClients, getProfiles } from "@/lib/actions/clients";
import { getMessageTemplates } from "@/lib/actions/templates";
import { getTasks } from "@/lib/actions/tasks";
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
  const [clients, tasks, profiles, templates, user] = await Promise.all([
    getClients({
      search: params.search,
      billing_model: params.billing_model,
      status: params.status,
    }),
    getTasks(),
    getProfiles(),
    getMessageTemplates(),
    getCurrentUser(),
  ]);

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
        <ClientsOfflineShell serverClients={clients}>
          {(displayClients) => (
            <ClientsWorkspace
              clients={displayClients}
              initialClientId={params.client ?? null}
              tasks={tasks}
              profiles={profiles ?? []}
              templates={templates}
              userRole={user?.role ?? "operator"}
            />
          )}
        </ClientsOfflineShell>
      </Suspense>
    </>
  );
}
