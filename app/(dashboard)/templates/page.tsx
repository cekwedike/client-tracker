import { PageHeader } from "@/components/layout/sidebar";
import { TemplatesManager } from "@/components/templates/templates-manager";
import { getClientOptions } from "@/lib/actions/clients";
import { getCurrentUser } from "@/lib/actions/auth";
import { getMessageTemplates } from "@/lib/actions/templates";

export default async function TemplatesPage() {
  const [templates, clients, user] = await Promise.all([
    getMessageTemplates(),
    getClientOptions(),
    getCurrentUser(),
  ]);

  return (
    <>
      <PageHeader
        title="Templates"
        description="Reusable message snippets with placeholders — assign to clients for one-click copy"
      />
      <TemplatesManager
        templates={templates}
        clients={clients}
        userRole={user?.role ?? "viewer"}
      />
    </>
  );
}
