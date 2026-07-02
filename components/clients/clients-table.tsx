"use client";

import Link from "next/link";
import { BillingBadge, StatusBadge } from "@/components/clients/billing-badge";
import { LocalTimeBadge } from "@/components/clients/local-time-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ClientWithRelations } from "@/lib/types";
import { ExternalLink } from "lucide-react";

export function ClientsTable({ clients }: { clients: ClientWithRelations[] }) {
  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <p className="text-muted-foreground">No clients yet.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Use Quick Add to import from your spreadsheet format.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Deal</TableHead>
            <TableHead>Local Time</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id} className="group">
              <TableCell>
                <Link
                  href={`/clients/${client.id}`}
                  className="font-medium hover:text-emerald-400"
                >
                  {client.company_name}
                </Link>
                {client.smartlead_inbox_url && (
                  <a
                    href={client.smartlead_inbox_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 inline-flex text-muted-foreground hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {client.primary_contact_name ?? "—"}
              </TableCell>
              <TableCell>
                <BillingBadge model={client.billing_model} />
              </TableCell>
              <TableCell>
                <LocalTimeBadge
                  timezone={client.timezone}
                  businessHours={client.business_hours}
                  doNotContactBefore={client.do_not_contact_before}
                  doNotContactAfter={client.do_not_contact_after}
                />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {[client.city, client.state_region].filter(Boolean).join(", ") || "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {client.primary_owner?.full_name ?? "Unassigned"}
              </TableCell>
              <TableCell>
                <StatusBadge status={client.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
