"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Link2, Mail, UserPlus } from "lucide-react";
import {
  generateTeamMemberInviteLink,
  inviteTeamMember,
} from "@/lib/actions/team";
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

const INVITE_EMAIL_HINT =
  "If they don't see it, check spam or configure custom SMTP in Supabase Auth settings.";

function inviteToastError(error: unknown) {
  const message =
    typeof error === "string" && error.trim() && error !== "{}"
      ? error
      : "Could not send invite. Try again.";
  toast.error(message);
}

interface InviteMemberFormProps {
  currentUserRole: UserRole;
}

type InviteBanner = {
  email: string;
  inviteLink?: string;
  emailNotSent?: boolean;
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
  const [banner, setBanner] = useState<InviteBanner | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isGeneratingLink, startGenerateLink] = useTransition();

  const applyInviteResult = (
    sentEmail: string,
    result: Extract<Awaited<ReturnType<typeof inviteTeamMember>>, { ok: true }>,
  ) => {
    if (result.emailNotSent && result.inviteLink) {
      setBanner({
        email: sentEmail,
        inviteLink: result.inviteLink,
        emailNotSent: true,
      });
      toast.success(`Invite link created for ${sentEmail}`, {
        description:
          "Email could not be sent (rate limit or SMTP). Copy the link below and share it manually.",
      });
      return;
    }

    setBanner({ email: sentEmail });
    toast.success(`Invite sent to ${sentEmail}`, {
      description: INVITE_EMAIL_HINT,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sentEmail = email.trim();
    startTransition(async () => {
      const result = await inviteTeamMember(
        sentEmail,
        fullName.trim() || undefined,
        role,
      );
      if (!result.ok) {
        inviteToastError(result.error);
        return;
      }
      applyInviteResult(sentEmail, result);
      setEmail("");
      setFullName("");
      setRole(defaultRole);
      router.refresh();
    });
  };

  const handleGenerateLink = () => {
    const sentEmail = email.trim();
    if (!sentEmail) {
      toast.error("Enter an email address first.");
      return;
    }

    startGenerateLink(async () => {
      const result = await generateTeamMemberInviteLink(
        sentEmail,
        fullName.trim() || undefined,
        role,
      );
      if (!result.ok) {
        inviteToastError(result.error);
        return;
      }
      setBanner({
        email: sentEmail,
        inviteLink: result.inviteLink,
        emailNotSent: true,
      });
      toast.success(`Invite link ready for ${sentEmail}`, {
        description:
          "No email was sent. Copy the link below and share it with the invitee.",
      });
      router.refresh();
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
        team as {ROLE_LABELS[role]}. Sign-up is invite-only — disabling public
        sign-up in Supabase does not block admin invites.
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
        <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-1">
          <Button type="submit" disabled={isPending || isGeneratingLink} className="gap-2">
            <Mail className="h-4 w-4" />
            {isPending ? "Sending…" : "Send invite"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending || isGeneratingLink || !email.trim()}
            className="gap-2"
            onClick={handleGenerateLink}
          >
            <Link2 className="h-4 w-4" />
            {isGeneratingLink ? "Generating…" : "Copy link instead"}
          </Button>
        </div>
      </form>

      {banner && (
        <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
          {banner.emailNotSent ? (
            <p>
              Share this invite link with <strong className="text-foreground">{banner.email}</strong>{" "}
              directly (no email was sent):
            </p>
          ) : (
            <p>
              Invite email sent to <strong className="text-foreground">{banner.email}</strong>.{" "}
              {INVITE_EMAIL_HINT}
            </p>
          )}

          {banner.inviteLink ? (
            <div className="mt-2 flex items-center gap-2">
              <Input
                readOnly
                value={banner.inviteLink}
                className="h-8 font-mono text-[11px]"
                aria-label="Invite link"
              />
              <CopyButton
                value={banner.inviteLink}
                showToast
                toastMessage="Invite link copied"
                size="sm"
                variant="outline"
              />
            </div>
          ) : (
            <div className="mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={isGeneratingLink}
                onClick={handleGenerateLink}
              >
                <Link2 className="h-3.5 w-3.5" />
                {isGeneratingLink ? "Generating…" : "Generate invite link to copy"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
