/**
 * Meridian role-based permission matrix
 *
 * | Action                    | admin | manager | operator | viewer |
 * |---------------------------|-------|---------|----------|--------|
 * | View clients/tasks/team   |  ✓    |   ✓     |    ✓     |   ✓    |
 * | Edit clients              |  ✓    |   ✓     | assigned |   ✗    |
 * | Manage templates (CRUD)   |  ✓    |   ✓     |    ✓     |   ✗    |
 * | Delete templates          |  ✓    |   ✗     |    ✗     |   ✗    |
 * | Assign tasks              |  ✓    |   ✓     |    ✗     |   ✗    |
 * | Change member roles       |  ✓    |   ✗     |    ✗     |   ✗    |
 * | Remove team members       |  ✓    |   ✗     |    ✗     |   ✗    |
 * | Refresh spreadsheet       |  ✓    |   ✗     |    ✗     |   ✗    |
 * | Delete clients            |  ✓    |   ✗     |    ✗     |   ✗    |
 */
import type { UserRole } from "@/lib/types";

const MANAGER_PLUS: UserRole[] = ["admin", "manager"];
const OPS_ROLES: UserRole[] = ["admin", "manager", "operator"];

export function canManageTemplates(role: UserRole): boolean {
  return OPS_ROLES.includes(role);
}

export function canDeleteTemplate(role: UserRole): boolean {
  return role === "admin";
}

export function canAssignTasks(role: UserRole): boolean {
  return MANAGER_PLUS.includes(role);
}

export function canChangeRole(role: UserRole): boolean {
  return role === "admin";
}

export function canRemoveMember(role: UserRole): boolean {
  return role === "admin";
}

export function canRefreshSpreadsheet(role: UserRole): boolean {
  return role === "admin";
}

export function canEditClient(role: UserRole, isAssignedOwner: boolean): boolean {
  if (role === "admin" || role === "manager") return true;
  if (role === "operator") return isAssignedOwner;
  return false;
}

export function canRemoveAdmin(actorRole: UserRole, targetRole: UserRole): boolean {
  return actorRole === "admin" && targetRole !== "admin";
}

export function canBulkAssign(role: UserRole): boolean {
  return MANAGER_PLUS.includes(role);
}

export function canExportClients(role: UserRole): boolean {
  return OPS_ROLES.includes(role);
}

export function canInviteMembers(role: UserRole): boolean {
  return role === "admin";
}
