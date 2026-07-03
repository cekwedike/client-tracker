"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateProfile } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Profile } from "@/lib/types";
import { User } from "lucide-react";

export function ProfileSettings({ user }: { user: Profile }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div id="profile" className="glass-panel gradient-border p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <User className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-foreground">Profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Update how your name appears across Meridian
          </p>
          <form
            className="mt-4 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const fullName = new FormData(form).get("fullName");
              if (typeof fullName !== "string") return;

              startTransition(async () => {
                try {
                  await updateProfile({ fullName });
                  toast.success("Profile updated");
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Update failed");
                }
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                name="fullName"
                defaultValue={user.full_name ?? ""}
                placeholder="Your name"
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user.email} disabled className="opacity-70" />
              <p className="text-xs text-muted-foreground">
                Email is managed by your admin invite. Contact an admin to change it.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input
                value={user.role}
                disabled
                className="capitalize opacity-70"
              />
            </div>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Saving…" : "Save profile"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
