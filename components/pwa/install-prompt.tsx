"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "meridian-pwa-install-dismissed";

/** Survives React Strict Mode remounts — beforeinstallprompt only fires once per load. */
let capturedPrompt: BeforeInstallPromptEvent | null = null;

function isDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === "true";
  } catch {
    return false;
  }
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function revealPrompt(
  event: BeforeInstallPromptEvent,
  setDeferred: (event: BeforeInstallPromptEvent) => void,
  setVisible: (visible: boolean) => void,
) {
  if (isDismissed() || isStandalone()) return;
  capturedPrompt = event;
  setDeferred(event);
  setVisible(true);
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  const dismiss = useCallback((persist = true) => {
    if (persist) {
      try {
        localStorage.setItem(DISMISS_KEY, "true");
      } catch {
        // ignore storage errors
      }
    }
    capturedPrompt = null;
    setDeferred(null);
    setVisible(false);
  }, []);

  useEffect(() => {
    if (isStandalone() || isDismissed()) return;

    if (capturedPrompt) {
      queueMicrotask(() => revealPrompt(capturedPrompt!, setDeferred, setVisible));
    }

    const handler = (event: Event) => {
      event.preventDefault();
      revealPrompt(event as BeforeInstallPromptEvent, setDeferred, setVisible);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      dismiss(outcome === "accepted");
    } catch {
      dismiss(false);
    }
  }, [deferred, dismiss]);

  if (!visible || !deferred) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-primary/30 bg-[#0D0F12]/95 p-4 shadow-xl backdrop-blur-md">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Download className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Install Meridian</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Add to your home screen for faster access and offline client cache.
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" className="gap-1.5" onClick={() => void handleInstall()}>
              <Download className="h-3.5 w-3.5" />
              Install
            </Button>
            <Button size="sm" variant="ghost" onClick={() => dismiss()}>
              Not now
            </Button>
          </div>
        </div>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => dismiss()}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
