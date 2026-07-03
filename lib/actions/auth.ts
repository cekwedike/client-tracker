"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canChangeRole } from "@/lib/permissions";
import type { Profile, UserRole } from "@/lib/types";

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
    .single();

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

export async function signIn(email: string, password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.message === "Email not confirmed") {
      throw new Error(
        "Please confirm your email first — check your inbox for the invitation link, then try again.",
      );
    }
    throw new Error(error.message);
  }

  const profile = await getCurrentUser();
  if (!profile) {
    await supabase.auth.signOut();
    throw new Error(
      "Access is invite-only. Ask an admin to invite you to Meridian.",
    );
  }

  revalidatePath("/", "layout");
}

export async function signUp() {
  throw new Error(
    "Open registration is disabled. Ask an admin to invite you to Meridian.",
  );
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
