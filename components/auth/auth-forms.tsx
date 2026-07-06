"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setPassword, signIn } from "@/lib/actions/auth";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const setPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function useInviteHashRedirect() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || (!hash.includes("access_token") && !hash.includes("type=invite"))) {
      return;
    }
    router.replace(`/auth/callback${window.location.search}${hash}`);
  }, [router]);
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useInviteHashRedirect();

  const errorHint = searchParams.get("error");
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    setFormError(null);
    startTransition(async () => {
      const result = await signIn(values.email, values.password);
      if (!result.ok) {
        setFormError(result.error);
        toast.error(result.error);
        return;
      }
      router.push(redirectTo);
      router.refresh();
    });
  };

  return (
    <Card className="w-full max-w-md border-border/50">
      <CardHeader>
        <CardTitle>Sign in to Meridian</CardTitle>
      </CardHeader>
      <CardContent>
        {errorHint === "invite_only" && (
          <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200/90">
            Access is invite-only. Ask an admin to send you an invitation.
          </p>
        )}
        {errorHint === "auth_callback_failed" && (
          <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200/90">
            This invitation link is invalid or has expired. Ask your admin to send a
            new invite.
          </p>
        )}
        {errorHint === "deactivated" && (
          <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200/90">
            Your account has been deactivated. Contact an admin.
          </p>
        )}
        {formError && (
          <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200/90">
            {formError}
          </p>
        )}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" {...form.register("email")} />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <PasswordInput autoComplete="current-password" {...form.register("password")} />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Signing in..." : "Sign In"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Meridian is invite-only. New accounts are created by an admin.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

export function SetPasswordForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const form = useForm({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled) return;
        setHasSession(Boolean(user));
      } catch {
        if (!cancelled) setHasSession(false);
      } finally {
        if (!cancelled) setSessionChecked(true);
      }
    }

    checkSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = (values: z.infer<typeof setPasswordSchema>) => {
    setFormError(null);
    startTransition(async () => {
      const result = await setPassword(values.password);
      if (!result.ok) {
        setFormError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Password set. Welcome to Meridian.");
      router.push("/dashboard");
      router.refresh();
    });
  };

  if (!sessionChecked) {
    return (
      <Card className="w-full max-w-md border-border/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </CardContent>
      </Card>
    );
  }

  if (!hasSession) {
    return (
      <Card className="w-full max-w-md border-border/50">
        <CardHeader>
          <CardTitle>Set up your account</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200/90">
            Open the invitation link from your email to set your password. If the
            link expired, ask your admin for a new invite.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-border/50">
      <CardHeader>
        <CardTitle>Set up your account</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          Create a password to finish accepting your Meridian invitation.
        </p>
        {formError && (
          <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200/90">
            {formError}
          </p>
        )}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">Password</Label>
            <PasswordInput
              id="new-password"
              autoComplete="new-password"
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-red-400">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <PasswordInput
              id="confirm-password"
              autoComplete="new-password"
              {...form.register("confirmPassword")}
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-sm text-red-400">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Saving…" : "Set password & continue"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
