/**
 * Meridian role-based permission matrix
 *
 * | Action                    | superadmin | admin | manager | operator | viewer |
 * |---------------------------|------------|-------|---------|----------|--------|
 * | View clients/tasks/team   |     ✓      |   ✓   |    ✓    |    ✓     |   ✓    |
 * | Edit clients              |     ✓      |   ✓   |    ✓    | assigned |   ✗    |
 * | Manage templates (CRUD)   |     ✓      |   ✓   |    ✓    |    ✓     |   ✗    |
 * | Delete templates          |     ✓      |   ✓   |    ✗    |    ✗     |   ✗    |
 * | Assign tasks              |     ✓      |   ✓   |    ✓    |    ✗     |   ✗    |
 * | Invite team members       |     ✓      |   ✓   |    ✗    |    ✗     |   ✗    |
 * | Change member roles       |     ✓      |   ✓   |    ✗    |    ✗     |   ✗    |
 * | Remove team members       |     ✓      |   ✓*  |    ✗    |    ✗     |   ✗    |
 * | Permanently delete members|     ✓†     |   ✗   |    ✗    |    ✗     |   ✗    |
 * | Refresh spreadsheet       |     ✓      |   ✓   |    ✗    |    ✗     |   ✗    |
 * | Delete clients            |     ✓      |   ✓   |    ✗    |    ✗     |   ✗    |
 *
 * * Admins cannot remove other admins or superadmins; superadmin can remove admins.
 * † Permanent delete (inactive members only) removes profile + auth account; Remove only deactivates.
 */
import type { UserRole } from "@/lib/types";

const PLATFORM_ADMIN: UserRole[] = ["superadmin", "admin"];
const MANAGER_PLUS: UserRole[] = ["superadmin", "admin", "manager"];
const OPS_ROLES: UserRole[] = ["superadmin", "admin", "manager", "operator"];

export function isPlatformAdmin(role: UserRole): boolean {
  return PLATFORM_ADMIN.includes(role);
}

export function isSuperadmin(role: UserRole): boolean {
  return role === "superadmin";
}

export function canManageTemplates(role: UserRole): boolean {
  return OPS_ROLES.includes(role);
}

export function canDeleteTemplate(role: UserRole): boolean {
  return isPlatformAdmin(role);
}

export function canAssignTasks(role: UserRole): boolean {
  return MANAGER_PLUS.includes(role);
}

export function canChangeRole(role: UserRole): boolean {
  return isPlatformAdmin(role);
}

export function canRemoveMember(role: UserRole): boolean {
  return isPlatformAdmin(role);
}

export function canRefreshSpreadsheet(role: UserRole): boolean {
  return isPlatformAdmin(role);
}

export function canEditClient(role: UserRole, isAssignedOwner: boolean): boolean {
  if (isPlatformAdmin(role) || role === "manager") return true;
  if (role === "operator") return isAssignedOwner;
  return false;
}

export function canRemoveAdmin(actorRole: UserRole, targetRole: UserRole): boolean {
  if (targetRole === "superadmin") return false;
  if (actorRole === "superadmin") return true;
  return actorRole === "admin" && targetRole !== "admin";
}

export function canRemoveMemberRole(actorRole: UserRole, targetRole: UserRole): boolean {
  if (!canRemoveMember(actorRole)) return false;
  return canRemoveAdmin(actorRole, targetRole);
}

/** Hard-delete profile + auth user. Superadmin only; UI targets inactive members. */
export function canPermanentlyDeleteMember(role: UserRole): boolean {
  return isSuperadmin(role);
}

export function canExportClients(role: UserRole): boolean {
  return OPS_ROLES.includes(role);
}

export function canInviteMembers(role: UserRole): boolean {
  return isPlatformAdmin(role);
}

/** Roles an actor may assign when inviting a new team member. */
export function getInviteAssignableRoles(actorRole: UserRole): UserRole[] {
  if (isSuperadmin(actorRole)) {
    return ["superadmin", "admin", "manager", "operator", "viewer"];
  }
  if (isPlatformAdmin(actorRole)) {
    return ["manager", "operator", "viewer"];
  }
  return [];
}

export function canAssignRoleOnInvite(actorRole: UserRole, targetRole: UserRole): boolean {
  return getInviteAssignableRoles(actorRole).includes(targetRole);
}
