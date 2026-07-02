"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/actions/auth";
import {
  canChangeRole,
  canInviteMembers,
  canRemoveAdmin,
  canRemoveMember,
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

  if (userId === currentUser.id && role !== "admin") {
    throw new Error("You cannot demote yourself");
  }

  const supabase = await createClient();
  const { data: target } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (target?.role === "admin" && role !== "admin" && userId !== currentUser.id) {
    // Admins can change other admins' roles
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
  if (target.role === "admin" && !canRemoveAdmin(currentUser.role, target.role)) {
    throw new Error("Cannot remove an admin");
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

/** Invite by email — requires SUPABASE_SERVICE_ROLE_KEY (admin client). */
export async function inviteTeamMember(email: string, fullName?: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !canInviteMembers(currentUser.role)) {
    throw new Error("Only admins can invite team members");
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { getSiteUrl } = await import("@/lib/site-url");
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName ?? email.split("@")[0], role: "operator" },
    redirectTo: `${getSiteUrl()}/auth/callback`,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/team");
  return { success: true, userId: data.user?.id };
}
