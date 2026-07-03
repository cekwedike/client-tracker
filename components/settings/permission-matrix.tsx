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

const ROLES: UserRole[] = ["superadmin", "admin", "manager", "operator"];

const ACTIONS: {
  label: string;
  check: (role: UserRole) => boolean;
}[] = [
  { label: "Edit clients", check: (r) => canEditClient(r, true) },
  { label: "Manage templates", check: (r) => canManageTemplates(r) },
  { label: "Delete templates", check: (r) => canDeleteTemplate(r) },
  { label: "Assign tasks", check: (r) => canAssignTasks(r) },
  { label: "Invite team members", check: (r) => canInviteMembers(r) },
  { label: "Remove team members", check: (r) => canRemoveMember(r) },
  { label: "Change member roles", check: (r) => canChangeRole(r) },
  { label: "Refresh spreadsheet", check: (r) => canRefreshSpreadsheet(r) },
];

export function PermissionMatrix({ readOnly = true }: { readOnly?: boolean }) {
  void readOnly;

  return (
    <div className="glass-panel gradient-border overflow-hidden p-6">
      <h2 className="text-lg font-semibold text-foreground">Permission matrix</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Role capabilities across Meridian — read-only reference
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left">
              <th className="py-2 pr-4 font-medium text-muted-foreground">Action</th>
              {ROLES.map((role) => (
                <th key={role} className="px-3 py-2 text-center font-medium capitalize">
                  {role}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ACTIONS.map((action) => (
              <tr key={action.label} className="border-b border-border/40">
                <td className="py-2.5 pr-4 text-foreground">{action.label}</td>
                {ROLES.map((role) => {
                  const allowed = action.check(role);
                  return (
                    <td key={role} className="px-3 py-2.5 text-center">
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
      <p className={cn("mt-3 text-xs text-muted-foreground")}>
        Operators can edit only clients they own. Viewers have read-only access (not shown).
      </p>
    </div>
  );
}
