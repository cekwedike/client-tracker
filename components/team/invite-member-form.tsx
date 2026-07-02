"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, UserPlus } from "lucide-react";
import { inviteTeamMember } from "@/lib/actions/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function InviteMemberForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await inviteTeamMember(email.trim(), fullName.trim() || undefined);
        toast.success(`Invite sent to ${email}`);
        setEmail("");
        setFullName("");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Invite failed");
      }
    });
  };

  return (
    <div className="glass-panel gradient-border p-4">
      <div className="mb-3 flex items-center gap-2">
        <UserPlus className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">Invite team member</p>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        Sends a Supabase invite email. New users join as <strong>operator</strong>.
        Requires <code className="rounded bg-muted px-1">SUPABASE_SERVICE_ROLE_KEY</code> in
        .env.local.
      </p>
      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <div className="space-y-1.5">
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ops@company.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="invite-name">Full name (optional)</Label>
          <Input
            id="invite-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Alex Operator"
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={isPending} className="gap-2">
            <Mail className="h-4 w-4" />
            {isPending ? "Sending…" : "Send invite"}
          </Button>
        </div>
      </form>
    </div>
  );
}
