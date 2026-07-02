"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signIn, signUp } from "@/lib/actions/auth";
import { z } from "zod";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().min(2),
});

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    startTransition(async () => {
      try {
        await signIn(values.email, values.password);
        router.push("/clients");
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
            No account?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

export function SignupForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", fullName: "" },
  });

  const onSubmit = (values: z.infer<typeof signupSchema>) => {
    startTransition(async () => {
      try {
        await signUp(values.email, values.password, values.fullName);
        toast.success("Account created! Check your email to confirm.");
        router.push("/login");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Signup failed");
      }
    });
  };

  return (
    <Card className="w-full max-w-md border-border/50">
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input {...form.register("fullName")} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" {...form.register("email")} />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" {...form.register("password")} />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating..." : "Create Account"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
