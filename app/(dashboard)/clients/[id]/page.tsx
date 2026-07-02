import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/sidebar";
import { BillingBadge, StatusBadge } from "@/components/clients/billing-badge";
import { LocalTimeBadge } from "@/components/clients/local-time-badge";
import { CCPlaybookPanel } from "@/components/clients/cc-playbook";
import { ClientNotes } from "@/components/clients/client-notes";
import { getClient, getClientNotes } from "@/lib/actions/clients";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DEAL_TYPES, TIMEZONE_OPTIONS } from "@/lib/types";
import { ExternalLink, Mail, Pencil, Phone, User } from "lucide-react";
import { formatLocalDateTime, formatClientLocation } from "@/lib/timezone";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params;

  let client;
  let notes;
  try {
    [client, notes] = await Promise.all([getClient(id), getClientNotes(id)]);
  } catch {
    notFound();
  }

  const tzLabel =
    TIMEZONE_OPTIONS.find((t) => t.value === client.timezone)?.label ??
    client.timezone;
  const dealInfo = DEAL_TYPES.find((b) => b.value === client.billing_model);
  const ccContact =
    client.contacts.find((c) => c.is_default_cc) ??
    client.contacts.find((c) => c.role === "cc_manager");
  const primaryContact = client.contacts.find((c) => c.role === "primary");
  const displayPhone =
    ccContact?.phone ?? primaryContact?.phone ?? client.contacts.find((c) => c.phone)?.phone;
  const displayEmail =
    ccContact?.email ?? primaryContact?.email ?? client.contacts.find((c) => c.email)?.email;

  return (
    <>
      <PageHeader
        title={client.company_name}
        description={[
          client.primary_contact_name,
          client.industry,
          formatClientLocation(client.city, client.state_region, client.timezone),
        ]
          .filter(Boolean)
          .join(" · ")}
      >
        <Link href={`/clients/${id}/edit`}>
          <Button variant="outline" className="gap-2">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </Link>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <BillingBadge model={client.billing_model} />
                <StatusBadge status={client.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Local Time</p>
                <div className="mt-1">
                  <LocalTimeBadge
                    timezone={client.timezone}
                    businessHours={client.business_hours}
                    doNotContactBefore={client.do_not_contact_before}
                    doNotContactAfter={client.do_not_contact_after}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{tzLabel}</p>
                <p className="text-xs text-muted-foreground">
                  {formatLocalDateTime(client.timezone)}
                </p>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Primary Contact</p>
                    <p className="font-medium">{client.primary_contact_name ?? "—"}</p>
                  </div>
                </div>
                {ccContact && (
                  <div>
                    <p className="text-xs text-muted-foreground">CC in responses</p>
                    <p className="font-medium text-primary">
                      {ccContact.cc_alias ?? ccContact.name}
                    </p>
                  </div>
                )}
                {displayEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <a
                      href={`mailto:${displayEmail}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {displayEmail}
                    </a>
                  </div>
                )}
                {displayPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <a
                      href={`tel:${displayPhone.replace(/[^\d+]/g, "")}`}
                      className="font-medium hover:text-primary"
                    >
                      {displayPhone}
                    </a>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Location: </span>
                  {formatClientLocation(client.city, client.state_region, client.timezone)}
                </div>
                <div>
                  <span className="text-muted-foreground">Industry: </span>
                  {client.industry ?? "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">Owner: </span>
                  {client.primary_owner?.full_name ?? "Unassigned"}
                </div>
                <div>
                  <span className="text-muted-foreground">KPI Focus: </span>
                  {dealInfo?.kpi ?? "—"}
                </div>
              </div>

              {client.smartlead_inbox_url && (
                <>
                  <Separator />
                  <a
                    href={client.smartlead_inbox_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Inbox Link
                  </a>
                </>
              )}
            </CardContent>
          </Card>

          <CCPlaybookPanel contacts={client.contacts} />
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {client.contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="rounded-lg border border-border/50 p-3 text-sm"
                  >
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {contact.role.replace("_", " ")}
                    </p>
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="mt-1 block text-primary hover:underline"
                      >
                        {contact.email}
                      </a>
                    )}
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
                        className="block text-muted-foreground hover:text-foreground"
                      >
                        {contact.phone}
                      </a>
                    )}
                    {contact.cc_alias && (
                      <p className="mt-1 text-primary">
                        Mention as: {contact.cc_alias}
                      </p>
                    )}
                    {contact.special_instructions && (
                      <p className="mt-2 text-amber-400/90 text-xs">
                        {contact.special_instructions}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {(client.services_offered ||
            client.icp_notes ||
            client.internal_notes ||
            client.smartlead_operator_notes) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Intel & Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {client.services_offered && (
                  <div>
                    <p className="text-xs text-muted-foreground">Services</p>
                    <p>{client.services_offered}</p>
                  </div>
                )}
                {client.icp_notes && (
                  <div>
                    <p className="text-xs text-muted-foreground">ICP Notes</p>
                    <p>{client.icp_notes}</p>
                  </div>
                )}
                {client.internal_notes && (
                  <div>
                    <p className="text-xs text-muted-foreground">Internal Notes</p>
                    <p>{client.internal_notes}</p>
                  </div>
                )}
                {client.smartlead_operator_notes && (
                  <div>
                    <p className="text-xs text-muted-foreground">Inbox Notes</p>
                    <p>{client.smartlead_operator_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ClientNotes clientId={id} notes={notes ?? []} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
