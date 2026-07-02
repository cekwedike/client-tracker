"use client";

import { SettingsProvider } from "@/components/providers/settings-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <SettingsProvider>{children}</SettingsProvider>;
}
