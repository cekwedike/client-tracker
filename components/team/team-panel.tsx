"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  reactivateTeamMember,
  removeTeamMember,
  updateMemberRole,
} from "@/lib/actions/team";
import { canChangeRole, canInviteMembers, canRemoveMemberRole, isSuperadmin } from "@/lib/permissions";
import { InviteMemberForm } from "@/components/team/invite-member-form";
import { PermissionMatrix } from "@/components/settings/permission-matrix";
import type { Profile, UserRole } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Shield, UserMinus, UserPlus, Users } from "lucide-react";

const ROLE_BADGE: Record<UserRole, string> = {
  superadmin: "border-amber-400/50 bg-amber-400/15 text-amber-300",
  admin: "border-primary/40 bg-primary/15 text-primary",
  manager: "border-deal-ppl/40 bg-deal-ppl/15 text-deal-ppl-fg",
  operator: "border-border bg-muted/50 text-muted-foreground",
  viewer: "border-border/60 bg-muted/30 text-subtle",
};

export const USER_ROLES_LIST: { value: UserRole; label: string; description: string }[] = [
  { value: "admin", label: "Admin", description: "Full access, manage team & templates" },
  { value: "manager", label: "Manager", description: "Assign tasks, edit clients" },
  { value: "operator", label: "Operator", description: "View/edit assigned work" },
  { value: "viewer", label: "Viewer", description: "Read-only access" },
];

const SUPERADMIN_ROLE = {
  value: "superadmin" as const,
  label: "Superadmin",
  description: "Platform owner — invite users, full settings",
};

interface TeamPanelProps {
  members: Profile[];
  currentUserId: string;
  currentUserRole: UserRole;
}

export function TeamPanel({
  members,
  currentUserId,
  currentUserRole,
}: TeamPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedRole, setSelectedRole] = useState<UserRole>("operator");
  const isAdmin = canChangeRole(currentUserRole);
  const canInvite = canInviteMembers(currentUserRole);
  const isSuperAdmin = isSuperadmin(currentUserRole);

  const activeCount = members.filter((m) => m.is_active !== false).length;

  const handleRoleChange = (userId: string, role: UserRole) => {
    startTransition(async () => {
      try {
        await updateMemberRole(userId, role);
        toast.success("Role updated");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to update role");
      }
    });
  };

  const handleRemove = (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from the team? They will lose access.`)) return;
    startTransition(async () => {
      try {
        await removeTeamMember(userId);
        toast.success("Member removed");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to remove member");
      }
    });
  };

  const handleReactivate = (userId: string) => {
    startTransition(async () => {
      try {
        await reactivateTeamMember(userId);
        toast.success("Member reactivated");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to reactivate");
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="glass-panel gradient-border p-4">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold tabular-nums">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Active members</p>
            </div>
          </div>
        </div>
        {USER_ROLES_LIST.slice(0, 2).map((role) => (
          <div key={role.value} className="glass-panel gradient-border p-4">
            <p className="text-2xl font-bold tabular-nums">
              {members.filter((m) => m.role === role.value && m.is_active !== false).length}
            </p>
            <p className="text-xs text-muted-foreground">{role.label}s</p>
          </div>
        ))}
      </div>

      {canInvite && <InviteMemberForm currentUserRole={currentUserRole} />}

      {isAdmin && (
        <div className="glass-panel gradient-border p-4">
          <div className="mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Roles & permissions</p>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            Select a role to see its permissions below.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {[SUPERADMIN_ROLE, ...USER_ROLES_LIST].map((role) => {
              const isSelected = selectedRole === role.value;
              return (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setSelectedRole(role.value)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-left transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                    isSelected
                      ? "bg-primary/10 ring-2 ring-primary/50 shadow-[0_0_12px_oklch(0.72_0.14_85_/_12%)]"
                      : "bg-muted/30 hover:bg-muted/50",
                  )}
                >
                  <Badge variant="outline" className={cn("text-[10px]", ROLE_BADGE[role.value])}>
                    {role.label}
                  </Badge>
                  <p className="mt-1 text-xs text-muted-foreground">{role.description}</p>
                </button>
              );
            })}
          </div>
          <div className="mt-4 rounded-lg border border-border/40 bg-muted/20 p-4">
            <PermissionMatrix selectedRole={selectedRole} compact />
          </div>
        </div>
      )}

      <div className="glass-panel gradient-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              {isAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 5 : 4}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
                  <p>No team members yet.</p>
                  <p className="mt-1 text-xs">
                    You should appear here after signup — if you are logged in but
                    see this, your profile row may be missing from the database.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => {
              const inactive = member.is_active === false;
              const isSelf = member.id === currentUserId;
              const canEditRole =
                isAdmin &&
                !isSelf &&
                !inactive &&
                (member.role !== "superadmin" || isSuperAdmin);
              const canRemove = canRemoveMemberRole(currentUserRole, member.role);
              const roleOptions =
                isSuperAdmin && member.role === "superadmin"
                  ? [SUPERADMIN_ROLE, ...USER_ROLES_LIST]
                  : USER_ROLES_LIST;
              return (
                <TableRow key={member.id} className={cn(inactive && "opacity-50")}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/20 text-xs text-primary">
                          {member.full_name?.[0]?.toUpperCase() ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {member.full_name ?? "Unnamed"}
                          {isSelf && (
                            <span className="ml-1.5 text-xs text-primary">(you)</span>
                          )}
                        </p>
                        {inactive && (
                          <Badge variant="outline" className="mt-0.5 text-[10px]">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {member.email}
                  </TableCell>
                  <TableCell>
                    {canEditRole ? (
                      <Select
                        value={member.role}
                        onValueChange={(v) =>
                          handleRoleChange(member.id, v as UserRole)
                        }
                        disabled={isPending}
                      >
                        <SelectTrigger className="h-8 w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className={cn("capitalize", ROLE_BADGE[member.role])}>
                        {member.role}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(member.created_at), "MMM d, yyyy")}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      {!isSelf && (
                        inactive ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => handleReactivate(member.id)}
                            disabled={isPending}
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            Reactivate
                          </Button>
                        ) : canRemove ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-destructive hover:text-destructive"
                            onClick={() =>
                              handleRemove(member.id, member.full_name ?? member.email)
                            }
                            disabled={isPending}
                          >
                            <UserMinus className="h-3.5 w-3.5" />
                            Remove
                          </Button>
                        ) : null
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
