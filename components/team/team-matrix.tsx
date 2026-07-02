"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/sidebar";
import { BillingBadge, StatusBadge } from "@/components/clients/billing-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateUserRole } from "@/lib/actions/auth";
import type { Client, Profile, UserRole } from "@/lib/types";
import { toast } from "sonner";

const ROLES: UserRole[] = ["admin", "manager", "operator", "viewer"];

export function TeamMatrix({
  profiles,
  clients,
  currentUser,
}: {
  profiles: Profile[];
  clients: Pick<Client, "id" | "company_name" | "status" | "billing_model" | "primary_owner_id">[];
  currentUser: Profile;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRoleChange = (userId: string, role: UserRole) => {
    startTransition(async () => {
      try {
        await updateUserRole(userId, role);
        toast.success("Role updated");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to update role");
      }
    });
  };

  return (
    <>
      <PageHeader
        title="Team"
        description="Responsibility matrix — who owns which clients"
      />

      {currentUser.role === "admin" && (
        <div className="mb-6 rounded-lg border p-4">
          <h3 className="mb-3 text-sm font-medium">Team Members</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Clients Owned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => {
                const owned = clients.filter(
                  (c) => c.primary_owner_id === profile.id,
                ).length;
                return (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">
                      {profile.full_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {profile.email}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={profile.role}
                        onValueChange={(v) =>
                          handleRoleChange(profile.id, (v as UserRole) ?? profile.role)
                        }
                        disabled={isPending || profile.id === currentUser.id}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => (
                            <SelectItem key={r} value={r} className="capitalize">
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{owned}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Billing</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned Operator</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => {
              const owner = profiles.find(
                (p) => p.id === client.primary_owner_id,
              );
              return (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    {client.company_name}
                  </TableCell>
                  <TableCell>
                    <BillingBadge model={client.billing_model} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={client.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {owner?.full_name ?? "Unassigned"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
