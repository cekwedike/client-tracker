"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/actions/auth";
import {
  canAssignRoleOnInvite,
  canChangeRole,
  canInviteMembers,
  canRemoveMember,
  canRemoveMemberRole,
  isPlatformAdmin,
  isSuperadmin,
} from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { isMissingSchemaError } from "@/lib/supabase/schema";
import type { Profile, UserRole } from "@/lib/types";

const PROFILE_COLUMNS =
  "id, email, full_name, avatar_url, role, created_at, updated_at, is_active";
const PROFILE_COLUMNS_BASE =
  "id, email, full_name, avatar_url, role, created_at, updated_at";

function mergeCurrentUser(members: Profile[], currentUser: Profile | null): Profile[] {
  if (!currentUser) return members;
  if (members.some((m) => m.id === currentUser.id)) return members;
  return [currentUser, ...members];
}

export async function getTeamMembers(): Promise<Profile[]> {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .order("full_name");

  if (!error) {
    return mergeCurrentUser((data ?? []) as Profile[], currentUser);
  }

  if (isMissingSchemaError(error, "is_active")) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS_BASE)
      .order("full_name");

    if (!fallbackError) {
      return mergeCurrentUser((fallbackData ?? []) as Profile[], currentUser);
    }

    if (!isMissingSchemaError(fallbackError, "profiles")) {
      return mergeCurrentUser([], currentUser);
    }
  }

  if (isMissingSchemaError(error, "profiles")) {
    return mergeCurrentUser([], currentUser);
  }

  return mergeCurrentUser([], currentUser);
}

export async function updateMemberRole(userId: string, role: UserRole) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !canChangeRole(currentUser.role)) {
    throw new Error("Only admins can change roles");
  }

  if (userId === currentUser.id) {
    if (isSuperadmin(currentUser.role) && !isSuperadmin(role)) {
      throw new Error("You cannot demote yourself");
    }
    if (currentUser.role === "admin" && !isPlatformAdmin(role)) {
      throw new Error("You cannot demote yourself");
    }
  }

  if (role === "superadmin" && !isSuperadmin(currentUser.role)) {
    throw new Error("Only superadmins can assign the superadmin role");
  }

  const supabase = await createClient();
  const { data: target } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (target?.role === "superadmin" && !isSuperadmin(currentUser.role)) {
    throw new Error("Only superadmins can change a superadmin role");
  }

  if (target?.role === "admin" && role !== "admin" && userId !== currentUser.id) {
    // Platform admins can change other admins' roles
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/team");
  revalidatePath("/tasks");
  return { success: true };
}

/** Soft-remove: sets is_active = false. Does not delete auth.users. */
export async function removeTeamMember(userId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !canRemoveMember(currentUser.role)) {
    throw new Error("Only admins can remove team members");
  }

  if (userId === currentUser.id) {
    throw new Error("You cannot remove yourself");
  }

  const supabase = await createClient();
  const { data: target } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", userId)
    .single();

  if (!target) throw new Error("Member not found");
  if (!canRemoveMemberRole(currentUser.role, target.role)) {
    throw new Error(
      target.role === "superadmin"
        ? "Cannot remove a superadmin"
        : "Cannot remove an admin",
    );
  }

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: false })
    .eq("id", userId);

  if (error) {
    if (isMissingSchemaError(error, "is_active")) {
      throw new Error(
        "Member removal requires migration 002 (is_active column). Run it in the Supabase SQL editor.",
      );
    }
    throw new Error(error.message);
  }
  revalidatePath("/team");
  return { success: true };
}

export async function reactivateTeamMember(userId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !canRemoveMember(currentUser.role)) {
    throw new Error("Only admins can reactivate members");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: true })
    .eq("id", userId);

  if (error) {
    if (isMissingSchemaError(error, "is_active")) {
      throw new Error(
        "Member reactivation requires migration 002 (is_active column). Run it in the Supabase SQL editor.",
      );
    }
    throw new Error(error.message);
  }
  revalidatePath("/team");
  return { success: true };
}

export type InviteTeamMemberResult =
  | { ok: true; userId?: string }
  | { ok: false; error: string };

function mapInviteError(message: string): string {
  const lower = message.toLowerCase();

  if (
    lower.includes("already been registered") ||
    lower.includes("already exists") ||
    lower.includes("user already registered") ||
    lower.includes("email address has already")
  ) {
    return "That email already has an account. They can sign in, or you can remove and re-invite them.";
  }
  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "Too many invites sent. Wait a few minutes and try again.";
  }
  if (lower.includes("redirect") && lower.includes("invalid")) {
    return "Invite link is misconfigured. Set NEXT_PUBLIC_SITE_URL on Vercel and add the callback URL in Supabase Auth settings.";
  }
  if (lower.includes("invalid email") || lower.includes("unable to validate email")) {
    return "Please enter a valid email address.";
  }
  if (lower.includes("smtp") || lower.includes("email provider")) {
    return "Could not send the invite email. Check Supabase Auth email settings.";
  }

  return message || "Could not send invite. Try again.";
}

/** Invite by email via admin client (service role, server-only). */
export async function inviteTeamMember(
  email: string,
  fullName?: string,
  role: UserRole = "operator",
): Promise<InviteTeamMemberResult> {
  try {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return { ok: false, error: "Please enter a valid email address." };
    }

    const currentUser = await getCurrentUser();
    if (!currentUser || !canInviteMembers(currentUser.role)) {
      return { ok: false, error: "Only admins can invite team members." };
    }

    if (!canAssignRoleOnInvite(currentUser.role, role)) {
      return { ok: false, error: "You cannot assign that role." };
    }

    const { ADMIN_CLIENT_UNAVAILABLE_MESSAGE, createAdminClient } = await import(
      "@/lib/supabase/admin"
    );
    const { getSiteUrl } = await import("@/lib/site-url");

    let admin;
    try {
      admin = createAdminClient();
    } catch {
      return { ok: false, error: ADMIN_CLIENT_UNAVAILABLE_MESSAGE };
    }

    const redirectTo = `${getSiteUrl()}/auth/callback`;
    const { data, error } = await admin.auth.admin.inviteUserByEmail(trimmedEmail, {
      data: {
        full_name: fullName?.trim() || trimmedEmail.split("@")[0],
        role,
        invited: true,
      },
      redirectTo,
    });

    if (error) {
      return { ok: false, error: mapInviteError(error.message) };
    }

    revalidatePath("/team");
    return { ok: true, userId: data.user?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not send invite. Try again.";
    return { ok: false, error: mapInviteError(message) };
  }
}
