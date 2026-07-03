"use client";

import { SettingsProvider } from "@/components/providers/settings-provider";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import { InstallPrompt } from "@/components/pwa/install-prompt";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      {children}
      <RegisterServiceWorker />
      <InstallPrompt />
    </SettingsProvider>
  );
}
