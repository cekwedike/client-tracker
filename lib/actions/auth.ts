"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canChangeRole } from "@/lib/permissions";
import type { Profile, UserRole } from "@/lib/types";

export type SignInResult =
  | { ok: true }
  | { ok: false; error: string };

export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    const row = profile as Profile;
    if (row.is_active === false) return null;
    return row;
  }

  if (error?.message?.toLowerCase().includes("schema cache")) {
    return null;
  }

  // No profile — user was not invited
  return null;
}

async function repairOrphanProfile(user: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}): Promise<Profile | null> {
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();

    const { count, error: countError } = await admin
      .from("profiles")
      .select("*", { count: "exact", head: true });

    if (countError) return null;

    const isInvited = user.user_metadata?.invited === true;
    const profileCount = count ?? 0;

    if (profileCount > 0 && !isInvited) {
      return null;
    }

    const role: UserRole =
      profileCount === 0
        ? "superadmin"
        : ((user.user_metadata?.role as UserRole | undefined) ?? "operator");

    const { data, error } = await admin
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email ?? "",
        full_name:
          (user.user_metadata?.full_name as string | undefined) ??
          user.email?.split("@")[0] ??
          "User",
        role,
      })
      .select("*")
      .maybeSingle();

    if (error || !data) return null;
    return data as Profile;
  } catch {
    return null;
  }
}

export async function signIn(
  email: string,
  password: string,
): Promise<SignInResult> {
  const supabase = await createClient();
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message === "Email not confirmed") {
      return {
        ok: false,
        error:
          "Please confirm your email first — check your inbox for the invitation link, then try again.",
      };
    }
    if (error.message === "Invalid login credentials") {
      return {
        ok: false,
        error: "Incorrect email or password. Please try again.",
      };
    }
    return { ok: false, error: error.message };
  }

  let profile = await getCurrentUser();
  if (!profile && authData.user) {
    profile = await repairOrphanProfile(authData.user);
  }

  if (!profile) {
    await supabase.auth.signOut();
    return {
      ok: false,
      error: "Access is invite-only. Ask an admin to invite you to Meridian.",
    };
  }

  if (profile.is_active === false) {
    await supabase.auth.signOut();
    return {
      ok: false,
      error: "Your account has been deactivated. Contact an admin.",
    };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function signUp() {
  throw new Error(
    "Open registration is disabled. Ask an admin to invite you to Meridian.",
  );
}

export async function setPassword(password: string): Promise<SignInResult> {
  const trimmed = password.trim();
  if (trimmed.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      error:
        "Your session expired. Open the invitation link from your email again.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: trimmed });
  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}

export async function updateProfile(input: {
  fullName: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const fullName = input.fullName.trim();
  if (fullName.length < 2) {
    throw new Error("Name must be at least 2 characters");
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", user.id);

  if (profileError) throw new Error(profileError.message);

  const { error: authError } = await supabase.auth.updateUser({
    data: { full_name: fullName },
  });

  if (authError) throw new Error(authError.message);

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function updateUserRole(userId: string, role: UserRole) {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();
  if (!currentUser || !canChangeRole(currentUser.role)) {
    throw new Error("Only admins can update roles");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/team");
}
