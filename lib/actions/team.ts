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
  | { ok: true; userId?: string; inviteLink?: string; emailNotSent?: boolean }
  | { ok: false; error: string };

type InviteAuthError = {
  message: string;
  code?: string;
  status?: number;
};

const DATABASE_USER_ERROR_HINT =
  "Could not create the invited user — the database trigger that creates profiles failed. Run migrations 004–008 in the Supabase SQL editor, then retry.";

function isUselessAuthMessage(message: string): boolean {
  const trimmed = message.trim();
  return (
    !trimmed ||
    trimmed === "{}" ||
    trimmed === "[]" ||
    trimmed === "[object Object]"
  );
}

function mapInviteError({ message, code, status }: InviteAuthError): string {
  if (isUselessAuthMessage(message)) {
    if (status === 500 || code === "unexpected_failure") {
      return DATABASE_USER_ERROR_HINT;
    }
    return "Could not send invite. Try again.";
  }

  switch (code) {
    case "email_exists":
    case "user_already_exists":
      return "That email already has an account. They can sign in, or you can remove and re-invite them.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many invites sent. Wait a few minutes and try again.";
    case "email_address_invalid":
    case "validation_failed":
      return "Please enter a valid email address.";
    case "signup_disabled":
      return "Could not send invite. Contact support — this should not happen for admin invites.";
    case "email_address_not_authorized":
    case "email_provider_disabled":
      return "Could not send the invite email. Configure custom SMTP in Supabase Auth settings.";
    case "unexpected_failure":
      return DATABASE_USER_ERROR_HINT;
  }

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
    return "Invite link is misconfigured. Set NEXT_PUBLIC_SITE_URL on Vercel and add the callback URL in Supabase Auth → URL Configuration.";
  }
  if (lower.includes("invalid email") || lower.includes("unable to validate email")) {
    return "Please enter a valid email address.";
  }
  if (lower.includes("smtp") || lower.includes("email provider")) {
    return "Could not send the invite email. Configure custom SMTP in Supabase Auth settings.";
  }
  if (
    lower.includes("database error saving new user") ||
    lower.includes("database error creating new user")
  ) {
    return DATABASE_USER_ERROR_HINT;
  }

  return message || "Could not send invite. Try again.";
}

async function resolveInviteAuthError(
  adminUrl: string,
  serviceKey: string,
  email: string,
  redirectTo: string,
  metadata: { full_name: string; role: UserRole; invited: boolean },
  error: InviteAuthError,
): Promise<InviteAuthError> {
  if (!isUselessAuthMessage(error.message)) {
    return error;
  }

  try {
    const response = await fetch(`${adminUrl}/auth/v1/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        email,
        data: metadata,
        redirect_to: redirectTo,
      }),
    });
    const body = (await response.json()) as {
      msg?: string;
      error_code?: string;
      message?: string;
    };
    const resolvedMessage = body.msg ?? body.message ?? error.message;
    return {
      message: resolvedMessage,
      code: body.error_code ?? error.code,
      status: response.status,
    };
  } catch {
    return error;
  }
}

function logInviteError(
  context: string,
  email: string,
  error: InviteAuthError,
) {
  console.error(`[inviteTeamMember] ${context}`, {
    email,
    code: error.code,
    status: error.status,
    message: error.message,
  });
}

async function generateInviteLink(
  admin: Awaited<ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>>,
  email: string,
  redirectTo: string,
  metadata: { full_name: string; role: UserRole; invited: boolean },
): Promise<{ userId?: string; inviteLink?: string }> {
  const { data, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { data: metadata, redirectTo },
  });

  if (error) {
    logInviteError("generateLink failed", email, error);
    return {};
  }

  return {
    userId: data.user?.id,
    inviteLink: data.properties?.action_link,
  };
}

function isEmailDeliveryError(error: InviteAuthError): boolean {
  const lower = error.message.toLowerCase();
  if (
    lower.includes("database error saving new user") ||
    lower.includes("database error creating new user")
  ) {
    return false;
  }

  if (
    error.code === "over_email_send_rate_limit" ||
    error.code === "over_request_rate_limit" ||
    error.code === "email_address_not_authorized" ||
    error.code === "email_provider_disabled"
  ) {
    return true;
  }

  return (
    lower.includes("rate limit") ||
    lower.includes("smtp") ||
    lower.includes("email provider") ||
    lower.includes("email send")
  );
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
    const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let admin;
    try {
      admin = createAdminClient();
    } catch {
      return { ok: false, error: ADMIN_CLIENT_UNAVAILABLE_MESSAGE };
    }

    const redirectTo = `${getSiteUrl()}/auth/callback`;
    const metadata = {
      full_name: fullName?.trim() || trimmedEmail.split("@")[0],
      role,
      invited: true as const,
    };

    const { data, error } = await admin.auth.admin.inviteUserByEmail(trimmedEmail, {
      data: metadata,
      redirectTo,
    });

    if (error) {
      const resolvedError =
        adminUrl && serviceKey
          ? await resolveInviteAuthError(
              adminUrl,
              serviceKey,
              trimmedEmail,
              redirectTo,
              metadata,
              error,
            )
          : error;
      logInviteError("inviteUserByEmail failed", trimmedEmail, resolvedError);

      if (isEmailDeliveryError(resolvedError)) {
        const fallback = await generateInviteLink(
          admin,
          trimmedEmail,
          redirectTo,
          metadata,
        );
        if (fallback.inviteLink) {
          revalidatePath("/team");
          return {
            ok: true,
            userId: fallback.userId,
            inviteLink: fallback.inviteLink,
            emailNotSent: true,
          };
        }
      }

      return { ok: false, error: mapInviteError(resolvedError) };
    }

    revalidatePath("/team");
    return { ok: true, userId: data.user?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not send invite. Try again.";
    return { ok: false, error: mapInviteError({ message, status: 500 }) };
  }
}

/** Generate a shareable invite link without sending email (invalidates any prior invite link). */
export async function generateTeamMemberInviteLink(
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
    const metadata = {
      full_name: fullName?.trim() || trimmedEmail.split("@")[0],
      role,
      invited: true as const,
    };

    const link = await generateInviteLink(admin, trimmedEmail, redirectTo, metadata);
    if (!link.inviteLink) {
      return {
        ok: false,
        error: mapInviteError({ message: "Could not generate invite link." }),
      };
    }

    revalidatePath("/team");
    return {
      ok: true,
      userId: link.userId,
      inviteLink: link.inviteLink,
      emailNotSent: true,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not generate invite link.";
    return { ok: false, error: mapInviteError({ message }) };
  }
}
