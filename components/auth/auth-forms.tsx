"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signIn } from "@/lib/actions/auth";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const errorHint = searchParams.get("error");
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    startTransition(async () => {
      try {
        await signIn(values.email, values.password);
        router.push(redirectTo);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Login failed");
      }
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
        {errorHint === "deactivated" && (
          <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200/90">
            Your account has been deactivated. Contact an admin.
          </p>
        )}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" {...form.register("email")} />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" {...form.register("password")} />
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
