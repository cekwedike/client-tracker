"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

export default function ClientsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[clients]", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  const displayMessage =
    error.message?.trim() ||
    "Something went wrong while loading this page. Try again, or check that your database migrations are up to date.";

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-destructive/30 bg-destructive/5 p-6">
      <h2 className="text-lg font-semibold text-foreground">
        Could not load clients
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{displayMessage}</p>
      {error.digest ? (
        <p className="mt-2 font-mono text-xs text-muted-foreground/80">
          Digest: {error.digest}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={() => reset()}>Try again</Button>
        <Link
          href="/dashboard"
          className={buttonVariants({ variant: "outline" })}
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
