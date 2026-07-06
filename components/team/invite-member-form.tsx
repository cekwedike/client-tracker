"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { inviteTeamMember } from "@/lib/actions/team";
import {
  DEFAULT_PASSWORD_HINT,
  generateDefaultPassword,
} from "@/lib/default-password";
import { getInviteAssignableRoles } from "@/lib/permissions";
import type { UserRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
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

function inviteToastError(error: unknown) {
  const message =
    typeof error === "string" && error.trim() && error !== "{}"
      ? error
      : "Could not add teammate. Try again.";
  toast.error(message);
}

interface InviteMemberFormProps {
  currentUserRole: UserRole;
}

type AddedMemberBanner = {
  email: string;
  fullName: string;
  defaultPassword: string;
};

export function InviteMemberForm({ currentUserRole }: InviteMemberFormProps) {
  const router = useRouter();
  const assignableRoles = getInviteAssignableRoles(currentUserRole);
  const defaultRole = assignableRoles.includes("operator")
    ? "operator"
    : assignableRoles[0] ?? "operator";

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [banner, setBanner] = useState<AddedMemberBanner | null>(null);
  const [isPending, startTransition] = useTransition();

  const passwordPreview = useMemo(() => {
    const name = fullName.trim() || email.trim().split("@")[0] || "Teammate";
    return generateDefaultPassword(name);
  }, [fullName, email]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sentEmail = email.trim();
    const name = fullName.trim();
    if (!name) {
      toast.error("Full name is required to generate the default password.");
      return;
    }

    startTransition(async () => {
      const result = await inviteTeamMember(sentEmail, name, role);
      if (!result.ok) {
        inviteToastError(result.error);
        return;
      }

      const defaultPassword = result.defaultPassword ?? passwordPreview;
      setBanner({ email: sentEmail, fullName: name, defaultPassword });
      toast.success(`${name} added to the team`, {
        description: "Share their login email and default password below.",
      });
      setEmail("");
      setFullName("");
      setRole(defaultRole);
      router.refresh();
    });
  };

  return (
    <div className="glass-panel gradient-border p-4">
      <div className="mb-3 flex items-center gap-2">
        <UserPlus className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">Add team member</p>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        Creates an account with a default password. They sign in at the login page
        and are prompted to choose a new password on first login.
      </p>
      <ul className="mb-4 list-inside list-disc space-y-1 text-xs text-muted-foreground">
        <li>First 5 letters of their name (spaces removed)</li>
        <li>Then <span className="font-mono text-foreground">@</span> and the current year</li>
        <li>First letter of the password is uppercase</li>
      </ul>
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
          <Label htmlFor="invite-name">Full name</Label>
          <Input
            id="invite-name"
            required
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
        <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-1">
          <Button type="submit" disabled={isPending} className="gap-2">
            <UserPlus className="h-4 w-4" />
            {isPending ? "Adding…" : "Add teammate"}
          </Button>
        </div>
      </form>

      <div className="mt-4 rounded-lg border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Default password preview</p>
        <p className="mt-1">{DEFAULT_PASSWORD_HINT}</p>
        <p className="mt-2 font-mono text-sm text-foreground">{passwordPreview}</p>
      </div>

      {banner && (
        <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
          <p>
            <strong className="text-foreground">{banner.fullName}</strong> can sign in with:
          </p>
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={banner.email}
                className="h-8 text-[11px]"
                aria-label="Login email"
              />
              <CopyButton
                value={banner.email}
                showToast
                toastMessage="Email copied"
                size="sm"
                variant="outline"
              />
            </div>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={banner.defaultPassword}
                className="h-8 font-mono text-[11px]"
                aria-label="Default password"
              />
              <CopyButton
                value={banner.defaultPassword}
                showToast
                toastMessage="Password copied"
                size="sm"
                variant="outline"
              />
            </div>
          </div>
          <p className="mt-2">
            They must change this password after their first sign-in.
          </p>
        </div>
      )}
    </div>
  );
}
