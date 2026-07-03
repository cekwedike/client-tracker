"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, UserPlus } from "lucide-react";
import { inviteTeamMember } from "@/lib/actions/team";
import { getInviteAssignableRoles } from "@/lib/permissions";
import type { UserRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: "Superadmin",
  admin: "Admin",
  manager: "Manager",
  operator: "Operator",
  viewer: "Viewer",
};

interface InviteMemberFormProps {
  currentUserRole: UserRole;
}

export function InviteMemberForm({ currentUserRole }: InviteMemberFormProps) {
  const router = useRouter();
  const assignableRoles = getInviteAssignableRoles(currentUserRole);
  const defaultRole = assignableRoles.includes("operator")
    ? "operator"
    : assignableRoles[0] ?? "operator";

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await inviteTeamMember(email.trim(), fullName.trim() || undefined, role);
        toast.success(`Invite sent to ${email} as ${ROLE_LABELS[role]}`);
        setEmail("");
        setFullName("");
        setRole(defaultRole);
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Could not send invite. Try again.",
        );
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
        Send an invite email. The recipient can set their password and join the
        team as {ROLE_LABELS[role]}.
      </p>
      <form
        onSubmit={handleSubmit}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_140px_auto]"
      >
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
        <div className="space-y-1.5">
          <Label htmlFor="invite-role">Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
            <SelectTrigger id="invite-role" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {assignableRoles.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end sm:col-span-2 lg:col-span-1">
          <Button type="submit" disabled={isPending} className="gap-2">
            <Mail className="h-4 w-4" />
            {isPending ? "Sending…" : "Send invite"}
          </Button>
        </div>
      </form>
    </div>
  );
}
