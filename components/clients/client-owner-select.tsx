"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateClientOwner } from "@/lib/actions/clients";
import type { Profile } from "@/lib/types";
import { toast } from "sonner";
import { UserCircle2 } from "lucide-react";

interface ClientOwnerSelectProps {
  clientId: string;
  currentOwnerId: string | null;
  currentOwnerName?: string | null;
  profiles: Profile[];
}

export function ClientOwnerSelect({
  clientId,
  currentOwnerId,
  currentOwnerName,
  profiles,
}: ClientOwnerSelectProps) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (value: string | null) => {
    const ownerId = value || null;
    startTransition(async () => {
      try {
        await updateClientOwner(clientId, ownerId);
        toast.success(ownerId ? "Owner assigned" : "Owner cleared");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to update owner");
      }
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <UserCircle2 className="h-3.5 w-3.5" />
        Assigned operator
      </div>
      <Select
        value={currentOwnerId ?? ""}
        onValueChange={handleChange}
        disabled={isPending}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Unassigned">
            {currentOwnerName ?? "Unassigned"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Unassigned</SelectItem>
          {profiles.map((profile) => (
            <SelectItem key={profile.id} value={profile.id}>
              {profile.full_name ?? profile.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
