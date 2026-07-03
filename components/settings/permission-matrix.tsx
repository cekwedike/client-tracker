"use client";

import {
  canAssignTasks,
  canChangeRole,
  canDeleteTemplate,
  canEditClient,
  canInviteMembers,
  canManageTemplates,
  canRefreshSpreadsheet,
  canRemoveMember,
} from "@/lib/permissions";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

const ROLES: UserRole[] = ["superadmin", "admin", "manager", "operator", "viewer"];

const ACTIONS: {
  label: string;
  check: (role: UserRole) => boolean;
}[] = [
  { label: "View clients, tasks & team", check: () => true },
  { label: "Edit clients", check: (r) => canEditClient(r, true) },
  { label: "Manage templates", check: (r) => canManageTemplates(r) },
  { label: "Delete templates", check: (r) => canDeleteTemplate(r) },
  { label: "Assign tasks", check: (r) => canAssignTasks(r) },
  { label: "Invite team members", check: (r) => canInviteMembers(r) },
  { label: "Remove team members", check: (r) => canRemoveMember(r) },
  { label: "Change member roles", check: (r) => canChangeRole(r) },
  { label: "Refresh spreadsheet", check: (r) => canRefreshSpreadsheet(r) },
];

interface PermissionMatrixProps {
  readOnly?: boolean;
  /** When set, shows only that role's permissions (filtered view). */
  selectedRole?: UserRole;
  /** Hide outer panel chrome — useful when embedded under role cards. */
  compact?: boolean;
}

export function PermissionMatrix({
  readOnly = true,
  selectedRole,
  compact = false,
}: PermissionMatrixProps) {
  void readOnly;

  const displayRoles = selectedRole ? [selectedRole] : ROLES;

  return (
    <div className={cn(!compact && "glass-panel gradient-border overflow-hidden p-6")}>
      {!compact && (
        <>
          <h2 className="text-lg font-semibold text-foreground">Permission matrix</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedRole
              ? `Capabilities for the ${selectedRole} role`
              : "Role capabilities across Meridian — select a role above to focus"}
          </p>
        </>
      )}
      <div className={cn(compact ? "mt-0" : "mt-4", "overflow-x-auto")}>
        <table className="w-full min-w-[280px] text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left">
              <th className="py-2 pr-4 font-medium text-muted-foreground">Action</th>
              {displayRoles.map((role) => (
                <th
                  key={role}
                  className={cn(
                    "px-3 py-2 text-center font-medium capitalize",
                    selectedRole === role && "text-primary",
                  )}
                >
                  {role}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ACTIONS.map((action) => (
              <tr key={action.label} className="border-b border-border/40">
                <td className="py-2.5 pr-4 text-foreground">{action.label}</td>
                {displayRoles.map((role) => {
                  const allowed = action.check(role);
                  return (
                    <td
                      key={role}
                      className={cn(
                        "px-3 py-2.5 text-center",
                        selectedRole === role && "bg-primary/5",
                      )}
                    >
                      {allowed ? (
                        <Check className="mx-auto h-4 w-4 text-emerald-500" />
                      ) : (
                        <X className="mx-auto h-4 w-4 text-muted-foreground/40" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!compact && !selectedRole && (
        <p className="mt-3 text-xs text-muted-foreground">
          Operators can edit only clients they own. Viewers have read-only access.
        </p>
      )}
    </div>
  );
}
