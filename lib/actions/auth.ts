"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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

  if (profile) return profile as Profile;

  // Profile row missing but user is authenticated — use auth metadata as fallback
  if (error?.message?.toLowerCase().includes("schema cache")) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? "",
    full_name:
      (user.user_metadata?.full_name as string) ??
      user.email?.split("@")[0] ??
      "User",
    avatar_url: null,
    role: (user.user_metadata?.role as Profile["role"]) ?? "operator",
    created_at: user.created_at,
    updated_at: user.created_at,
  } satisfies Profile;
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.message === "Email not confirmed") {
      throw new Error(
        "Please confirm your email first — check your inbox for the Supabase confirmation link, then try again.",
      );
    }
    throw new Error(error.message);
  }
  revalidatePath("/", "layout");
}

export async function signUp(
  email: string,
  password: string,
  fullName: string,
) {
  const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN;
  if (allowedDomain) {
    const domain = email.split("@")[1];
    if (domain !== allowedDomain) {
      throw new Error(`Signups restricted to @${allowedDomain} emails`);
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role: "operator" },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
    },
  });
  if (error) throw new Error(error.message);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}

export async function updateUserRole(userId: string, role: UserRole) {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();
  if (currentUser?.role !== "admin") {
    throw new Error("Only admins can update roles");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/team");
}
