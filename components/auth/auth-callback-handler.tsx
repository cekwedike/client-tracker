"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function resolvePostAuthPath(
  next: string | null,
  hashType: string | null,
): string {
  if (hashType === "invite" || hashType === "recovery") {
    return "/auth/set-password";
  }
  return next ?? "/auth/set-password";
}

export function AuthCallbackHandler() {
  const router = useRouter();
  const [message, setMessage] = useState("Completing sign-in…");

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      const supabase = createClient();
      const url = new URL(window.location.href);
      const next = url.searchParams.get("next");
      const code = url.searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (error) {
          router.replace("/login?error=auth_callback_failed");
          return;
        }
        router.replace(resolvePostAuthPath(next, null));
        router.refresh();
        return;
      }

      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const hashType = hashParams.get("type");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (cancelled) return;
        if (error) {
          router.replace("/login?error=auth_callback_failed");
          return;
        }
        router.replace(resolvePostAuthPath(next, hashType));
        router.refresh();
        return;
      }

      if (cancelled) return;
      setMessage("Invalid or expired link.");
      router.replace("/login?error=auth_callback_failed");
    }

    handleCallback().catch(() => {
      if (!cancelled) {
        router.replace("/login?error=auth_callback_failed");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <p className="text-sm text-muted-foreground" role="status">
      {message}
    </p>
  );
}
