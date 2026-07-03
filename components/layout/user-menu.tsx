"use client";

import { useRouter } from "next/navigation";
import { LogOut, Settings, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/actions/auth";
import type { Profile } from "@/lib/types";

export function UserMenu({ user }: { user: Profile }) {
  const router = useRouter();
  const initial =
    user.full_name?.[0]?.toUpperCase() ?? user.email[0]?.toUpperCase() ?? "U";
  const displayName = user.full_name ?? user.email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="h-10 gap-2.5 rounded-full border border-primary/25 bg-[#0D0F12]/70 px-2 py-1.5 shadow-sm hover:border-primary/45 hover:bg-primary/10"
            aria-label="Open account menu"
          />
        }
      >
        <Avatar className="h-8 w-8 shrink-0 ring-2 ring-primary/30">
          <AvatarFallback className="bg-gradient-to-br from-primary to-[oklch(0.55_0.12_85)] text-xs font-semibold text-primary-foreground">
            {initial}
          </AvatarFallback>
        </Avatar>
        <span className="hidden max-w-[160px] truncate text-left text-sm font-medium leading-tight text-foreground sm:inline">
          {displayName}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium">{user.full_name ?? "User"}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <p className="mt-1 text-xs capitalize text-primary">{user.role}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <Settings className="h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/settings#profile")}>
          <User className="h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            void signOut();
          }}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
