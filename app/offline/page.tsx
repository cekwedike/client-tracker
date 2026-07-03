"use client";

import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="dark flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <WifiOff className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-semibold text-foreground">You&apos;re offline</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Meridian can show cached clients when you were last online. Reconnect to
        sync the latest data.
      </p>
      <div className="mt-6 flex gap-3">
        <Button render={<Link href="/clients" />}>View cached clients</Button>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    </div>
  );
}
